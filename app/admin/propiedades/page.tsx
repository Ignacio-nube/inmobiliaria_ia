import { createClient } from "@/lib/supabase/server";
import { PropertiesTable } from "@/components/admin/PropertiesTable";

export const revalidate = 0;

export const metadata = {
    title: "Propiedades | Admin",
};

export default async function AdminPropertiesPage() {
    const supabase = await createClient();

    const { data: properties, error } = await supabase
        .from("properties")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching admin properties:", error);
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white tracking-tight mb-1">
                    Propiedades
                </h1>
                <p className="text-slate-400 text-sm">
                    Gestioná todas las propiedades de la plataforma.
                </p>
            </div>

            <PropertiesTable properties={properties || []} />
        </div>
    );
}
