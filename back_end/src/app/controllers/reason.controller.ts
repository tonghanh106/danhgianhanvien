import { pgPool } from "../../inits/postgres";

export const getReasons = async (req: any, res: any) => {
  const user = req.user;
  try {
    let sql = `
      SELECT r.id, r.stars, r.reason_text, r.created_at, r.department_id,
             d.name as department_name, b.name as branch_name
      FROM reasons r
      LEFT JOIN departments d ON r.department_id = d.id
      LEFT JOIN branches b ON d.branch_id = b.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let pIdx = 1;

    if (user.role?.toUpperCase() === 'ADMIN' && user.branch_id) {
      sql += ` AND (d.branch_id = $${pIdx} OR r.department_id IS NULL)`;
      params.push(user.branch_id);
      pIdx++;
    } else if (user.role?.toUpperCase() === 'USER' && user.department_id) {
      sql += ` AND (r.department_id = $${pIdx} OR r.department_id IS NULL)`;
      params.push(user.department_id);
      pIdx++;
    }
    
    sql += ` ORDER BY r.stars DESC, r.id ASC`;

    const { rows } = await pgPool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("Lỗi lấy danh sách lý do:", err);
    res.status(500).json({ error: "Lỗi lấy danh sách lý do" });
  }
};

export const createReason = async (req: any, res: any) => {
  const { stars, reason_text, department_id } = req.body;
  const user = req.user;
  
  let final_department_id = department_id || null;

  try {
    if (user.role === 'ADMIN') {
       if (!final_department_id) return res.status(400).json({ error: "Quản trị viên chi nhánh phải chọn một bộ phận cụ thể" });
       const { rows: dRows } = await pgPool.query(`SELECT branch_id FROM departments WHERE id = $1`, [final_department_id]);
       const dept = dRows[0];
       if (!dept || dept.branch_id != user.branch_id) return res.status(403).json({ error: "Bộ phận không thuộc chi nhánh của bạn" });
    } else if (user.role === 'USER') {
       if (user.department_id) final_department_id = user.department_id;
       else return res.status(403).json({ error: "Người dùng phải thuộc về một bộ phận" });
    }

    const { rows } = await pgPool.query(
      `INSERT INTO reasons (stars, reason_text, department_id)
       VALUES ($1, $2, $3) RETURNING *`,
      [stars, reason_text, final_department_id]
    );
    
    // Lấy thêm tên departent trả về cho Client load giao diện mượt
    let department_name = null;
    if (rows[0].department_id) {
      const { rows: deptRows } = await pgPool.query(`SELECT name FROM departments WHERE id = $1`, [rows[0].department_id]);
      if (deptRows.length > 0) department_name = deptRows[0].name;
    }

    res.json({ ...rows[0], department_name });
  } catch (err: any) {
    res.status(400).json({ error: "Lỗi khi thêm lý do: " + (err.message || "Unknown error") });
  }
};

export const updateReason = async (req: any, res: any) => {
  const user = req.user;
  const { id } = req.params;
  const { stars, reason_text, department_id } = req.body;

  try {
    const { rows: checkRows } = await pgPool.query(
      `SELECT r.department_id, d.branch_id 
       FROM reasons r
       LEFT JOIN departments d ON r.department_id = d.id
       WHERE r.id = $1`, 
      [id]
    );
    const reason = checkRows[0];
    if (!reason) return res.status(404).json({ error: "Lý do không tồn tại" });
    
    let canEdit = user.role === 'SUPER_ADMIN';

    if (user.role === 'ADMIN') {
      if (reason.branch_id == user.branch_id) canEdit = true;
    } else if (user.role === 'USER') {
      if (reason.department_id == user.department_id) canEdit = true;
    }

    if (!canEdit) return res.status(403).json({ error: "Bạn không có quyền sửa lý do này" });

    let final_department_id = department_id || null;
    if (user.role === 'ADMIN') {
       if (!final_department_id) return res.status(400).json({ error: "Phải chọn bộ phận" });
       const { rows: dRows } = await pgPool.query(`SELECT branch_id FROM departments WHERE id = $1`, [final_department_id]);
       const d = dRows[0];
       if (!d || d.branch_id != user.branch_id) return res.status(403).json({ error: "Bộ phận không hợp lệ" });
    } else if (user.role === 'USER') {
       final_department_id = user.department_id;
    }

    await pgPool.query(
      `UPDATE reasons SET stars = $1, reason_text = $2, department_id = $3 WHERE id = $4`,
      [stars, reason_text, final_department_id, id]
    );
    res.json({ success: true });
  } catch (updateError: any) {
    res.status(400).json({ error: "Lỗi khi cập nhật lý do: " + (updateError.message || '') });
  }
};

export const deleteReason = async (req: any, res: any) => {
  const user = req.user;
  const { id } = req.params;

  try {
    const { rows: checkRows } = await pgPool.query(
      `SELECT r.department_id, d.branch_id 
       FROM reasons r
       LEFT JOIN departments d ON r.department_id = d.id
       WHERE r.id = $1`, 
      [id]
    );
    const reason = checkRows[0];
    if (!reason) return res.status(404).json({ error: "Lý do không tồn tại" });
    
    let canDelete = user.role === 'SUPER_ADMIN';

    if (user.role === 'ADMIN') {
      if (reason.branch_id == user.branch_id) canDelete = true;
    } else if (user.role === 'USER') {
      if (reason.department_id == user.department_id) canDelete = true;
    }

    if (!canDelete) return res.status(403).json({ error: "Bạn không có quyền xóa lý do này" });

    await pgPool.query(`DELETE FROM reasons WHERE id = $1`, [id]);
    res.json({ success: true });
  } catch (deleteError: any) {
    res.status(400).json({ error: "Lý do đang được sử dụng trong đánh giá, không thể xoá." });
  }
};
