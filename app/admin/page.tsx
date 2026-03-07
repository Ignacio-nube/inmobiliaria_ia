import { createClient } from "@/lib/supabase/server";
import { DashboardStats } from "@/components/admin/DashboardStats";
import { ApprovalQueue } from "@/components/admin/ApprovalQueue";
import { AnalyticsPanel } from "@/components/admin/AnalyticsPanel";

export const revalidate = 0;

export default async function AdminDashboardPage() {
    const supabase = await createClient();

    const now = Date.now();
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
    const fourteenDaysAgo = new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString();

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

    const publishedCount = allProperties.filter(p => p.published && p.approval_status === 'approved').length;
    const withoutImages = allProperties.filter(p => !p.images || p.images.length === 0).length;
    const pendingApproval = allProperties.filter(p => p.approval_status === 'pending').length;
    const totalViews7d = viewsLast7Res.count || 0;
    const totalViewsPrev7d = viewsPrev7Res.count || 0;
    const viewsTrend = totalViewsPrev7d > 0
        ? Math.round(((totalViews7d - totalViewsPrev7d) / totalViewsPrev7d) * 100)
        : 0;

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
            {/* Header */}
            <div className="flex-shrink-0 mb-4">
                <h1 className="text-3xl font-bold text-white tracking-tight mb-1">
                    Dashboard
                </h1>
                <p className="text-slate-400 text-sm">
                    Resumen general de tu plataforma inmobiliaria.
                </p>
            </div>

            {/* KPI Cards */}
            <div className="flex-shrink-0 mb-4">
                <DashboardStats stats={{
                    pendingApproval,
                    publishedCount,
                    unreadMessages: unreadMessagesRes.count || 0,
                    withoutImages,
                    totalViews: totalViews7d,
                    viewsTrend,
                }} />
            </div>

            {/* Main Grid — fixed height, independent scrolling */}
            <div className="flex-1 grid grid-cols-1 xl:grid-cols-[2fr_3fr] gap-6 min-h-0">
                {/* Approval Queue */}
                <div className="flex flex-col min-h-0" id="approval-queue">
                    <div className="flex items-center justify-between mb-3 flex-shrink-0">
                        <h2 className="text-base font-semibold text-slate-200">Cola de Aprobación</h2>
                        <span className="text-xs text-slate-500">{pendingProperties.length} pendientes</span>
                    </div>
                    <div className="flex-1 overflow-y-auto min-h-0 pr-1">
                        <ApprovalQueue properties={pendingProperties} />
                    </div>
                </div>

                {/* Analytics — independent scroll */}
                <div className="flex flex-col min-h-0">
                    <div className="mb-3 flex-shrink-0">
                        <h2 className="text-base font-semibold text-slate-200">Analytics</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto min-h-0 pr-1">
                        <AnalyticsPanel totalMessages={unreadMessagesRes.count || 0} />
                    </div>
                </div>
            </div>
        </div>
    );
}
