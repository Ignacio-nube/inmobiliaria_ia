import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { ToastProvider } from "@/components/ui/ToastProvider";

export const metadata = {
    title: "Admin Panel | Ignacio Propiedades",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient();

    // Fetch counts for sidebar badges
    const [pendingRes, messagesRes] = await Promise.all([
        supabase.from("properties").select("id", { count: "exact", head: true }).eq("approval_status", "pending"),
        supabase.from("contacts").select("id", { count: "exact", head: true }).eq("status", "new"),
    ]);

    const pendingCount = pendingRes.count || 0;
    const unreadMessages = messagesRes.count || 0;

    return (
        <div className="flex min-h-screen bg-[#0a0f1e] text-slate-200 antialiased selection:bg-blue-500 selection:text-white">
            <AdminSidebar pendingCount={pendingCount} unreadMessages={unreadMessages} />

            <main className="flex-1 overflow-y-auto relative">
                {/* Decorative background */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />

                <div className="max-w-7xl mx-auto p-8 lg:p-12 relative z-10">
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {children}
                    </div>
                </div>
            </main>
            <ToastProvider />
        </div>
    );
}
