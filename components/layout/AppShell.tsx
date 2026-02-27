"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { TrackPageView } from "@/components/analytics/TrackPageView";
import { Database } from "@/lib/database.types";

type SiteSettings = Partial<Database['public']['Tables']['site_settings']['Row']>;

export function AppShell({ children, settings }: { children: React.ReactNode; settings?: SiteSettings }) {
    const pathname = usePathname();
    const isAdmin = pathname?.startsWith('/admin');

    if (isAdmin) {
        return <>{children}</>;
    }

    return (
        <div className="flex-grow flex flex-col relative w-full overflow-x-hidden">
            <TrackPageView />
            <ScrollProgress />
            <Header />
            <main className="flex-grow flex flex-col relative w-full overflow-x-hidden">
                {children}
            </main>
            <Footer settings={settings} />
        </div>
    );
}

