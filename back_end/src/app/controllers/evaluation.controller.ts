import { pgPool } from "../../inits/postgres";

export const getEvaluations = async (req: any, res: any) => {
  const { date, department_id, branch_id, search } = req.query;
  try {
    const user = req.user;
    
    // 1. Query danh sách nhân sự thỏa điều kiện
    let sqlEmp = `
      SELECT id, full_name, employee_code, is_resigned, branch_id, department_id
      FROM employees
      WHERE is_resigned = false
    `;
    const paramsEmp: any[] = [];
    let pIdx = 1;

    if (user.role === 'SUPER_ADMIN') {
      if (branch_id && branch_id !== 'all') {
        sqlEmp += ` AND branch_id = $${pIdx++}`;
        paramsEmp.push(branch_id);
      }
    } else if (user.branch_id) {
      sqlEmp += ` AND branch_id = $${pIdx++}`;
      paramsEmp.push(user.branch_id);
    }

    if (department_id && department_id !== 'all') {
      sqlEmp += ` AND department_id = $${pIdx++}`;
      paramsEmp.push(department_id);
    } else if (user.role === 'USER' && user.department_id) {
      sqlEmp += ` AND department_id = $${pIdx++}`;
      paramsEmp.push(user.department_id);
    }

    if (search) {
      sqlEmp += ` AND (full_name ILIKE $${pIdx} OR employee_code ILIKE $${pIdx})`;
      paramsEmp.push(`%${search}%`);
      pIdx++;
    }

    const { rows: employees } = await pgPool.query(sqlEmp, paramsEmp);

    let evals: any[] = [];
    if (employees.length > 0) {
      const empIds = employees.map((e: any) => e.id);
      
      // 2. Query điểm đánh giá trong ngày đó ứng với mảng ID nhân sự
      const sqlEval = `
        SELECT id, employee_id, stars, date, note, reason_ids
        FROM evaluations
        WHERE date = $1 AND employee_id = ANY($2::int[])
      `;
      const { rows: evData } = await pgPool.query(sqlEval, [date, empIds]);
      evals = evData;
    }

    const processedRows = employees.map((emp: any) => {
      const ev = evals.find((e: any) => e.employee_id === emp.id);
      return {
        employee_id: emp.id,
        full_name: emp.full_name,
        employee_code: emp.employee_code,
        stars: ev?.stars || null,
        date: ev?.date || null,
        reason_ids: ev?.reason_ids || [],
        note: ev?.note || "",
        department_id: emp.department_id
      };
    });
    
    res.json(processedRows);
  } catch (err) {
    console.error("Lỗi getEvaluations:", err);
    res.status(500).json({ error: "Lỗi hệ thống khi lấy danh sách đánh giá" });
  }
};

export const createEvaluation = async (req: any, res: any) => {
  const { employee_id, date, stars, reason_ids, note } = req.body;
  
  try {
    const finalReasonIds = Array.isArray(reason_ids) ? reason_ids : [];
    
    // Cột reason_ids là kiểu Integer Array trên PostgreSQL
    await pgPool.query(
      `INSERT INTO evaluations (employee_id, date, stars, reason_ids, note)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (employee_id, date) 
       DO UPDATE SET 
          stars = EXCLUDED.stars, 
          reason_ids = EXCLUDED.reason_ids, 
          note = EXCLUDED.note`,
      [employee_id, date, stars, finalReasonIds, note || null]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Lỗi createEvaluation:", err);
    res.status(500).json({ error: "Lỗi khi lưu đánh giá" });
  }
};
