import { createClient } from "@/lib/supabase/server";
import { MessagesTable } from "@/components/admin/MessagesTable";

export const revalidate = 0; // Don't cache admin pages

export default async function AdminMessagesPage() {
    const supabase = await createClient();

    // Fetch all contacts/messages, ordered by newest
    const { data: messages, error } = await supabase
        .from("contacts")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching messages:", error);
    }

    const unreadCount = messages?.filter(m => m.status === 'new').length || 0;

    return (
        <div>
            <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
                        Bandeja de Mensajes
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Consultas recibidas desde los formularios de contacto de las propiedades.
                    </p>
                </div>
                <div className="flex gap-4 items-center">
                    <div className="px-4 py-2 bg-brand/10 text-brand border border-brand/20 rounded-xl font-medium text-sm">
                        Nuevos: {unreadCount}
                    </div>
                    <div className="px-4 py-2 bg-card border border-border rounded-xl text-muted-foreground text-sm">
                        Total: {messages?.length || 0}
                    </div>
                </div>
            </div>

            <div className="mt-8">
                <MessagesTable messages={messages || []} />
            </div>
        </div>
    );
}
