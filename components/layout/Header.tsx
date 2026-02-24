"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
    { name: "Inicio", href: "/" },
    { name: "Propiedades", href: "/propiedades" },
    { name: "Publicar", href: "/publicar" },
    { name: "Contacto", href: "/contacto" },
];

export function Header() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const pathname = usePathname();

    const isDarkHero = pathname === '/' || pathname === '/contacto';
    const isTransparentDark = !isScrolled && isDarkHero;

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <>
            <header
                className={cn(
                    "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-transparent",
                    isScrolled
                        ? "bg-white/70 backdrop-blur-lg border-border/50 shadow-sm py-4"
                        : "bg-transparent py-6"
                )}
            >
                <div className="container mx-auto px-6 max-w-7xl flex items-center justify-between">
                    <Link href="/" className="z-50 relative">
                        <Logo isDarkTheme={isTransparentDark} />
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-8">
                        {NAV_LINKS.map((link) => {
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className="relative group text-sm font-medium transition-colors"
                                >
                                    <span className={cn(
                                        isActive
                                            ? "text-brand"
                                            : isTransparentDark
                                                ? "text-white/90 group-hover:text-white"
                                                : "text-foreground group-hover:text-brand"
                                    )}>
                                        {link.name}
                                    </span>
                                    {isActive && (
                                        <motion.div
                                            layoutId="nav-indicator"
                                            className="absolute -bottom-1 left-0 right-0 h-px bg-gold"
                                        />
                                    )}
                                </Link>
                            );
                        })}
                        <Link
                            href="/publicar"
                            className="px-6 py-2.5 bg-brand text-white font-medium text-sm rounded-full hover:bg-gold hover:text-black transition-all duration-300 shadow-md hover:shadow-gold/20"
                        >
                            Publicar Propiedad
                        </Link>
                    </nav>

                    {/* Mobile Toggle */}
                    <button
                        className={cn("md:hidden z-50 relative p-2", isTransparentDark ? "text-white" : "text-foreground")}
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>
            </header>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed inset-0 z-40 bg-background/95 backdrop-blur-xl pt-24 px-6 md:hidden"
                    >
                        <nav className="flex flex-col gap-6 items-center">
                            {NAV_LINKS.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="text-2xl font-brand font-medium tracking-tight"
                                >
                                    {link.name}
                                </Link>
                            ))}
                            <Link
                                href="/publicar"
                                onClick={() => setMobileMenuOpen(false)}
                                className="mt-4 px-8 py-4 w-full text-center bg-brand text-white font-medium text-lg rounded-2xl shadow-xl shadow-brand/20"
                            >
                                Publicar Propiedad
                            </Link>
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
