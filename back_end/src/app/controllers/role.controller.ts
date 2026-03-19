import { pgPool } from "../../inits/postgres";

export const getRoles = async (req: any, res: any) => {
  try {
    const result = await pgPool.query(`
      SELECT r.*, 
             COALESCE(
               json_agg(json_build_object('permission_id', rp.permission_id)) 
               FILTER (WHERE rp.permission_id IS NOT NULL), '[]'
             ) as role_permissions
      FROM roles r
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      GROUP BY r.id
      ORDER BY r.id ASC
    `);
    res.json(result.rows);
  } catch (err) { 
    console.error(err);
    res.status(500).json({ error: "Lỗi lấy danh sách vai trò" }); 
  }
};

export const getPermissions = async (req: any, res: any) => {
  try {
    const result = await pgPool.query(`
      SELECT * FROM permissions 
      ORDER BY module ASC, action ASC
    `);
    res.json(result.rows);
  } catch (err) { 
    console.error(err);
    res.status(500).json({ error: "Lỗi lấy danh sách quyền" }); 
  }
};

export const updateRolePermissions = async (req: any, res: any) => {
  const roleId = parseInt(req.params.id, 10);
  const { permissionIds } = req.body;
  
  const client = await pgPool.connect();
  try {
    await client.query('BEGIN');
    
    await client.query('DELETE FROM role_permissions WHERE role_id = $1', [roleId]);
    
    if (permissionIds && permissionIds.length > 0) {
      const values: any[] = [roleId];
      const placeholders = permissionIds.map((pid: number, i: number) => {
        values.push(pid);
        return `($1, $${i + 2})`;
      }).join(', ');
      
      const query = `INSERT INTO role_permissions (role_id, permission_id) VALUES ${placeholders}`;
      await client.query(query, values);
    }
    await client.query(`UPDATE users SET session_id = NULL WHERE role = (SELECT name FROM roles WHERE id = $1)`, [roleId]);
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) { 
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: "Lỗi cập nhật quyền hạn" }); 
  } finally {
    client.release();
  }
};
