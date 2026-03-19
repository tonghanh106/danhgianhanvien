import { pgPool } from "../../inits/postgres";

export const getDepartments = async (req: any, res: any) => {
  const user = req.user;
  try {
    let sql = `
      SELECT d.id, d.name, d.branch_id, b.name as branch_name 
      FROM departments d 
      LEFT JOIN branches b ON d.branch_id = b.id 
      WHERE 1=1
    `;
    const params: any[] = [];
    let pIdx = 1;

    if (user.role !== 'SUPER_ADMIN') {
      if (user.branch_id) {
        sql += ` AND d.branch_id = $${pIdx++}`;
        params.push(user.branch_id);
      }
    }
    
    sql += ` ORDER BY d.id ASC`;
    const { rows } = await pgPool.query(sql, params);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "Lỗi lấy danh sách bộ phận" });
  }
};

export const createDepartment = async (req: any, res: any) => {
  const { name, branch_id } = req.body;
  const user = req.user;
  if (user.role !== 'SUPER_ADMIN') {
    if (branch_id && parseInt(branch_id) !== user.branch_id) return res.status(403).json({ error: "Không có quyền tạo bộ phận cho chi nhánh khác" });
  }

  const newBranchId = user.role !== 'SUPER_ADMIN' ? user.branch_id : (branch_id || null);

  try {
    const { rows } = await pgPool.query(
      `INSERT INTO departments (name, branch_id) VALUES ($1, $2) RETURNING *`,
      [name, newBranchId]
    );
    res.json(rows[0]);
  } catch (e: any) {
    res.status(400).json({ error: "Bộ phận đã tồn tại hoặc mã chi nhánh không hợp lệ" });
  }
};

export const updateDepartment = async (req: any, res: any) => {
  const { name, branch_id } = req.body;
  const user = req.user;
  const { id } = req.params;
  try {
    const { rows } = await pgPool.query(`SELECT branch_id FROM departments WHERE id = $1`, [id]);
    const existing = rows[0];
    if (!existing) return res.status(404).json({ error: "Bộ phận không tồn tại" });

    if (user.role !== 'SUPER_ADMIN') {
      if (existing.branch_id !== user.branch_id) return res.status(403).json({ error: "Không có quyền sửa bộ phận này" });
      if (branch_id && parseInt(branch_id) !== user.branch_id) return res.status(403).json({ error: "Không thể chuyển bộ phận sang chi nhánh khác" });
    }
    
    await pgPool.query(
      `UPDATE departments SET name = $1, branch_id = $2 WHERE id = $3`,
      [name, branch_id || null, id]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: "Lỗi cập nhật bộ phận" });
  }
};

export const deleteDepartment = async (req: any, res: any) => {
  const user = req.user;
  const { id } = req.params;
  try {
    const { rows } = await pgPool.query(`SELECT branch_id FROM departments WHERE id = $1`, [id]);
    const existing = rows[0];
    if (!existing) return res.status(404).json({ error: "Bộ phận không tồn tại" });

    if (user.role !== 'SUPER_ADMIN') {
      if (user.branch_id && existing.branch_id !== user.branch_id) return res.status(403).json({ error: "Không có quyền xóa bộ phận này" });
    }
    
    await pgPool.query(`DELETE FROM departments WHERE id = $1`, [id]);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: "Lỗi không xóa được bộ phận (Ràng buộc dữ liệu Nhân viên, Đánh giá)" });
  }
};
