import { pgPool } from "../../inits/postgres";

export const getEmployees = async (req: any, res: any) => {
  const user = req.user;
  try {
    let sql = `
      SELECT e.id, e.employee_code, e.full_name, e.email, e.cccd, e.is_resigned, e.is_active,
             e.department_id, e.branch_id, 
             d.name as department_name, b.name as branch_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN branches b ON e.branch_id = b.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let pIdx = 1;

    if (user.role && user.role.toUpperCase() !== 'SUPER_ADMIN' && user.branch_id) {
      sql += ` AND e.branch_id = $${pIdx++}`;
      params.push(user.branch_id);
    }
    if (user.role && user.role.toUpperCase() === 'USER' && user.department_id) {
      sql += ` AND e.department_id = $${pIdx++}`;
      params.push(user.department_id);
    }

    sql += ` ORDER BY e.id DESC`;

    const { rows } = await pgPool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("Lỗi lấy danh sách nhân viên:", err);
    res.status(500).json({ error: "Lỗi lấy danh sách nhân viên" });
  }
};

export const createEmployee = async (req: any, res: any) => {
  const { employee_code, full_name, email, department_id, branch_id, cccd, is_resigned, created_at } = req.body;
  const user = req.user;

  try {
    if (user.role === 'ADMIN') {
      if (branch_id && branch_id != user.branch_id) return res.status(403).json({ error: "Không thể tạo nhân viên cho chi nhánh khác" });
      const { rows: dRows } = await pgPool.query(`SELECT branch_id FROM departments WHERE id = $1`, [department_id]);
      const dept = dRows[0];
      if (!dept || dept.branch_id != user.branch_id) return res.status(403).json({ error: "Bộ phận không thuộc chi nhánh của bạn" });
    } else if (user.role === 'USER') {
      if (department_id && department_id != user.department_id) return res.status(403).json({ error: "Bạn chỉ có quyền tạo nhân viên trong bộ phận của mình" });
    }

    const finalBranchId = user.role === 'ADMIN' ? user.branch_id : (branch_id || (user.role === 'USER' ? user.branch_id : null));

    const { rows } = await pgPool.query(
      `INSERT INTO employees (employee_code, full_name, email, department_id, branch_id, cccd, is_resigned, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        employee_code, full_name, email || null, department_id || null, finalBranchId, cccd || null,
        is_resigned ? true : false,
        created_at ? new Date(created_at).toISOString() : new Date().toISOString()
      ]
    );

    res.json({ id: rows[0].id });
  } catch (err: any) {
    if (err.code === '23505') return res.status(400).json({ error: "Mã nhân viên đã tồn tại" });
    res.status(400).json({ error: "Lỗi khi thêm nhân viên" });
  }
};

export const importEmployees = async (req: any, res: any) => {
  const { data } = req.body;
  if (!data || !Array.isArray(data)) return res.status(400).json({ error: "Dữ liệu không hợp lệ" });
  try {
    const user = req.user;
    
    // Sử dụng vòng lặp cho Upsert vì pg-pool không hỗ trợ bind mảng obj trực tiếp như Supabase
    for (const emp of data) {
      await pgPool.query(
        `INSERT INTO employees (employee_code, full_name, email, department_id, branch_id, cccd, is_resigned)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (employee_code) DO UPDATE 
         SET full_name = EXCLUDED.full_name,
             email = EXCLUDED.email,
             department_id = EXCLUDED.department_id,
             branch_id = EXCLUDED.branch_id,
             cccd = EXCLUDED.cccd,
             is_resigned = EXCLUDED.is_resigned`,
        [emp.employee_code, emp.full_name, emp.email || '', emp.department_id, emp.branch_id, emp.cccd || '', emp.is_resigned ? true : false]
      );
    }

    res.json({ success: true, count: data.length });
  } catch (e: any) {
    res.status(400).json({ error: "Lỗi khi import nhân viên: " + e.message });
  }
};

export const updateEmployee = async (req: any, res: any) => {
  const { employee_code, full_name, email, department_id, branch_id, cccd, is_resigned, created_at } = req.body;
  const user = req.user;
  const { id } = req.params;

  try {
    const { rows: eRows } = await pgPool.query(`SELECT branch_id, department_id FROM employees WHERE id = $1`, [id]);
    const existing = eRows[0];
    if (!existing) return res.status(404).json({ error: "Nhân viên không tồn tại" });

    if (user.role === 'ADMIN') {
      if (existing.branch_id != user.branch_id) return res.status(403).json({ error: "Không có quyền sửa nhân viên của chi nhánh khác" });
      if (branch_id && branch_id != user.branch_id) return res.status(403).json({ error: "Không thể chuyển nhân viên sang chi nhánh khác" });
      if (department_id) {
        const { rows: dRows } = await pgPool.query(`SELECT branch_id FROM departments WHERE id = $1`, [department_id]);
        const dept = dRows[0];
        if (!dept || dept.branch_id != user.branch_id) return res.status(403).json({ error: "Bộ phận đích không thuộc chi nhánh của bạn" });
      }
    } else if (user.role === 'USER') {
      if (existing.department_id != user.department_id) return res.status(403).json({ error: "Không có quyền sửa nhân viên bộ phận này" });
      if (department_id && parseInt(department_id) !== user.department_id) return res.status(403).json({ error: "Không thể chuyển nhân viên sang bộ phận khác" });
    }

    const createdTime = created_at ? new Date(created_at).toISOString() : null;

    if (createdTime) {
      await pgPool.query(
        `UPDATE employees 
         SET employee_code = $1, full_name = $2, email = $3, department_id = $4, branch_id = $5, cccd = $6, is_resigned = $7, created_at = $8
         WHERE id = $9`,
        [employee_code, full_name, email, department_id, branch_id, cccd, is_resigned ? true : false, createdTime, id]
      );
    } else {
      await pgPool.query(
        `UPDATE employees 
         SET employee_code = $1, full_name = $2, email = $3, department_id = $4, branch_id = $5, cccd = $6, is_resigned = $7
         WHERE id = $8`,
        [employee_code, full_name, email, department_id, branch_id, cccd, is_resigned ? true : false, id]
      );
    }

    res.json({ success: true });
  } catch (err: any) {
    if (err.code === '23505') return res.status(400).json({ error: "Mã nhân viên đã trùng lặp" });
    res.status(400).json({ error: "Lỗi khi cập nhật nhân viên" });
  }
};

export const deleteEmployee = async (req: any, res: any) => {
  const user = req.user;
  const { id } = req.params;

  try {
    const { rows: eRows } = await pgPool.query(`SELECT branch_id, department_id FROM employees WHERE id = $1`, [id]);
    const existing = eRows[0];
    if (!existing) return res.status(404).json({ error: "Nhân viên không tồn tại" });

    if (user.role === 'ADMIN' && existing.branch_id != user.branch_id) return res.status(403).json({ error: "Không có quyền xóa nhân viên chi nhánh khác" });
    if (user.role === 'USER' && existing.department_id != user.department_id) return res.status(403).json({ error: "Không có quyền xóa nhân viên bộ phận khác" });

    await pgPool.query(`DELETE FROM employees WHERE id = $1`, [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: "Không thể xóa nhân viên do có phát sinh đánh giá đi kèm" });
  }
};
