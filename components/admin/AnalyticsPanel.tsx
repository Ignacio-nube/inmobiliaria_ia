"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar, ChevronLeft, ChevronRight, BarChart3, Search, Globe, Building2, Loader2, TrendingUp, Eye } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface ViewData {
    date: string;
    count: number;
}

interface TopItem {
    label: string;
    count: number;
}

interface TopProperty {
    id: string;
    title: string;
    image: string | null;
    count: number;
}

interface AnalyticsData {
    dailyViews: ViewData[];
    topPages: TopItem[];
    topProperties: TopProperty[];
    topSearches: TopItem[];
    totalViews: number;
}

type DateMode = "7days" | "month";

const MONTHS_ES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function getDateRange(mode: DateMode, month: { year: number; month: number }) {
    if (mode === "7days") {
        const to = new Date();
        const from = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
        return {
            from: from.toISOString().slice(0, 10) + "T00:00:00",
            to: to.toISOString().slice(0, 10) + "T23:59:59",
        };
    }
    const from = new Date(month.year, month.month, 1);
    const to = new Date(month.year, month.month + 1, 0);
    return {
        from: from.toISOString().slice(0, 10) + "T00:00:00",
        to: to.toISOString().slice(0, 10) + "T23:59:59",
    };
}

export function AnalyticsPanel({ data: initialData }: { data?: AnalyticsData }) {
    const [dateMode, setDateMode] = useState<DateMode>("7days");
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return { year: now.getFullYear(), month: now.getMonth() };
    });
    const [data, setData] = useState<AnalyticsData>(initialData || {
        dailyViews: [],
        topPages: [],
        topProperties: [],
        topSearches: [],
        totalViews: 0,
    });
    const [loading, setLoading] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const range = getDateRange(dateMode, selectedMonth);
            const res = await fetch(`/api/analytics?from=${range.from}&to=${range.to}`);
            if (res.ok) {
                const newData = await res.json();
                setData(newData);
            }
        } catch (e) {
            console.error("Analytics fetch error:", e);
        } finally {
            setLoading(false);
        }
    }, [dateMode, selectedMonth]);

    // Fetch on mount and when date range changes
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const maxViewCount = Math.max(...data.dailyViews.map(d => d.count), 1);
    const totalViewsInRange = data.dailyViews.reduce((s, d) => s + d.count, 0);

    const handlePrevMonth = () => {
        setSelectedMonth(prev => {
            if (prev.month === 0) return { year: prev.year - 1, month: 11 };
            return { ...prev, month: prev.month - 1 };
        });
    };

    const handleNextMonth = () => {
        const now = new Date();
        setSelectedMonth(prev => {
            // Don't allow navigating to future months
            if (prev.year === now.getFullYear() && prev.month === now.getMonth()) return prev;
            if (prev.month === 11) return { year: prev.year + 1, month: 0 };
            return { ...prev, month: prev.month + 1 };
        });
    };

    const isFutureMonth = () => {
        const now = new Date();
        return selectedMonth.year === now.getFullYear() && selectedMonth.month === now.getMonth();
    };

    return (
        <div className="space-y-6">
            {/* Date Mode Selector */}
            <div className="flex items-center gap-3 flex-wrap">
                <button
                    onClick={() => setDateMode("7days")}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${dateMode === "7days"
                        ? "bg-blue-500/10 text-blue-400"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                        }`}
                >
                    Últimos 7 días
                </button>
                <button
                    onClick={() => setDateMode("month")}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${dateMode === "month"
                        ? "bg-blue-500/10 text-blue-400"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                        }`}
                >
                    <Calendar className="w-4 h-4" />
                    Por Mes
                </button>

                {dateMode === "month" && (
                    <div className="flex items-center gap-2 ml-auto">
                        <button onClick={handlePrevMonth} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-medium text-slate-200 min-w-[140px] text-center">
                            {MONTHS_ES[selectedMonth.month]} {selectedMonth.year}
                        </span>
                        <button
                            onClick={handleNextMonth}
                            disabled={isFutureMonth()}
                            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors disabled:opacity-30"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {loading && <Loader2 className="w-4 h-4 animate-spin text-blue-400 ml-2" />}
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={<Eye className="w-4 h-4" />} label="Visitas Totales" value={totalViewsInRange} color="blue" />
                <StatCard icon={<Globe className="w-4 h-4" />} label="Páginas Únicas" value={data.topPages.length} color="violet" />
                <StatCard icon={<Building2 className="w-4 h-4" />} label="Props. Visitadas" value={data.topProperties.length} color="emerald" />
                <StatCard icon={<Search className="w-4 h-4" />} label="Búsquedas" value={data.topSearches.reduce((s, i) => s + i.count, 0)} color="amber" />
            </div>

            {/* Bar Chart */}
            <div className="bg-slate-800/20 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-blue-400" />
                        <h3 className="text-sm font-semibold text-slate-200">Visitas por Día</h3>
                    </div>
                    <span className="text-xs text-slate-500">{totalViewsInRange} visitas</span>
                </div>

                {data.dailyViews.length === 0 ? (
                    <div className="flex items-center justify-center h-40 text-slate-600 text-sm">
                        Sin datos para este período
                    </div>
                ) : (
                    <div className="flex items-end gap-1 h-44">
                        {data.dailyViews.map((day, i) => {
                            const heightPct = maxViewCount > 0 ? (day.count / maxViewCount) * 100 : 0;
                            const dateObj = new Date(day.date + 'T12:00:00');
                            const dayName = DAY_NAMES[dateObj.getDay()];
                            const dayNum = dateObj.getDate();
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1 group cursor-default" title={`${day.date}: ${day.count} visitas`}>
                                    <span className="text-[10px] text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity font-semibold">
                                        {day.count}
                                    </span>
                                    <div
                                        className={`w-full rounded-t-lg transition-all duration-300 min-h-[4px] ${day.count > 0
                                            ? "bg-gradient-to-t from-blue-600/60 to-blue-400/40 hover:from-blue-500/80 hover:to-blue-300/60"
                                            : "bg-slate-800/50"
                                            }`}
                                        style={{ height: `${Math.max(heightPct, 3)}%` }}
                                    />
                                    <div className="text-center">
                                        <span className="text-[10px] text-slate-600 block leading-tight">
                                            {dateMode === "7days" ? dayName : dayNum}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Rankings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Top Pages */}
                <RankingCard title="Páginas Más Visitadas" icon={<Globe className="w-4 h-4 text-violet-400" />} color="violet">
                    {data.topPages.length === 0 ? (
                        <EmptyState />
                    ) : (
                        data.topPages.slice(0, 5).map((item, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <span className="text-xs text-slate-600 w-4 text-right font-mono">{i + 1}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm text-slate-300 truncate font-mono">{item.label}</div>
                                    <ProgressBar value={item.count} max={data.topPages[0].count} color="violet" />
                                </div>
                                <span className="text-xs text-slate-500 font-medium">{item.count}</span>
                            </div>
                        ))
                    )}
                </RankingCard>

                {/* Top Properties - with thumbnails */}
                <RankingCard title="Propiedades Más Vistas" icon={<Building2 className="w-4 h-4 text-emerald-400" />} color="emerald">
                    {data.topProperties.length === 0 ? (
                        <EmptyState />
                    ) : (
                        data.topProperties.slice(0, 5).map((prop, i) => (
                            <Link
                                key={i}
                                href={`/propiedades/${prop.id}`}
                                target="_blank"
                                className="flex items-center gap-3 p-2 -mx-2 rounded-xl hover:bg-slate-800/50 transition-colors group"
                            >
                                <span className="text-xs text-slate-600 w-4 text-right font-mono">{i + 1}</span>
                                <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0 relative">
                                    {prop.image ? (
                                        <Image src={prop.image} alt={prop.title} fill className="object-cover" sizes="40px" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Building2 className="w-4 h-4 text-slate-600" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm text-slate-300 truncate group-hover:text-emerald-400 transition-colors">
                                        {prop.title}
                                    </div>
                                    <ProgressBar value={prop.count} max={data.topProperties[0].count} color="emerald" />
                                </div>
                                <span className="text-xs text-slate-500 font-medium">{prop.count}</span>
                            </Link>
                        ))
                    )}
                </RankingCard>

                {/* Top Searches */}
                <RankingCard title="Búsquedas Populares" icon={<Search className="w-4 h-4 text-amber-400" />} color="amber">
                    {data.topSearches.length === 0 ? (
                        <EmptyState />
                    ) : (
                        data.topSearches.slice(0, 5).map((item, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <span className="text-xs text-slate-600 w-4 text-right font-mono">{i + 1}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm text-slate-300 truncate">"{item.label}"</div>
                                    <ProgressBar value={item.count} max={data.topSearches[0].count} color="amber" />
                                </div>
                                <span className="text-xs text-slate-500 font-medium">{item.count}</span>
                            </div>
                        ))
                    )}
                </RankingCard>
            </div>
        </div>
    );
}

// Sub-components
function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
    const colorMap: Record<string, string> = {
        blue: "bg-blue-500/10 text-blue-400",
        violet: "bg-violet-500/10 text-violet-400",
        emerald: "bg-emerald-500/10 text-emerald-400",
        amber: "bg-amber-500/10 text-amber-400",
    };
    return (
        <div className="bg-slate-800/20 rounded-2xl p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
                {icon}
            </div>
            <div>
                <div className="text-xl font-bold text-white">{value}</div>
                <div className="text-[11px] text-slate-500 uppercase tracking-wider">{label}</div>
            </div>
        </div>
    );
}

function RankingCard({ title, icon, color, children }: { title: string; icon: React.ReactNode; color: string; children: React.ReactNode }) {
    return (
        <div className="bg-slate-800/20 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
                {icon}
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">{title}</h4>
            </div>
            <div className="space-y-3">
                {children}
            </div>
        </div>
    );
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
    const colorMap: Record<string, string> = {
        violet: "bg-violet-500/30",
        emerald: "bg-emerald-500/30",
        amber: "bg-amber-500/30",
    };
    return (
        <div className="mt-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
                className={`h-full rounded-full ${colorMap[color] || "bg-blue-500/30"} transition-all`}
                style={{ width: `${(value / max) * 100}%` }}
            />
        </div>
    );
}

function EmptyState() {
    return <p className="text-xs text-slate-600 text-center py-4">Sin datos aún</p>;
}
