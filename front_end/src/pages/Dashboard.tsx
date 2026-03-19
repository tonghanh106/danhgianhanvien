import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, Building2, MapPin, Trophy, Star, ChevronUp, ChevronDown, Calendar as CalendarIcon } from 'lucide-react';
import { apiFetch } from '../services/api';

import { useQuery } from '@tanstack/react-query';

export default function Dashboard() {
    const { data, isLoading } = useQuery({
        queryKey: ['dashboard_overview'],
        queryFn: () => apiFetch('/api/dashboard/overview')
    });

    if (isLoading) {
        return <div className="text-center py-20 text-slate-400">Đang tải dữ liệu tổng quan...</div>;
    }

    if (!data) return null;

    return (
        <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-8">
                <div className="p-2 md:p-3 bg-indigo-100 text-indigo-600 rounded-xl md:rounded-2xl">
                    <LayoutDashboard size={20} />
                </div>
                <div>
                    <h2 className="text-lg md:text-2xl font-bold text-slate-900">Tổng quan hệ thống</h2>
                    <p className="text-xs md:text-sm text-slate-500">Thống kê số liệu nhân sự và thành tích</p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-3 gap-2 md:gap-6">
                <div className="bg-white rounded-2xl md:rounded-3xl p-3 md:p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center md:items-center gap-2 md:gap-6 relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute -right-4 -top-4 w-16 h-16 md:w-24 md:h-24 bg-blue-50 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
                    <div className="w-10 h-10 md:w-16 md:h-16 bg-blue-100 text-blue-600 rounded-xl md:rounded-2xl flex items-center justify-center relative z-10 shrink-0">
                        <Users size={20} className="md:hidden" />
                        <Users size={32} className="hidden md:block" />
                    </div>
                    <div className="relative z-10 text-center md:text-left">
                        <p className="text-[10px] md:text-sm font-bold text-slate-400 uppercase tracking-wider mb-0.5 md:mb-1 leading-tight">Nhân viên</p>
                        <p className="text-2xl md:text-4xl font-black text-slate-900">{data.total_employees}</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl md:rounded-3xl p-3 md:p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center md:items-center gap-2 md:gap-6 relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute -right-4 -top-4 w-16 h-16 md:w-24 md:h-24 bg-emerald-50 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
                    <div className="w-10 h-10 md:w-16 md:h-16 bg-emerald-100 text-emerald-600 rounded-xl md:rounded-2xl flex items-center justify-center relative z-10 shrink-0">
                        <MapPin size={20} className="md:hidden" />
                        <MapPin size={32} className="hidden md:block" />
                    </div>
                    <div className="relative z-10 text-center md:text-left">
                        <p className="text-[10px] md:text-sm font-bold text-slate-400 uppercase tracking-wider mb-0.5 md:mb-1 leading-tight">Chi nhánh</p>
                        <p className="text-2xl md:text-4xl font-black text-slate-900">{data.total_branches}</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl md:rounded-3xl p-3 md:p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center md:items-center gap-2 md:gap-6 relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute -right-4 -top-4 w-16 h-16 md:w-24 md:h-24 bg-purple-50 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
                    <div className="w-10 h-10 md:w-16 md:h-16 bg-purple-100 text-purple-600 rounded-xl md:rounded-2xl flex items-center justify-center relative z-10 shrink-0">
                        <Building2 size={20} className="md:hidden" />
                        <Building2 size={32} className="hidden md:block" />
                    </div>
                    <div className="relative z-10 text-center md:text-left">
                        <p className="text-[10px] md:text-sm font-bold text-slate-400 uppercase tracking-wider mb-0.5 md:mb-1 leading-tight">Phòng ban</p>
                        <p className="text-2xl md:text-4xl font-black text-slate-900">{data.total_departments}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {/* Branch / Department breakdown */}
                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
                    <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
                        <MapPin className="text-emerald-500" size={20} />
                        <h3 className="font-bold text-slate-800">Cơ cấu nhân sự</h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Theo chi nhánh</h4>
                            <div className="space-y-3">
                                {data.branch_breakdown.map((b: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                                        <span className="font-medium text-slate-700 text-sm truncate flex-1 pr-2">{b.name}</span>
                                        <span className="font-black text-slate-900 bg-white px-3 py-1 rounded-xl shadow-sm text-sm shrink-0">{b.count}</span>

                                    </div>
                                ))}
                                {data.branch_breakdown.length === 0 && <p className="text-sm text-slate-400 italic">Chưa có dữ liệu</p>}
                            </div>
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Theo phòng ban</h4>
                            <div className="space-y-3">
                                {data.department_breakdown.map((d: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                                        <span className="font-medium text-slate-700 text-sm truncate flex-1 pr-2">{d.name}</span>
                                        <span className="font-black text-slate-900 bg-white px-3 py-1 rounded-xl shadow-sm text-sm shrink-0">{d.count}</span>

                                    </div>
                                ))}
                                {data.department_breakdown.length === 0 && <p className="text-sm text-slate-400 italic">Chưa có dữ liệu</p>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Top Employees */}
                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
                    <div className="p-6 border-b border-slate-100 bg-amber-50/50 flex items-center gap-3">
                        <Trophy className="text-amber-500" size={20} />
                        <h3 className="font-bold text-amber-900">Bảng vàng vinh danh</h3>
                    </div>
                    {/* Mobile: scroll ngang, Desktop: grid 3 cột */}
                    <div className="p-4 md:p-6 flex flex-col md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        {/* Top Month */}
                        <div className="flex-1">
                            <h4 className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <CalendarIcon className="w-3.5 h-3.5 text-slate-400" /> Top tháng này
                            </h4>
                            <div className="space-y-2">
                                {data.top_month.map((emp: any, i: number) => (
                                    <div key={i} className="flex items-center gap-2.5 p-2.5 md:p-3 bg-white border border-slate-100 rounded-xl md:rounded-2xl shadow-sm hover:border-amber-200 hover:shadow-md transition-all">
                                        <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-slate-100 font-black text-slate-500 flex items-center justify-center text-xs md:text-sm shrink-0">
                                            #{i + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-slate-900 text-xs md:text-sm truncate">{emp.name}</p>
                                            <p className="text-[10px] md:text-xs text-slate-500 truncate">{emp.branch || 'N/A'}</p>
                                        </div>
                                        <div className="flex items-center gap-0.5 font-black text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded-lg shrink-0 text-xs">
                                            <span>{emp.total}</span>
                                            <Star size={10} fill="currentColor" />
                                        </div>
                                    </div>
                                ))}
                                {data.top_month.length === 0 && <p className="text-xs text-slate-400 italic">Chưa có dữ liệu tháng này</p>}
                            </div>
                        </div>

                        {/* Top Year */}
                        <div className="flex-1 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                            <h4 className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <Trophy className="w-3.5 h-3.5 text-amber-400" /> Top năm 2026
                            </h4>
                            <div className="space-y-2">
                                {data.top_year.map((emp: any, i: number) => (
                                    <div key={i} className="flex items-center gap-2.5 p-2.5 md:p-3 bg-white border border-slate-100 rounded-xl md:rounded-2xl shadow-sm">
                                        <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-slate-50 font-black text-slate-400 flex items-center justify-center text-xs md:text-sm shrink-0">
                                            #{i + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-slate-900 text-xs md:text-sm truncate">{emp.name}</p>
                                            <p className="text-[10px] md:text-xs text-slate-500 truncate">{emp.branch || 'N/A'}</p>
                                        </div>
                                        <div className="flex items-center gap-0.5 font-black text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-lg shrink-0 text-xs">
                                            <span>{emp.total}</span>
                                            <Star size={10} fill="currentColor" />
                                        </div>
                                    </div>
                                ))}
                                {data.top_year.length === 0 && <p className="text-xs text-slate-400 italic">Chưa có dữ liệu năm nay</p>}
                            </div>
                        </div>

                        {/* Top All Time */}
                        <div className="flex-1 border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6 md:col-span-2 lg:col-span-1">
                            <h4 className="text-[10px] md:text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <Star className="w-3.5 h-3.5 text-indigo-400" /> Top Toàn thời gian
                            </h4>
                            <div className="space-y-2">
                                {data.top_all_time?.map((emp: any, i: number) => (
                                    <div key={i} className="flex items-center gap-2.5 p-2.5 md:p-3 bg-gradient-to-r from-indigo-50 to-white border border-indigo-100 rounded-xl md:rounded-2xl shadow-sm">
                                        <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full font-black flex items-center justify-center text-xs md:text-sm shadow-sm shrink-0 ${i === 0 ? 'bg-indigo-500 text-white' : i === 1 ? 'bg-indigo-300 text-white' : 'bg-indigo-100 text-indigo-600'}`}>
                                            #{i + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-slate-900 text-xs md:text-sm truncate">{emp.name}</p>
                                            <p className="text-[10px] md:text-xs text-slate-500 truncate">{emp.branch || 'N/A'}</p>
                                        </div>
                                        <div className="flex items-center gap-0.5 font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-lg border border-indigo-100 shrink-0 text-xs">
                                            <span>{emp.total}</span>
                                            <Star size={10} fill="currentColor" />
                                        </div>
                                    </div>
                                ))}
                                {(!data.top_all_time || data.top_all_time.length === 0) && <p className="text-xs text-slate-400 italic">Chưa có dữ liệu toàn thời gian</p>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


