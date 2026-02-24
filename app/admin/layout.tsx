import { AdminSidebar } from "@/components/admin/AdminSidebar";

export const metadata = {
    title: "Admin Panel | Ignacio Propiedades",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen bg-zinc-50 dark:bg-black text-foreground antialiased selection:bg-brand selection:text-white">
            <AdminSidebar />

            <main className="flex-1 overflow-y-auto relative bg-zinc-50 dark:bg-black">
                {/* Decorative background blurs */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand/5 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-gold/5 blur-[120px] rounded-full pointer-events-none" />

                <div className="max-w-7xl mx-auto p-10 lg:p-14 relative z-10">
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
