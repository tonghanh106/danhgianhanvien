import React, { useState, useEffect } from 'react';
import {
  Users,
  Star,
  BarChart3,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Lock,
  Shield,
  MapPin,
  AlertCircle,
  Eye,
  EyeOff,
  LayoutDashboard,
  Building2,
  MoreHorizontal,
  X,
} from 'lucide-react';
import { cn } from '../../utils/utils';
import { User } from '../../types';
import { apiFetch } from '../../services/api';
import Logo from './Logo';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
}

export default function Layout({ children, user, onLogout }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [cpError, setCpError] = useState('');
  const [cpSuccess, setCpSuccess] = useState('');
  const [cpLoading, setCpLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Tổng quan', path: 'dashboard', permission: '' },
    { icon: Star, label: 'Đánh giá', path: 'evaluation', permission: 'evaluations:view' },
    { icon: BarChart3, label: 'Báo cáo', path: 'reports', permission: 'reports:view' },
    { icon: Users, label: 'Nhân viên', path: 'employees', permission: 'employees:view' },
    { icon: MapPin, label: 'Chi nhánh', path: 'branches', permission: 'branches:view' },
    { icon: Building2, label: 'Phòng ban', path: 'departments', permission: 'departments:view' },
    { icon: Star, label: 'Lý do sao', path: 'reasons', permission: 'reasons:view' },
    { icon: Users, label: 'Tài khoản', path: 'users', permission: 'users:view' },
    { icon: Shield, label: 'Phân quyền', path: 'permissions', permission: 'users:edit' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      apiFetch('/api/auth/check').catch(() => { });
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const filteredMenu = menuItems.filter(item =>
    item.permission === '' || user.role === 'SUPER_ADMIN' || user.permissions?.includes(item.permission)
  );

  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash) return hash;
    const hasEvalPermission = user.role === 'SUPER_ADMIN' || user.permissions?.includes('evaluations:view');
    if (hasEvalPermission) return 'evaluation';
    return filteredMenu[0]?.path || 'dashboard';
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) setActiveTab(hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (path: string) => {
    window.location.hash = path;
    setShowMoreMenu(false);
  };

  // Mobile: tối đa 4 tab đầu + nút "More"
  const MOBILE_MAX_TABS = 4;
  const mobileMainTabs = filteredMenu.slice(0, MOBILE_MAX_TABS);
  const mobileMoreTabs = filteredMenu.slice(MOBILE_MAX_TABS);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setCpError('');
    setCpSuccess('');
    if (newPassword !== confirmPassword) {
      setCpError('Mật khẩu mới không khớp');
      return;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setCpError('Mật khẩu phải tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường, chữ số và ký tự đặc biệt (!@#$%^&*)');
      return;
    }
    setCpLoading(true);
    try {
      await apiFetch('/api/change-password', {
        method: 'POST',
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      setCpSuccess('Đổi mật khẩu thành công');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setShowChangePassword(false), 2000);
    } catch (err: any) {
      setCpError(err.message);
    } finally {
      setCpLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">

      {/* ───── DESKTOP SIDEBAR ───── */}
      <aside className={cn(
        "hidden md:flex flex-col bg-white border-r border-slate-200 transition-all duration-300 ease-in-out",
        isSidebarOpen ? "w-64" : "w-16"
      )}>
        <div className="p-6 flex items-center justify-between border-b border-slate-100 mb-2">
          {isSidebarOpen && <Logo className="h-28 w-auto px-2" />}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            {isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {filteredMenu.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "w-full flex items-center p-3 rounded-xl transition-colors",
                activeTab === item.path
                  ? "bg-indigo-50 text-indigo-600"
                  : "text-slate-600 hover:bg-slate-50"
              )}
              title={!isSidebarOpen ? item.label : undefined}
            >
              <item.icon size={22} />
              {isSidebarOpen && <span className="ml-3 font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className={cn("flex flex-col", isSidebarOpen ? "items-stretch" : "items-center")}>
            <div className={cn("flex items-center mb-2", isSidebarOpen ? "px-2" : "justify-center")}>
              {isSidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user.full_name}</p>
                  <p className="text-xs text-slate-500 truncate">
                    {user.role === 'SUPER_ADMIN' ? 'Admin' : user.role === 'ADMIN' ? 'Quản trị' : 'User'}
                  </p>
                </div>
              )}
              <button onClick={onLogout} className="p-2 text-slate-400 hover:text-red-500 transition-colors" title="Đăng xuất">
                <LogOut size={20} />
              </button>
            </div>
            {isSidebarOpen && (
              <button
                onClick={() => setShowChangePassword(true)}
                className="flex items-center px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <Lock size={14} className="mr-2" />
                Đổi mật khẩu
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ───── MAIN CONTENT ───── */}
      <main className="flex-1 overflow-y-auto p-4 pb-24 pt-4 md:p-8 md:pb-8">
        <div className="max-w-7xl mx-auto">
          {React.Children.map(children, child => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child as React.ReactElement<any>, { activeTab });
            }
            return child;
          })}
        </div>
      </main>

      {/* ───── MOBILE BOTTOM NAV ───── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-lg">
        <div className="flex items-stretch">
          {mobileMainTabs.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors min-h-[56px]",
                activeTab === item.path
                  ? "text-indigo-600"
                  : "text-slate-500"
              )}
            >
              <item.icon size={22} strokeWidth={activeTab === item.path ? 2.5 : 1.8} />
              <span className="text-[10px] font-medium leading-tight">{item.label}</span>
              {activeTab === item.path && (
                <span className="absolute top-0 h-0.5 w-8 bg-indigo-600 rounded-full" />
              )}
            </button>
          ))}

          {/* Nút "Thêm" khi có menu vượt quá 4 tab */}
          {mobileMoreTabs.length > 0 ? (
            <button
              onClick={() => setShowMoreMenu(true)}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors min-h-[56px]",
                mobileMoreTabs.some(t => t.path === activeTab) ? "text-indigo-600" : "text-slate-500"
              )}
            >
              <MoreHorizontal size={22} strokeWidth={1.8} />
              <span className="text-[10px] font-medium leading-tight">Thêm</span>
            </button>
          ) : (
            /* Nút Account khi đủ tab */
            <button
              onClick={() => setShowMoreMenu(true)}
              className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors min-h-[56px] text-slate-500"
            >
              <LogOut size={22} strokeWidth={1.8} />
              <span className="text-[10px] font-medium leading-tight">Tài khoản</span>
            </button>
          )}
        </div>
      </nav>

      {/* ───── MOBILE MORE DRAWER ───── */}
      {showMoreMenu && (
        <div className="md:hidden fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowMoreMenu(false)} />
          <div className="relative w-full bg-white rounded-t-3xl shadow-2xl p-6 pb-10 animate-in slide-in-from-bottom-4 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="font-bold text-slate-900 text-base">{user.full_name}</p>
                <p className="text-xs text-slate-500">
                  {user.role === 'SUPER_ADMIN' ? '🔑 Admin' : user.role === 'ADMIN' ? '🛡️ Quản trị' : '👤 User'}
                </p>
              </div>
              <button onClick={() => setShowMoreMenu(false)} className="p-2 bg-slate-100 rounded-full">
                <X size={18} />
              </button>
            </div>

            {/* Menu items phụ */}
            {mobileMoreTabs.length > 0 && (
              <div className="mb-5">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Chức năng khác</p>
                <div className="grid grid-cols-4 gap-3">
                  {mobileMoreTabs.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className={cn(
                        "flex flex-col items-center gap-2 p-3 rounded-2xl transition-colors",
                        activeTab === item.path
                          ? "bg-indigo-50 text-indigo-600"
                          : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                      )}
                    >
                      <item.icon size={22} />
                      <span className="text-[10px] font-medium text-center leading-tight">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Account actions */}
            <div className="border-t border-slate-100 pt-4 space-y-2">
              <button
                onClick={() => { setShowMoreMenu(false); setShowChangePassword(true); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors"
              >
                <Lock size={18} className="text-slate-500" />
                <span className="font-medium text-sm">Đổi mật khẩu</span>
              </button>
              <button
                onClick={() => { setShowMoreMenu(false); onLogout(); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
              >
                <LogOut size={18} />
                <span className="font-medium text-sm">Đăng xuất</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───── CHANGE PASSWORD MODAL ───── */}
      {showChangePassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Đổi mật khẩu</h2>
              <button onClick={() => setShowChangePassword(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              {cpError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center text-red-600 text-sm">
                  <AlertCircle size={16} className="mr-2" />
                  {cpError}
                </div>
              )}
              {cpSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center text-emerald-600 text-sm">
                  <Star size={16} className="mr-2" />
                  {cpSuccess}
                </div>
              )}
              {/* Mật khẩu cũ */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu cũ</label>
                <div className="relative">
                  <input type={showOldPassword ? "text" : "password"} value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 pr-12" required />
                  <button type="button" onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 transition-colors">
                    {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              {/* Mật khẩu mới */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu mới</label>
                <div className="relative">
                  <input type={showNewPassword ? "text" : "password"} value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 pr-12" required />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 transition-colors">
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              {/* Xác nhận */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Xác nhận mật khẩu mới</label>
                <div className="relative">
                  <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 pr-12" required />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 transition-colors">
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setShowChangePassword(false)} className="btn-secondary flex-1">Hủy</button>
                <button type="submit" disabled={cpLoading} className="btn-primary flex-1">
                  {cpLoading ? 'Đang xử lý...' : 'Cập nhật'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
