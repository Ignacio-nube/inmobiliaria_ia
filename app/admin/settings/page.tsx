import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/admin/SettingsForm";

export const revalidate = 0;

export default async function AdminSettingsPage() {
    const supabase = await createClient();

    const { data: settings, error } = await supabase
        .from("site_settings")
        .select("*")
        .limit(1)
        .single();

    if (error) {
        console.error("Error fetching site settings:", error);
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white tracking-tight mb-1">
                    Sitio y CMS
                </h1>
                <p className="text-slate-400 text-sm max-w-2xl">
                    Personalizá el look & feel de tu inmobiliaria online. Cambiá textos principales, tipografías y colores. Los cambios se verán reflejados al instante.
                </p>
            </div>

            {settings ? (
                <SettingsForm settings={settings} />
            ) : (
                <div className="p-6 bg-red-500/10 text-red-400 rounded-2xl border border-red-500/20">
                    Error al cargar la configuración. Asegurate de que la tabla <code className="font-mono bg-red-500/10 px-2 py-0.5 rounded">site_settings</code> exista y tenga un registro.
                </div>
            )}
        </div>
    );
}
