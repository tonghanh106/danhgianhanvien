import { pgPool } from "../../inits/postgres";

export const getBranches = async (req: any, res: any) => {
  const user = req.user;
  try {
    let sql = `SELECT * FROM branches WHERE 1=1`;
    const params: any[] = [];
    if (user.role !== 'SUPER_ADMIN' && user.branch_id) {
      sql += ` AND id = $1`;
      params.push(user.branch_id);
    }
    sql += ` ORDER BY id ASC`;
    const { rows } = await pgPool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Lỗi lấy danh sách chi nhánh" });
  }
};

export const createBranch = async (req: any, res: any) => {
  const { name } = req.body;
  try {
    const { rows } = await pgPool.query(
      `INSERT INTO branches (name) VALUES ($1) RETURNING *`,
      [name]
    );
    res.json(rows[0]);
  } catch (e: any) {
    if (e.code === '23505') return res.status(400).json({ error: "Chi nhánh đã tồn tại" });
    res.status(500).json({ error: "Lỗi hệ thống khi tạo chi nhánh mới" });
  }
};

export const updateBranch = async (req: any, res: any) => {
  try {
    const { rowCount } = await pgPool.query(
      `UPDATE branches SET name = $1 WHERE id = $2`,
      [req.body.name, req.params.id]
    );
    if (!rowCount) return res.status(404).json({ error: "Chi nhánh không tồn tại" });
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: "Lỗi khi cập nhật chi nhánh" });
  }
};

export const deleteBranch = async (req: any, res: any) => {
  try {
    await pgPool.query(`DELETE FROM branches WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: "Không được xóa (Đang chứa dữ liệu User, Department, v.v)" });
  }
};
