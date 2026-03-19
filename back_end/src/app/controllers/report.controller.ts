import { pgPool } from "../../inits/postgres";

// Helper function to build summary query based on dates
const getEmployeeStarsSummaryQuery = (startDate: string, endDate: string, user: any, p_branch_id: any, p_dept_id: any) => {
  let sql = `
    SELECT e.id as employee_id, e.employee_code, e.full_name, e.department_id, e.branch_id,
           COALESCE(SUM(ev.stars), 0) as total_stars,
           COUNT(ev.id) as total_evaluations,
           d.name as department_name, b.name as branch_name
    FROM employees e
    LEFT JOIN departments d ON e.department_id = d.id
    LEFT JOIN branches b ON e.branch_id = b.id
    LEFT JOIN evaluations ev ON e.id = ev.employee_id AND ev.date >= $1 AND ev.date <= $2
    WHERE e.is_resigned = false
  `;
  const params: any[] = [startDate, endDate];
  let pIdx = 3;

  if (p_branch_id) {
    sql += ` AND e.branch_id = $${pIdx++}`;
    params.push(p_branch_id);
  } else if (user.role && user.role.toUpperCase() !== 'SUPER_ADMIN' && user.branch_id) {
    sql += ` AND e.branch_id = $${pIdx++}`;
    params.push(user.branch_id);
  }

  if (p_dept_id) {
    sql += ` AND e.department_id = $${pIdx++}`;
    params.push(p_dept_id);
  } else if (user.role && user.role.toUpperCase() === 'USER' && user.department_id) {
    sql += ` AND e.department_id = $${pIdx++}`;
    params.push(user.department_id);
  }

  sql += ` GROUP BY e.id, e.employee_code, e.full_name, e.department_id, e.branch_id, d.name, b.name`;
  sql += ` ORDER BY total_stars DESC, e.full_name ASC`;
  
  return { sql, params };
};

export const getSummary = async (req: any, res: any) => {
  const { startDate, endDate } = req.query;
  const user = req.user;
  try {
    if (!startDate || !endDate) return res.status(400).json({ error: "Thiếu ngày bắt đầu hoặc kết thúc" });
    
    let p_branch_id = req.query.branch_id && req.query.branch_id !== 'all' ? parseInt(req.query.branch_id) : null;
    let p_dept_id = req.query.department_id && req.query.department_id !== 'all' ? parseInt(req.query.department_id) : null;

    const { sql, params } = getEmployeeStarsSummaryQuery(startDate, endDate, user, p_branch_id, p_dept_id);
    const { rows } = await pgPool.query(sql, params);

    res.json(rows || []);
  } catch (err) { res.status(500).json({ error: "Lỗi báo cáo tổng hợp" }); }
};

export const getSummaryDepartments = async (req: any, res: any) => {
  const { startDate, endDate } = req.query;
  const user = req.user;
  try {
    if (!startDate || !endDate) return res.status(400).json({ error: "Thiếu ngày" });
    let p_branch_id = req.query.branch_id && req.query.branch_id !== 'all' ? parseInt(req.query.branch_id) : null;
    let p_dept_id = req.query.department_id && req.query.department_id !== 'all' ? parseInt(req.query.department_id) : null;

    const { sql, params } = getEmployeeStarsSummaryQuery(startDate, endDate, user, p_branch_id, p_dept_id);
    const { rows: empRows } = await pgPool.query(sql, params);

    const deptMap: any = {};
    empRows?.forEach((e: any) => {
      if (!e.department_id) return;
      if (!deptMap[e.department_id]) deptMap[e.department_id] = { id: e.department_id, department_name: e.department_name, total_employees: 0, total_stars: 0 };
      deptMap[e.department_id].total_employees += 1;
      deptMap[e.department_id].total_stars += (parseInt(e.total_stars) || 0);
    });

    let dSql = `SELECT id, name FROM departments WHERE 1=1`;
    const dParams = [];
    let dpIdx = 1;
    if (p_branch_id || (user.role !== 'SUPER_ADMIN' && user.branch_id)) {
      dSql += ` AND branch_id = $${dpIdx++}`;
      dParams.push(p_branch_id || user.branch_id);
    }
    if (p_dept_id || (user.role === 'USER' && user.department_id)) {
      dSql += ` AND id = $${dpIdx++}`;
      dParams.push(p_dept_id || user.department_id);
    }
    
    const { rows: allDepts } = await pgPool.query(dSql, dParams);
    
    const rows = (allDepts || []).map(d => {
      if (deptMap[d.id]) return deptMap[d.id];
      return { id: d.id, department_name: d.name, total_employees: 0, total_stars: 0 };
    });
    res.json(rows);
  } catch (err) { res.status(500).json({ error: "Lỗi báo cáo bộ phận" }); }
};

