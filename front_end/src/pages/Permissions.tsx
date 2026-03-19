import React, { useState, useEffect } from 'react';
import { Shield, Save, Check, Lock, AlertCircle, ChevronRight } from 'lucide-react';
import { apiFetch } from '../services/api';
import { cn } from '../utils/utils';

interface Permission {
    id: number;
    module: string;
    action: string;
    name: string;
}

interface Role {
    id: number;
    name: string;
    description: string;
    role_permissions: { permission_id: number }[];
}

const MODULE_LABELS: Record<string, string> = {
    employees: 'Nhân viên',
    branches: 'Chi nhánh',
    departments: 'Phòng ban',
    reasons: 'Lý do sao',
    users: 'Tài khoản',
    evaluations: 'Đánh giá',
    reports: 'Báo cáo'
};

const MODULE_ICONS: Record<string, string> = {
    employees: '👥',
    branches: '📍',
    departments: '🏢',
    reasons: '⭐',
    users: '🔑',
    evaluations: '📋',
    reports: '📊'
};

const ACTION_LABELS: Record<string, string> = {
    view: 'Xem',
    create: 'Thêm',
    edit: 'Sửa',
    delete: 'Xoá'
};

const ACTION_COLORS: Record<string, string> = {
    view: 'text-sky-600 bg-sky-50 border-sky-200',
    create: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    edit: 'text-amber-600 bg-amber-50 border-amber-200',
    delete: 'text-red-600 bg-red-50 border-red-200',
};

