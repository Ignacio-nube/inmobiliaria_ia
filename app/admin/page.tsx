import { createClient } from "@/lib/supabase/server";
import { PropertiesTable } from "@/components/admin/PropertiesTable";

export const revalidate = 0; // Don't cache admin pages

export default async function AdminDashboardPage() {
    const supabase = await createClient();

    // Fetch all properties, ordered by newest
    const { data: properties, error } = await supabase
        .from("properties")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching admin properties:", error);
    }

    return (
        <div>
            <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
                        Panel de Control
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Gestioná las propiedades listadas en la plataforma.
                    </p>
                </div>
                <div className="flex gap-4 items-center">
                    <div className="px-4 py-2 bg-card border border-border rounded-xl shadow-sm text-sm">
                        Total Propiedades: <span className="font-bold text-brand">{properties?.length || 0}</span>
                    </div>
                </div>
            </div>

            <div className="mt-8">
                <PropertiesTable properties={properties || []} />
            </div>
        </div>
    );
}