export const getDepartmentDetails = async (req: any, res: any) => {
  const { startDate, endDate } = req.query;
  const department_id = req.params.id;
  const user = req.user;
  try {
    const { rows: deptRows } = await pgPool.query(`SELECT * FROM departments WHERE id = $1`, [department_id]);
    const dept = deptRows[0];
    if (!dept) return res.status(404).json({ error: "Không tồn tại" });
    
    if (user.role !== 'SUPER_ADMIN') {
      if (user.branch_id && dept.branch_id != user.branch_id) return res.status(403).json({ error: "Không có quyền" });
      if (user.role === 'USER' && user.department_id && dept.id != user.department_id) return res.status(403).json({ error: "Không có quyền" });
    }
    
    const { sql, params } = getEmployeeStarsSummaryQuery(startDate, endDate, user, null, parseInt(department_id));
    const { rows: employees } = await pgPool.query(sql, params);
    
    res.json({ department: dept, employees: employees || [] });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
};

export const getEmployeeDetails = async (req: any, res: any) => {
  const { startDate, endDate } = req.query;
  const employee_id = req.params.id;
  try {
    const effectiveEndDateStr = endDate > new Date().toISOString().split('T')[0] ? new Date().toISOString().split('T')[0] : endDate;
    const user = req.user;
    
    const empSql = `
      SELECT e.*, d.name as department_name, b.name as branch_name,
             u1.full_name as created_by_name, u2.full_name as updated_by_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN branches b ON e.branch_id = b.id
      LEFT JOIN users u1 ON e.created_by = u1.id
      LEFT JOIN users u2 ON e.updated_by = u2.id
      WHERE e.id = $1
    `;
    const { rows: empRows } = await pgPool.query(empSql, [employee_id]);
    const empData = empRows[0];
    
    if (!empData) return res.status(404).json({ error: "Không tồn tại" });
    
    if (user.role !== 'SUPER_ADMIN') {
      if (user.branch_id && empData.branch_id !== user.branch_id) return res.status(403).json({ error: "Không có quyền" });
      if (user.role === 'USER' && user.department_id && empData.department_id !== user.department_id) return res.status(403).json({ error: "Không có quyền" });
    }
    
    const evalsSql = `
      SELECT ev.*
      FROM evaluations ev
      WHERE ev.employee_id = $1 AND ev.date >= $2 AND ev.date <= $3
      ORDER BY ev.date DESC
    `;
    const { rows: evaluationsRows } = await pgPool.query(evalsSql, [employee_id, startDate, effectiveEndDateStr]);

    res.json({ employee: empData, evaluations: evaluationsRows || [] });
  } catch (err) { res.status(500).json({ error: "Lỗi chi tiết nhân viên" }); }
};

export const getDashboardOverview = async (req: any, res: any) => {
  try {
    const user = req.user;
    let p_branch_id = null;
    let p_dept_id = null;
    if (user.role && user.role.toUpperCase() !== 'SUPER_ADMIN' && user.branch_id) p_branch_id = parseInt(user.branch_id) || null;
    if (user.role && user.role.toUpperCase() === 'USER' && user.department_id) p_dept_id = parseInt(user.department_id) || null;

    // Get count of branches
    let bSql = `SELECT COUNT(*) as count FROM branches WHERE 1=1`;
    const bParams = [];
    if (p_branch_id) { bSql += ` AND id = $1`; bParams.push(p_branch_id); }
    const { rows: bRows } = await pgPool.query(bSql, bParams);
    const total_branches = parseInt(bRows[0].count) || 0;

    // Get count of departments
    let dSql = `SELECT COUNT(*) as count FROM departments WHERE 1=1`;
    const dParams = [];
    let dpIdx = 1;
    if (p_branch_id) { dSql += ` AND branch_id = $${dpIdx++}`; dParams.push(p_branch_id); }
    if (p_dept_id) { dSql += ` AND id = $${dpIdx++}`; dParams.push(p_dept_id); }
    const { rows: dRowsQuery } = await pgPool.query(dSql, dParams);
    const total_departments = parseInt(dRowsQuery[0].count) || 0;

    // Complex query replacing get_employees_dashboard_stats
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    let empDashboardSql = `
      SELECT e.id, e.employee_code, e.full_name, e.department_id, e.branch_id,
             d.name as department_name, b.name as branch_name,
             COALESCE(SUM(ev.stars), 0) as stars_all_time,
             COALESCE(SUM(CASE WHEN EXTRACT(YEAR FROM ev.date) = $1 THEN ev.stars ELSE 0 END), 0) as stars_year,
             COALESCE(SUM(CASE WHEN EXTRACT(YEAR FROM ev.date) = $1 AND EXTRACT(MONTH FROM ev.date) = $2 THEN ev.stars ELSE 0 END), 0) as stars_month
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN branches b ON e.branch_id = b.id
      LEFT JOIN evaluations ev ON e.id = ev.employee_id
      WHERE e.is_active = true
    `;
    const empP: any[] = [currentYear, currentMonth];
    let empIdx = 3;
    
    if (p_branch_id) { empDashboardSql += ` AND e.branch_id = $${empIdx++}`; empP.push(p_branch_id); }
    if (p_dept_id) { empDashboardSql += ` AND e.department_id = $${empIdx++}`; empP.push(p_dept_id); }
    
    empDashboardSql += ` GROUP BY e.id, d.name, b.name`;
    const { rows: employees } = await pgPool.query(empDashboardSql, empP);

    const total_employees = employees?.length || 0;

    const branchBreakdown: any = {};
    const deptBreakdown: any = {};
    employees?.forEach((e: any) => {
      if (e.branch_id) {
        const bName = e.branch_name || 'Chưa xếp nhánh';
        branchBreakdown[bName] = (branchBreakdown[bName] || 0) + 1;
      }
      if (e.department_id) {
        const dName = e.department_name || 'Chưa xếp phòng';
        deptBreakdown[dName] = (deptBreakdown[dName] || 0) + 1;
      }
    });

    const top_all_time = [...employees].sort((a, b) => parseInt(b.stars_all_time) - parseInt(a.stars_all_time)).slice(0, 3).map(e => ({ id: e.id, name: e.full_name, branch: e.branch_name, total: parseInt(e.stars_all_time) }));
    const top_year = [...employees].sort((a, b) => parseInt(b.stars_year) - parseInt(a.stars_year)).slice(0, 3).map(e => ({ id: e.id, name: e.full_name, branch: e.branch_name, total: parseInt(e.stars_year) }));
    const top_month = [...employees].sort((a, b) => parseInt(b.stars_month) - parseInt(a.stars_month)).slice(0, 3).map(e => ({ id: e.id, name: e.full_name, branch: e.branch_name, total: parseInt(e.stars_month) }));

    res.json({
      total_branches, total_departments, total_employees,
      branch_breakdown: Object.entries(branchBreakdown).map(([name, count]) => ({ name, count })),
      department_breakdown: Object.entries(deptBreakdown).map(([name, count]) => ({ name, count })),
      top_all_time, top_year, top_month
    });
  } catch (err) { 
    console.error("Lỗi getDashboardOverview:", err);
    res.status(500).json({ error: "Lỗi lấy dữ liệu tổng quan" }); 
  }
};
