"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
    { name: "Inicio", href: "/" },
    { name: "Propiedades", href: "/propiedades" },
    { name: "Publicar", href: "/publicar" },
    { name: "Contacto", href: "/contacto" },
];

// Pages that have a full-screen dark hero image — header can be more transparent there
const DARK_HERO_PAGES = ["/", "/contacto"];

export function Header() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const pathname = usePathname();

    const hasDarkHero = DARK_HERO_PAGES.includes(pathname);

    useEffect(() => {
        // Trigger glass from the very first scroll pixel
        const handleScroll = () => setIsScrolled(window.scrollY > 1);
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Hero pages (/, /contacto): fully transparent at top, glass on scroll
    // Other pages (/propiedades, /publicar): always solid dark glass
    const bgOpacity = isScrolled
        ? 0.92
        : hasDarkHero ? 0 : 0.85;

    const headerStyle = {
        backgroundColor: `rgba(8, 12, 28, ${bgOpacity})`,
        backdropFilter: isScrolled || !hasDarkHero ? "blur(20px)" : "none",
        WebkitBackdropFilter: isScrolled || !hasDarkHero ? "blur(20px)" : "none",
        borderBottom: isScrolled || !hasDarkHero
            ? "1px solid rgba(255,255,255,0.07)"
            : "1px solid transparent",
        boxShadow: isScrolled ? "0 4px 30px rgba(0,0,0,0.3)" : "none",
    };

    return (
        <>
            <header
                style={headerStyle}
                className="fixed top-0 left-0 right-0 z-50 transition-all duration-500 py-5"
            >
                <div className="container mx-auto px-6 max-w-7xl flex items-center justify-between">
                    <Link href="/" className="z-50 relative">
                        {/* Logo always white — header is always dark */}
                        <Logo isDarkTheme={true} />
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
                                        "transition-colors duration-200",
                                        isActive
                                            ? "text-gold"
                                            : "text-white/80 group-hover:text-white"
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
                        <ThemeToggle />
                        <Link
                            id="tour-publish-btn"
                            href="/publicar"
                            className="px-6 py-2.5 bg-brand text-white font-medium text-sm rounded-full hover:bg-gold hover:text-black transition-all duration-300 shadow-md hover:shadow-gold/20"
                        >
                            Publicar Propiedad
                        </Link>
                    </nav>

                    {/* Mobile Toggle */}
                    <div className="md:hidden flex items-center gap-3 z-50 relative">
                        <ThemeToggle />
                        <button
                            className="p-2 text-white/80 hover:text-white transition-colors"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label="Abrir menú"
                        >
                            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Menu — also always dark glass */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                        style={{ backgroundColor: "rgba(8, 12, 28, 0.98)" }}
                        className="fixed inset-0 z-40 backdrop-blur-xl pt-24 px-6 md:hidden"
                    >
                        <nav className="flex flex-col gap-6 items-center">
                            {NAV_LINKS.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="text-2xl font-brand font-medium tracking-tight text-white/90 hover:text-white transition-colors"
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
