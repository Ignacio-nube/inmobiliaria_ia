"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Settings, Home, Mail, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export function AdminSidebar() {
    const pathname = usePathname();

    const navItems = [
        { name: "Propiedades", href: "/admin", icon: LayoutDashboard },
        { name: "Mensajes", href: "/admin/mensajes", icon: Mail },
        { name: "Sitio y CMS", href: "/admin/settings", icon: Settings },
    ];

    return (
        <aside className="w-72 bg-zinc-950 text-zinc-100 flex flex-col pt-12 rounded-r-3xl border-r border-zinc-800 shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand/20 blur-[100px] rounded-full pointer-events-none" />

            <div className="px-8 mb-12 relative z-10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-gold flex items-center justify-center text-black shadow-lg">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                </div>
                <div>
                    <h2 className="text-xl font-bold font-heading tracking-tight text-white leading-tight">Admin</h2>
                    <p className="text-xs text-zinc-400 font-medium tracking-wide uppercase">Ignacio Prop.</p>
                </div>
            </div>

            <nav className="flex-1 w-full px-4 space-y-2 relative z-10">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-medium transition-all group relative overflow-hidden ${isActive
                                    ? "text-white"
                                    : "text-zinc-400 hover:text-white"
                                }`}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-white/10 border border-white/20 rounded-2xl"
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                            )}

                            <div className="flex items-center gap-3 relative z-10">
                                <item.icon className="w-5 h-5" />
                                <span>{item.name}</span>
                            </div>

                            {isActive && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="relative z-10"
                                >
                                    <ChevronRight className="w-4 h-4 text-gold" />
                                </motion.div>
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="w-full p-4 mt-auto relative z-10">
                <Link
                    href="/"
                    className="flex items-center gap-3 px-4 py-4 rounded-2xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all group border border-transparent hover:border-white/10"
                >
                    <Home className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
                    <span>Volver al Sitio Web</span>
                </Link>
            </div>
        </aside>
    );
}
