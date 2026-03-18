import { supabase } from "../../inits/supabase";

export const getRoles = async (req: any, res: any) => {
  try {
    const { data, error } = await supabase.from('roles').select('*, role_permissions(permission_id)');
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: "Lỗi lấy danh sách vai trò" }); }
};

export const getPermissions = async (req: any, res: any) => {
  try {
    const { data, error } = await supabase.from('permissions').select('*').order('module').order('action');
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: "Lỗi lấy danh sách quyền" }); }
};

export const updateRolePermissions = async (req: any, res: any) => {
  const roleId = req.params.id;
  const { permissionIds } = req.body;
  try {
    await supabase.from('role_permissions').delete().eq('role_id', roleId);
    if (permissionIds && permissionIds.length > 0) {
      const inserts = permissionIds.map((pid: number) => ({ role_id: parseInt(roleId), permission_id: pid }));
      const { error } = await supabase.from('role_permissions').insert(inserts);
      if (error) throw error;
    }
    await supabase.from('users').update({ current_token: 'FORCE_LOGOUT_PERMISSIONS' }).eq('role_id', parseInt(roleId));
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Lỗi cập nhật quyền hạn" }); }
};
