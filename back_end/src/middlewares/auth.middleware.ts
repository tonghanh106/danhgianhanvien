import jwt from "jsonwebtoken";
import { ENV } from "../configs/env.config";
import { pgPool } from "../inits/postgres";

export const authenticate = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token provided" });
  const token = authHeader.split(" ")[1];
  try {
    const decoded: any = jwt.verify(token, ENV.JWT_SECRET);

    // Check if this token is still valid (not replaced by a newer login)
    // Tạm thời cột lưu token trong init.sql là session_id, ta query theo cột session_id.
    const { rows } = await pgPool.query('SELECT session_id FROM users WHERE id = $1', [decoded.id]);
    
    if (rows.length === 0) {
      return res.status(401).json({ error: "Lỗi xác thực người dùng (User không tồn tại)" });
    }

    const userData = rows[0];

    if (userData.session_id === 'FORCE_LOGOUT_PERMISSIONS') {
      return res.status(401).json({ error: "Quyền hạn của tài khoản đã thay đổi, hệ thống yêu cầu đăng nhập lại để cập nhật." });
    }

    if (userData.session_id !== token) {
      return res.status(401).json({ error: "Phiên đăng nhập đã hết hạn hoặc được đăng nhập ở nơi khác" });
    }

    // Update last active time for this user (session heartbeat)
    await pgPool.query('UPDATE users SET last_active_at = CURRENT_TIMESTAMP WHERE id = $1', [decoded.id]);

    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};
