import { pgPool } from "../inits/postgres";

const SESSION_COOKIE = "session_id";

export const authenticate = async (req: any, res: any, next: any) => {
  // Đọc session ID từ cookie httpOnly
  const sessionId = req.cookies?.[SESSION_COOKIE];

  // Fallback: vẫn hỗ trợ Authorization header (cho Swagger / testing)
  const authHeader = req.headers.authorization;
  const bearerSession = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  const sid = sessionId || bearerSession;

  if (!sid) {
    return res.status(401).json({ error: "Chưa đăng nhập" });
  }

  try {
    // Tra session ID trong DB, lấy thông tin user
    const { rows } = await pgPool.query(
      `SELECT id, username, role, role_id, branch_id, department_id, full_name, session_id, last_active_at
       FROM users 
       WHERE session_id = $1 AND is_active = true`,
      [sid]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn" });
    }

    const userData = rows[0];

    // Kiểm tra session hết hạn sau 24 giờ không hoạt động
    if (userData.last_active_at) {
      const lastActive = new Date(userData.last_active_at).getTime();
      const now = Date.now();
      const diffHours = (now - lastActive) / (1000 * 60 * 60);
      if (diffHours > 24) {
        await pgPool.query(`UPDATE users SET session_id = NULL WHERE id = $1`, [userData.id]);
        res.clearCookie(SESSION_COOKIE, { path: '/' });
        return res.status(401).json({ error: "Phiên đăng nhập đã hết hạn (24 giờ không hoạt động). Vui lòng đăng nhập lại." });
      }
    }

    // Load permissions từ bảng role_permissions
    let permissions: string[] = [];
    if (userData.role_id) {
      const { rows: permRows } = await pgPool.query(
        `SELECT p.module, p.action 
         FROM role_permissions rp
         JOIN permissions p ON rp.permission_id = p.id
         WHERE rp.role_id = $1`,
        [userData.role_id]
      );
      permissions = permRows.map((r: any) => `${r.module}:${r.action}`);
    }

    // Cập nhật thời gian hoạt động cuối
    await pgPool.query(
      'UPDATE users SET last_active_at = CURRENT_TIMESTAMP WHERE id = $1',
      [userData.id]
    );

    // Gắn thông tin user vào request
    req.user = {
      id: userData.id,
      username: userData.username,
      role: userData.role,
      role_id: userData.role_id,
      branch_id: userData.branch_id,
      department_id: userData.department_id,
      full_name: userData.full_name,
      permissions,
    };

    next();
  } catch (err) {
    console.error("authenticate error:", err);
    res.status(500).json({ error: "Lỗi xác thực phiên đăng nhập" });
  }
};

// Middleware kiểm tra quyền cụ thể theo module:action
// SUPER_ADMIN luôn có toàn quyền
export const requirePermission = (module: string, action: string) => {
  return (req: any, res: any, next: any) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: "Chưa xác thực" });

    // SUPER_ADMIN bypass mọi permission check
    if (user.role === 'SUPER_ADMIN') return next();

    const key = `${module}:${action}`;
    if (user.permissions && user.permissions.includes(key)) {
      return next();
    }

    return res.status(403).json({ error: `Bạn không có quyền thực hiện thao tác này (${module}:${action})` });
  };
};
