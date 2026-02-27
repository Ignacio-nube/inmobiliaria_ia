import { createClient } from "@/lib/supabase/server";
import { DashboardStats } from "@/components/admin/DashboardStats";
import { ApprovalQueue } from "@/components/admin/ApprovalQueue";
import { AnalyticsPanel } from "@/components/admin/AnalyticsPanel";

export const revalidate = 0;

export default async function AdminDashboardPage() {
    const supabase = await createClient();

    // Ensure purity by caching the dates once outside the effect/render or using variables
    const now = Date.now();
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
    const fourteenDaysAgo = new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString();

    // Parallel data fetching — only what the server needs
    const [
        allPropertiesRes,
        pendingPropertiesRes,
        unreadMessagesRes,
        viewsLast7Res,
        viewsPrev7Res,
    ] = await Promise.all([
        supabase.from("properties").select("id, images, approval_status, published"),
        supabase.from("properties").select("*").eq("approval_status", "pending").order("created_at", { ascending: false }),
        supabase.from("contacts").select("id", { count: "exact", head: true }).eq("status", "new"),
        supabase.from("page_views").select("id", { count: "exact", head: true })
            .gte("viewed_at", sevenDaysAgo),
        supabase.from("page_views").select("id", { count: "exact", head: true })
            .gte("viewed_at", fourteenDaysAgo)
            .lt("viewed_at", sevenDaysAgo),
    ]);

    const allProperties = allPropertiesRes.data || [];
    const pendingProperties = pendingPropertiesRes.data || [];

    // Compute KPI stats
    const publishedCount = allProperties.filter(p => p.published && p.approval_status === 'approved').length;
    const withoutImages = allProperties.filter(p => !p.images || p.images.length === 0).length;
    const pendingApproval = allProperties.filter(p => p.approval_status === 'pending').length;
    const totalViews7d = viewsLast7Res.count || 0;
    const totalViewsPrev7d = viewsPrev7Res.count || 0;
    const viewsTrend = totalViewsPrev7d > 0
        ? Math.round(((totalViews7d - totalViewsPrev7d) / totalViewsPrev7d) * 100)
        : 0;

    return (
        <div className="space-y-10">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white tracking-tight mb-1">
                    Dashboard
                </h1>
                <p className="text-slate-400 text-sm">
                    Resumen general de tu plataforma inmobiliaria.
                </p>
            </div>

            {/* KPI Cards */}
            <DashboardStats stats={{
                pendingApproval,
                publishedCount,
                unreadMessages: unreadMessagesRes.count || 0,
                withoutImages,
                totalViews: totalViews7d,
                viewsTrend,
            }} />

            {/* Main Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
                {/* Approval Queue */}
                <div className="xl:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-slate-200">Cola de Aprobación</h2>
                        <span className="text-xs text-slate-500">{pendingProperties.length} pendientes</span>
                    </div>
                    <ApprovalQueue properties={pendingProperties} />
                </div>

                {/* Analytics — self-fetching component */}
                <div className="xl:col-span-3">
                    <div className="mb-4">
                        <h2 className="text-lg font-semibold text-slate-200">Analytics</h2>
                    </div>
                    <AnalyticsPanel />
                </div>
            </div>
        </div>
    );
}
