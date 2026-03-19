import bcrypt from "bcryptjs";
import crypto from "crypto";
import { pgPool } from "../../inits/postgres";

// Cookie name cố định
const SESSION_COOKIE = "session_id";

// Thời gian sống session: 24 giờ
const SESSION_MAX_AGE = 24 * 60 * 60 * 1000;

export const login = async (req: any, res: any) => {
  const { username, password } = req.body;
  try {
    const { rows } = await pgPool.query(
      `SELECT * FROM users WHERE username = $1 AND is_active = true`,
      [username]
    );

    const userData = rows[0];

    if (!userData || !bcrypt.compareSync(password, userData.password)) {
      return res.status(401).json({ error: "Sai tài khoản hoặc mật khẩu" });
    }

    if (userData.last_active_at) {
      const lastActive = new Date(userData.last_active_at).getTime();
      const now = new Date().getTime();
      const diffSeconds = (now - lastActive) / 1000;
      if (diffSeconds < 60) {
        return res.status(403).json({ error: "Tài khoản đang được đăng nhập ở nơi khác. Vui lòng đăng xuất ở thiết bị cũ hoặc chờ 1 phút." });
      }
    }

    // Tạo session ID ngẫu nhiên (UUID v4)
    const sessionId = crypto.randomUUID();

    // Load permissions từ role_permissions
    let permissions: string[] = [];
    if (userData.role && userData.role !== 'SUPER_ADMIN') {
      const { rows: permRows } = await pgPool.query(
        `SELECT p.module, p.action 
         FROM role_permissions rp
         JOIN permissions p ON rp.permission_id = p.id
         JOIN roles r ON rp.role_id = r.id
         WHERE r.name = $1`,
        [userData.role]
      );
      permissions = permRows.map((r: any) => `${r.module}:${r.action}`);
    }

    // Lưu session ID vào DB
    await pgPool.query(
      `UPDATE users SET session_id = $1, last_active_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [sessionId, userData.id]
    );

    // Set httpOnly cookie (JS không đọc được — an toàn hơn localStorage/sessionStorage)
    res.cookie(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE,
      path: '/',
    });

    const user = {
      id: userData.id,
      username: userData.username,
      role: userData.role,
      full_name: userData.full_name,
      department_id: userData.department_id,
      branch_id: userData.branch_id,
      permissions,
    };

    // Không cần trả token nữa — chỉ trả thông tin user để FE hiển thị UI
    res.json({ user });
  } catch (err) {
    console.error("Login route error:", err);
    res.status(500).json({ error: "Lỗi đăng nhập" });
  }
};

export const logout = async (req: any, res: any) => {
  const userId = req.user?.id;
  try {
    if (userId) {
      await pgPool.query(
        `UPDATE users SET session_id = NULL, last_active_at = NULL WHERE id = $1`,
        [userId]
      );
    }
    // Xóa cookie
    res.clearCookie(SESSION_COOKIE, { path: '/' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Lỗi đăng xuất" });
  }
};

export const checkAuth = async (req: any, res: any) => {
  res.json({ success: true });
};

export const changePassword = async (req: any, res: any) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user.id;
  try {
    const { rows } = await pgPool.query(`SELECT password FROM users WHERE id = $1`, [userId]);
    const dbUser = rows[0];

    if (!dbUser || !bcrypt.compareSync(oldPassword, dbUser.password)) {
      return res.status(400).json({ error: "Mật khẩu cũ không đúng" });
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ error: "Mật khẩu mới không đủ mạnh (tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt)" });
    }
    const hashedNewPassword = bcrypt.hashSync(newPassword, 10);
    await pgPool.query(`UPDATE users SET password = $1 WHERE id = $2`, [hashedNewPassword, userId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Lỗi hệ thống khi đổi mật khẩu" });
  }
};
