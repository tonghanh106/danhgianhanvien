import bcrypt from "bcryptjs";
import { pgPool } from "../../inits/postgres";

export const getUsers = async (req: any, res: any) => {
  const user = req.user;
  try {
    let sql = `
      SELECT u.id, u.username, u.full_name, u.role, u.department_id, u.branch_id, 
             d.name as department_name, b.name as branch_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN branches b ON u.branch_id = b.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (user.role === 'ADMIN') {
      if (user.branch_id) {
        sql += ` AND u.branch_id = $${paramIndex++}`;
        params.push(user.branch_id);
      } else {
        sql += ` AND u.id = $${paramIndex++}`;
        params.push(user.id);
      }
    } else if (user.role === 'USER') {
      if (user.department_id) {
        sql += ` AND u.department_id = $${paramIndex++}`;
        params.push(user.department_id);
      } else {
        sql += ` AND u.id = $${paramIndex++}`;
        params.push(user.id);
      }
    }

    sql += ` ORDER BY u.id DESC`;

    const { rows } = await pgPool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("getUsers error:", err);
    res.status(500).json({ error: "Lỗi lấy danh sách người dùng" });
  }
};

export const createUser = async (req: any, res: any) => {
  const { username, password, full_name, role, role_id, department_id, branch_id } = req.body;
  const currentUser = req.user;

  const lowerUsername = (username || '').toLowerCase();
  const usernameRegex = /^[a-z0-9@.]{5,24}$/;
  if (!usernameRegex.test(lowerUsername)) return res.status(400).json({ error: "Tên tài khoản phải từ 5-24 ký tự, chỉ chứa chữ cái thường, số, @ và dấu chấm." });
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
  if (!passwordRegex.test(password)) return res.status(400).json({ error: "Mật khẩu phải tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường, chữ số và ký tự đặc biệt (!@#$%^&*)" });

  if (currentUser.role === 'ADMIN') {
    if (branch_id && parseInt(branch_id) !== currentUser.branch_id) return res.status(403).json({ error: "Bạn chỉ có thể tạo người dùng trong chi nhánh của mình" });
  } else if (currentUser.role === 'USER') {
    return res.status(403).json({ error: "Bạn không có quyền tạo người dùng" });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const finalBranchId = branch_id || (currentUser.role === 'ADMIN' ? currentUser.branch_id : null);
  const finalDepartmentId = department_id || null;

  try {
    const { rows } = await pgPool.query(
      `INSERT INTO users (username, password, full_name, role, department_id, branch_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [lowerUsername, hashedPassword, full_name, role, finalDepartmentId, finalBranchId]
    );
    res.json({ id: rows[0].id });
  } catch (e: any) {
    console.error("createUser error:", e);
    if (e.code === '23505') {
      return res.status(400).json({ error: "Tên đăng nhập đã tồn tại" });
    }
    res.status(400).json({ error: "Lỗi hệ thống khi tạo tài khoản" });
  }
};

export const updateUser = async (req: any, res: any) => {
  const { username, password, full_name, role, department_id, branch_id } = req.body;
  const { id } = req.params;
  const lowerUsername = (username || '').toLowerCase();

  try {
    const checkQuery = await pgPool.query(`SELECT role, department_id, branch_id FROM users WHERE id = $1`, [id]);
    const oldUser = checkQuery.rows[0];
    if (!oldUser) return res.status(404).json({ error: "Không tìm thấy user" });

    // Nếu đổi quyền (Role/Branch/Dept) thì xóa session buộc user đăng nhập lại
    const changedPermissions = oldUser.role !== role || oldUser.department_id != department_id || oldUser.branch_id != branch_id;

    const finalBranchId = branch_id || null;
    const finalDepartmentId = department_id || null;

    if (password) {
      const hashedPassword = bcrypt.hashSync(password, 10);
      const updateSql = `
        UPDATE users 
        SET username = $1, password = $2, full_name = $3, role = $4, department_id = $5, branch_id = $6
            ${changedPermissions ? ', session_id = NULL' : ''}
        WHERE id = $7
      `;
      await pgPool.query(updateSql, [lowerUsername, hashedPassword, full_name, role, finalDepartmentId, finalBranchId, id]);
    } else {
      const updateSql = `
        UPDATE users 
        SET username = $1, full_name = $2, role = $3, department_id = $4, branch_id = $5
            ${changedPermissions ? ', session_id = NULL' : ''}
        WHERE id = $6
      `;
      await pgPool.query(updateSql, [lowerUsername, full_name, role, finalDepartmentId, finalBranchId, id]);
    }

    res.json({ success: true });
  } catch (e: any) {
    console.error("updateUser error:", e);
    if (e.code === '23505') return res.status(400).json({ error: "Tên đăng nhập trùng lập" });
    res.status(400).json({ error: "Lỗi khi cập nhật người dùng" });
  }
};

export const deleteUser = async (req: any, res: any) => {
  try {
    await pgPool.query(`DELETE FROM users WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: "Lỗi khi xóa người dùng (Có thể user này đang bị ràng buộc khóa ngoại)" });
  }
};