export default function Permissions() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
    const [selectedRolePermissions, setSelectedRolePermissions] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [rolesData, permsData] = await Promise.all([
                apiFetch('/api/roles'),
                apiFetch('/api/permissions')
            ]);
            setRoles(rolesData);
            setPermissions(permsData);
            if (rolesData.length > 0 && !selectedRoleId) {
                handleSelectRole(rolesData[0]);
            } else if (selectedRoleId) {
                const currentRole = rolesData.find((r: Role) => r.id === selectedRoleId);
                if (currentRole) handleSelectRole(currentRole);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSelectRole = (role: Role) => {
        setSelectedRoleId(role.id);
        setSelectedRolePermissions(role.role_permissions.map(rp => rp.permission_id));
        setMessage({ type: '', text: '' });
    };

    const togglePermission = (permissionId: number) => {
        setSelectedRolePermissions(prev =>
            prev.includes(permissionId)
                ? prev.filter(id => id !== permissionId)
                : [...prev, permissionId]
        );
    };

    const handleSave = async () => {
        if (!selectedRoleId) return;
        setSaving(true);
        try {
            await apiFetch(`/api/roles/${selectedRoleId}/permissions`, {
                method: 'POST',
                body: JSON.stringify({ permissionIds: selectedRolePermissions })
            });
            setMessage({ type: 'success', text: 'Cập nhật quyền hạn thành công!' });
            const updatedRoles = await apiFetch('/api/roles');
            setRoles(updatedRoles);
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
    );

    const modules: string[] = Array.from(new Set(permissions.map(p => p.module)));
    const actions = ['view', 'create', 'edit', 'delete'];

    const selectedRole = roles.find(r => r.id === selectedRoleId);

    return (
        <div className="space-y-5 pb-32 md:pb-0">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Thiết lập Phân quyền</h2>
                    <p className="text-sm text-slate-500 mt-0.5">Quản lý chi tiết quyền hạn cho từng vai trò</p>
                </div>
                {selectedRoleId && (
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="hidden md:flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-bold shadow-lg shadow-indigo-200 disabled:opacity-50 active:scale-95"
                    >
                        {saving ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Save size={18} />}
                        <span>Lưu thay đổi</span>
                    </button>
                )}
            </div>

            {/* Message */}
            {message.text && (
                <div className={cn(
                    "p-4 rounded-2xl flex items-center gap-2 text-sm font-medium",
                    message.type === 'success'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        : 'bg-red-50 text-red-700 border border-red-100'
                )}>
                    {message.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                    {message.text}
                </div>
            )}

            {/* ── Role Selector: Horizontal chips on mobile, vertical list on desktop ── */}
            {/* Mobile: horizontal scrollable chips */}
            <div className="md:hidden -mx-4 px-4">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Chọn vai trò</p>
                <div className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory">
                    {roles.map(role => (
                        <button
                            key={role.id}
                            onClick={() => handleSelectRole(role)}
                            className={cn(
                                "flex-shrink-0 snap-start flex items-center gap-2 px-4 py-2.5 rounded-2xl border transition-all font-semibold text-sm whitespace-nowrap",
                                selectedRoleId === role.id
                                    ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-200"
                                    : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                            )}
                        >
                            <Shield size={16} />
                            {role.name === 'SUPER_ADMIN' ? 'Admin' : role.name === 'ADMIN' ? 'Quản trị' : 'User'}
                        </button>
                    ))}
                </div>
                {selectedRole && (
                    <p className="mt-2 text-xs text-slate-400 italic">{selectedRole.description}</p>
                )}
            </div>

            {/* Desktop layout: sidebar + table */}
            <div className="hidden md:flex gap-6">
                {/* Role List */}
                <div className="w-72 flex flex-col gap-2">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider px-2">Vai trò</h3>
                    {roles.map(role => (
                        <button
                            key={role.id}
                            onClick={() => handleSelectRole(role)}
                            className={cn(
                                "flex flex-col p-4 rounded-2xl text-left transition-all",
                                selectedRoleId === role.id
                                    ? "bg-white border-2 border-indigo-500 shadow-md shadow-indigo-50"
                                    : "bg-white border border-slate-100 hover:border-indigo-200"
                            )}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <Shield size={18} className={selectedRoleId === role.id ? "text-indigo-600" : "text-slate-400"} />
                                <span className={cn("font-bold", selectedRoleId === role.id ? "text-slate-900" : "text-slate-600")}>
                                    {role.name === 'SUPER_ADMIN' ? 'Admin' : role.name === 'ADMIN' ? 'Quản trị' : 'User'}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 line-clamp-1">{role.description}</p>
                        </button>
                    ))}
                </div>

                {/* Desktop Permission Table */}
                <div className="flex-1">
                    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="px-8 py-5 text-sm font-bold text-slate-700">Module / Chức năng</th>
                                        {actions.map(action => (
                                            <th key={action} className="px-4 py-5 text-sm font-bold text-slate-700 text-center">
                                                {ACTION_LABELS[action]}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {modules.map(module => (
                                        <tr key={module} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg">{MODULE_ICONS[module] || '📦'}</span>
                                                    <span className="font-semibold text-slate-900">{MODULE_LABELS[module] || module}</span>
                                                </div>
                                            </td>
                                            {actions.map(action => {
                                                const perm = permissions.find(p => p.module === module && p.action === action);
                                                if (!perm) return (
                                                    <td key={action} className="px-4 py-5 text-center">
                                                        <Lock size={14} className="mx-auto text-slate-200" />
                                                    </td>
                                                );
                                                return (
                                                    <td key={action} className="px-4 py-5 text-center">
                                                        <label className="inline-flex items-center justify-center cursor-pointer p-2">
                                                            <input
                                                                type="checkbox"
                                                                className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                                checked={selectedRolePermissions.includes(perm.id)}
                                                                onChange={() => togglePermission(perm.id)}
                                                            />
                                                        </label>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-sm text-slate-500 px-4">
                        <Lock size={14} />
                        <span>Các ô bị khoá nghĩa là chức năng đó không khả dụng cho module tương ứng.</span>
                    </div>
                </div>
            </div>

            {/* ── Mobile Permission Cards ── */}
            <div className="md:hidden space-y-3">
                {modules.map(module => {
                    const modulePerms = permissions.filter(p => p.module === module);
                    const activeCount = modulePerms.filter(p => selectedRolePermissions.includes(p.id)).length;
                    return (
                        <div key={module} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                            {/* Module header */}
                            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">{MODULE_ICONS[module] || '📦'}</span>
                                    <span className="font-bold text-slate-800 text-sm">{MODULE_LABELS[module] || module}</span>
                                </div>
                                <span className={cn(
                                    "text-[10px] font-bold px-2 py-1 rounded-full border",
                                    activeCount > 0 ? "bg-indigo-50 text-indigo-600 border-indigo-200" : "bg-slate-100 text-slate-400 border-slate-200"
                                )}>
                                    {activeCount}/{modulePerms.length} quyền
                                </span>
                            </div>
                            {/* Action toggles */}
                            <div className="divide-y divide-slate-50">
                                {actions.map(action => {
                                    const perm = permissions.find(p => p.module === module && p.action === action);
                                    const isActive = perm ? selectedRolePermissions.includes(perm.id) : false;
                                    return (
                                        <div
                                            key={action}
                                            className={cn(
                                                "flex items-center justify-between px-4 py-3 transition-colors",
                                                !perm ? "opacity-40" : isActive ? "bg-indigo-50/40" : ""
                                            )}
                                            onClick={() => perm && togglePermission(perm.id)}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <span className={cn(
                                                    "text-[11px] font-bold px-2 py-0.5 rounded-full border",
                                                    ACTION_COLORS[action]
                                                )}>
                                                    {ACTION_LABELS[action]}
                                                </span>
                                                {!perm && (
                                                    <Lock size={12} className="text-slate-300" />
                                                )}
                                            </div>
                                            {perm ? (
                                                <div className={cn(
                                                    "w-12 h-6 rounded-full border-2 transition-all relative flex items-center px-0.5",
                                                    isActive ? "bg-indigo-600 border-indigo-600" : "bg-slate-200 border-slate-300"
                                                )}>
                                                    <div className={cn(
                                                        "w-4 h-4 rounded-full bg-white shadow transition-all",
                                                        isActive ? "translate-x-6" : "translate-x-0"
                                                    )} />
                                                </div>
                                            ) : (
                                                <div className="w-12 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                                                    <Lock size={10} className="text-slate-300" />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Mobile Fixed Save Button — sits ABOVE the bottom nav (bottom-16 = 64px = nav height) */}
            {selectedRoleId && (
                <div className="md:hidden fixed bottom-16 left-0 right-0 z-30 px-4 pb-3">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full h-13 flex items-center justify-center gap-3 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-wider shadow-2xl shadow-indigo-300 active:scale-95 disabled:opacity-50 transition-all py-3.5"
                    >
                        {saving
                            ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            : <Save size={20} />
                        }
                        <span>Lưu thay đổi</span>
                    </button>
                </div>
            )}
        </div>
    );
}
