"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Calendar, ChevronLeft, ChevronRight, Search, Globe, Building2, Loader2, TrendingUp, Eye, BarChart3, MessageSquare, Percent } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { EmptyState } from "@/components/ui/EmptyState";

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

type DateMode = "7days" | "month" | "custom";

const MONTHS_ES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function getDateRange(mode: DateMode, month: { year: number; month: number }, customRange?: { from: string; to: string }) {
    if (mode === "custom" && customRange) {
        return {
            from: customRange.from + "T00:00:00",
            to: customRange.to + "T23:59:59",
        };
    }
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

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
    if (active && payload && payload.length) {
        const dateObj = new Date(label + 'T12:00:00');
        const dayName = DAY_NAMES[dateObj.getDay()];
        const dayNum = dateObj.getDate();
        const monthName = MONTHS_ES[dateObj.getMonth()];
        return (
            <div className="bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded-xl px-3 py-2 shadow-xl">
                <p className="text-[11px] text-slate-400 mb-0.5">{dayName} {dayNum} {monthName}</p>
                <p className="text-sm font-bold text-white">{payload[0].value} <span className="text-slate-400 font-normal text-xs">visitas</span></p>
            </div>
        );
    }
    return null;
}

export function AnalyticsPanel({ data: initialData, totalMessages = 0 }: { data?: AnalyticsData; totalMessages?: number }) {
    const [dateMode, setDateMode] = useState<DateMode>("7days");
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return { year: now.getFullYear(), month: now.getMonth() };
    });
    const [customFrom, setCustomFrom] = useState("");
    const [customTo, setCustomTo] = useState("");
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
            const range = getDateRange(dateMode, selectedMonth, { from: customFrom, to: customTo });
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
    }, [dateMode, selectedMonth, customFrom, customTo]);

    useEffect(() => {
        if (dateMode !== "custom" || (customFrom && customTo)) {
            fetchData();
        }
    }, [fetchData, dateMode, customFrom, customTo]);

    const totalViewsInRange = data.dailyViews.reduce((s, d) => s + d.count, 0);

    // Conversion rate
    const conversionRate = useMemo(() => {
        if (totalViewsInRange === 0) return 0;
        return ((totalMessages / totalViewsInRange) * 100).toFixed(1);
    }, [totalMessages, totalViewsInRange]);

    // Format chart data
    const chartData = useMemo(() => {
        return data.dailyViews.map(d => {
            const dateObj = new Date(d.date + 'T12:00:00');
            return {
                ...d,
                label: dateMode === "7days"
                    ? DAY_NAMES[dateObj.getDay()]
                    : `${dateObj.getDate()}`,
            };
        });
    }, [data.dailyViews, dateMode]);

    const handlePrevMonth = () => {
        setSelectedMonth(prev => {
            if (prev.month === 0) return { year: prev.year - 1, month: 11 };
            return { ...prev, month: prev.month - 1 };
        });
    };

    const handleNextMonth = () => {
        const now = new Date();
        setSelectedMonth(prev => {
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
        <div className="space-y-5">
            {/* Date Mode Selector */}
            <div className="flex items-center gap-2 flex-wrap">
                <button
                    onClick={() => setDateMode("7days")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${dateMode === "7days"
                        ? "bg-blue-500/10 text-blue-400"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                        }`}
                >
                    7 días
                </button>
                <button
                    onClick={() => setDateMode("month")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${dateMode === "month"
                        ? "bg-blue-500/10 text-blue-400"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                        }`}
                >
                    <Calendar className="w-3.5 h-3.5" />
                    Mes
                </button>
                <button
                    onClick={() => setDateMode("custom")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${dateMode === "custom"
                        ? "bg-blue-500/10 text-blue-400"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                        }`}
                >
                    Personalizado
                </button>

                {dateMode === "month" && (
                    <div className="flex items-center gap-2 ml-auto">
                        <button onClick={handlePrevMonth} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-medium text-slate-200 min-w-[120px] text-center">
                            {MONTHS_ES[selectedMonth.month]} {selectedMonth.year}
                        </span>
                        <button onClick={handleNextMonth} disabled={isFutureMonth()} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors disabled:opacity-30">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {dateMode === "custom" && (
                    <div className="flex items-center gap-2 ml-auto">
                        <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
                            className="bg-slate-800/60 border border-slate-700/50 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500/50" />
                        <span className="text-slate-500 text-xs">→</span>
                        <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
                            className="bg-slate-800/60 border border-slate-700/50 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500/50" />
                    </div>
                )}

                {loading && <Loader2 className="w-4 h-4 animate-spin text-blue-400 ml-2" />}
            </div>

            {/* Summary Stats — 5 cards now including Conversion */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <StatCard icon={<Eye className="w-4 h-4" />} label="Visitas" value={totalViewsInRange} color="blue" />
                <StatCard icon={<Globe className="w-4 h-4" />} label="Páginas" value={data.topPages.length} color="violet" />
                <StatCard icon={<Building2 className="w-4 h-4" />} label="Props. Vistas" value={data.topProperties.length} color="emerald" />
                <StatCard icon={<Search className="w-4 h-4" />} label="Búsquedas" value={data.topSearches.reduce((s, i) => s + i.count, 0)} color="amber" />
                <StatCard icon={<Percent className="w-4 h-4" />} label="Conversión" value={Number(conversionRate)} suffix="%" color="rose" />
            </div>

            {/* Area Chart */}
            <div className="bg-slate-800/20 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-blue-400" />
                        <h3 className="text-xs font-semibold text-slate-200">Visitas por Día</h3>
                    </div>
                    <span className="text-[11px] text-slate-500">{totalViewsInRange} visitas</span>
                </div>

                {chartData.length === 0 ? (
                    <EmptyState icon={BarChart3} title="Sin datos" subtitle="No hay visitas registradas en este período" compact />
                ) : (
                    <ResponsiveContainer width="100%" height={180}>
                        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="label"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#475569', fontSize: 10 }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#475569', fontSize: 10 }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="count"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                fill="url(#viewsGradient)"
                                dot={false}
                                activeDot={{ r: 5, fill: '#3b82f6', stroke: '#1e293b', strokeWidth: 2 }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* Rankings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Top Pages */}
                <RankingCard title="Páginas Más Visitadas" icon={<Globe className="w-4 h-4 text-violet-400" />} color="violet">
                    {data.topPages.length === 0 ? (
                        <EmptyState icon={Globe} title="Sin datos de navegación" subtitle="Las páginas visitadas aparecerán aquí cuando haya tráfico" compact />
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

                {/* Top Properties */}
                <RankingCard title="Propiedades Más Vistas" icon={<Building2 className="w-4 h-4 text-emerald-400" />} color="emerald">
                    {data.topProperties.length === 0 ? (
                        <EmptyState icon={Building2} title="Aún sin visitas a propiedades" subtitle="Publicá propiedades para comenzar a recibir visitas 🏠" compact />
                    ) : (
                        data.topProperties.slice(0, 5).map((prop, i) => (
                            <Link
                                key={i}
                                href={`/propiedades/${prop.id}`}
                                target="_blank"
                                className="flex items-center gap-3 p-2 -mx-2 rounded-xl hover:bg-slate-800/50 transition-colors group"
                            >
                                <span className="text-xs text-slate-600 w-4 text-right font-mono">{i + 1}</span>
                                <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0 relative">
                                    {prop.image ? (
                                        <Image src={prop.image} alt={prop.title} fill className="object-cover" sizes="36px" />
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
                        <EmptyState icon={Search} title="Sin búsquedas registradas" subtitle="Las búsquedas de tus usuarios aparecerán aquí 🔍" compact />
                    ) : (
                        data.topSearches.slice(0, 5).map((item, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <span className="text-xs text-slate-600 w-4 text-right font-mono">{i + 1}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm text-slate-300 truncate">&quot;{item.label}&quot;</div>
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
function StatCard({ icon, label, value, color, suffix }: { icon: React.ReactNode; label: string; value: number; color: string; suffix?: string }) {
    const colorMap: Record<string, string> = {
        blue: "bg-blue-500/10 text-blue-400",
        violet: "bg-violet-500/10 text-violet-400",
        emerald: "bg-emerald-500/10 text-emerald-400",
        amber: "bg-amber-500/10 text-amber-400",
        rose: "bg-rose-500/10 text-rose-400",
    };
    return (
        <div className="bg-slate-800/20 rounded-2xl p-3 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
                {icon}
            </div>
            <div>
                <div className="text-lg font-bold text-white">{value}{suffix || ""}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</div>
            </div>
        </div>
    );
}

function RankingCard({ title, icon, children }: { title: string; icon: React.ReactNode; color: string; children: React.ReactNode }) {
    return (
        <div className="bg-slate-800/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
                {icon}
                <h4 className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">{title}</h4>
            </div>
            <div className="space-y-2.5">
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
