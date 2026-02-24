"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAdmin = pathname?.startsWith('/admin');

    if (isAdmin) {
        return <>{children}</>;
    }

    return (
        <div className="flex-grow flex flex-col relative w-full overflow-x-hidden">
            <Header />
            <main className="flex-grow flex flex-col relative w-full overflow-x-hidden">
                {children}
            </main>
            <Footer />
        </div>
    );
}
