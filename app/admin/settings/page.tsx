import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/admin/SettingsForm";

export const revalidate = 0; // Don't cache admin pages

export default async function AdminSettingsPage() {
    const supabase = await createClient();

    // Fetch site settings
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
                <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
                    Configuración del Sitio (CMS)
                </h1>
                <p className="text-muted-foreground text-sm max-w-2xl">
                    Personalizá el look & feel de tu inmobiliaria online. Cambiá textos principales, tipografías y colores. Los cambios se verán reflejados al instante.
                </p>
            </div>

            <div className="mt-8">
                {settings ? (
                    <SettingsForm settings={settings} />
                ) : (
                    <div className="text-muted-foreground p-6 bg-red-50 text-red-600 rounded-xl border border-red-100">
                        Error al cargar la configuración. Asegurate de que la tabla `site_settings` exista y tenga un registro.
                    </div>
                )}
            </div>
        </div>
    );
}
