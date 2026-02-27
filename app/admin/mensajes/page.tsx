import { createClient } from "@/lib/supabase/server";
import { MessagesTable } from "@/components/admin/MessagesTable";

export const revalidate = 0;

export const metadata = {
    title: "Mensajes | Admin",
};

export default async function AdminMessagesPage() {
    const supabase = await createClient();

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
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight mb-1">
                        Mensajes
                    </h1>
                    <p className="text-slate-400 text-sm">
                        Consultas recibidas desde los formularios de contacto.
                    </p>
                </div>
                <div className="flex gap-3 items-center">
                    {unreadCount > 0 && (
                        <div className="px-4 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl font-semibold text-sm flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                            {unreadCount} nuevos
                        </div>
                    )}
                    <div className="px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-400 text-sm">
                        Total: {messages?.length || 0}
                    </div>
                </div>
            </div>

            <MessagesTable messages={messages || []} />
        </div>
    );
}
