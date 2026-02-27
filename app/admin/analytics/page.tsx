import { AnalyticsPanel } from "@/components/admin/AnalyticsPanel";

export const revalidate = 0;

export const metadata = {
    title: "Analytics | Admin",
};

export default function AdminAnalyticsPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white tracking-tight mb-1">
                    Analytics
                </h1>
                <p className="text-slate-400 text-sm">
                    Estadísticas de tráfico, búsquedas y propiedades más visitadas.
                </p>
            </div>

            <AnalyticsPanel />
        </div>
    );
}
