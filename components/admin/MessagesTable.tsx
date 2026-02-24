"use client";

import { useTransition } from "react";
import { markMessageRead, deleteMessage } from "@/app/admin/actions";
import { Check, MailOpen, Trash2 } from "lucide-react";
import { Database } from "@/lib/database.types";

type Contact = Database['public']['Tables']['contacts']['Row'];

export function MessagesTable({ messages }: { messages: Contact[] }) {
    const [isPending, startTransition] = useTransition();

    const handleMarkRead = (id: string) => {
        startTransition(async () => {
            await markMessageRead(id);
        });
    };

    const handleDelete = (id: string) => {
        if (confirm(`¿Estás seguro que deseas eliminar este mensaje?`)) {
            startTransition(async () => {
                await deleteMessage(id);
            });
        }
    };

    if (messages.length === 0) {
        return (
            <div className="text-center py-12 bg-card rounded-2xl border border-border">
                <p className="text-muted-foreground">No hay mensajes en tu bandeja de entrada.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                    <tr>
                        <th className="px-6 py-4 font-medium">Interesado</th>
                        <th className="px-6 py-4 font-medium">Mensaje</th>
                        <th className="px-6 py-4 font-medium">Propiedad</th>
                        <th className="px-6 py-4 font-medium">Fecha</th>
                        <th className="px-6 py-4 font-medium text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {messages.map((msg) => (
                        <tr key={msg.id} className={`transition-colors ${msg.status === 'new' ? 'bg-brand/5 font-medium' : 'hover:bg-muted/10'}`}>
                            <td className="px-6 py-4 align-top">
                                <div className="text-foreground">{msg.name}</div>
                                <div className="text-xs text-muted-foreground">{msg.phone}</div>
                            </td>
                            <td className="px-6 py-4 align-top max-w-sm whitespace-pre-wrap">
                                {msg.message}
                            </td>
                            <td className="px-6 py-4 align-top">
                                {msg.property_title ? (
                                    <a href={`/propiedades/${msg.property_id}`} target="_blank" rel="noreferrer" className="text-brand hover:underline">
                                        {msg.property_title}
                                    </a>
                                ) : (
                                    <span className="text-muted-foreground">-</span>
                                )}
                            </td>
                            <td className="px-6 py-4 align-top text-muted-foreground text-xs">
                                {new Date(msg.created_at).toLocaleDateString()}<br />
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="px-6 py-4 text-right align-top">
                                <div className="flex items-center justify-end gap-2">
                                    {msg.status === 'new' && (
                                        <button
                                            onClick={() => handleMarkRead(msg.id)}
                                            disabled={isPending}
                                            className="p-2 text-brand hover:bg-brand/10 rounded-lg transition-colors"
                                            title="Marcar como leído"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                    )}
                                    <a
                                        href={`https://wa.me/${msg.phone.replace(/\D/g, '')}?text=Hola+${encodeURIComponent(msg.name)}!+Te+escribo+de+Ignacio+Propiedades+en+respuesta+a+tu+consulta.`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                        title="Responder por WhatsApp"
                                    >
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.878-.788-1.47-1.761-1.643-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01h-.008c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
                                        </svg>
                                    </a>
                                    <button
                                        onClick={() => handleDelete(msg.id)}
                                        disabled={isPending}
                                        className="p-2 text-muted-foreground hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                                        title="Eliminar mensaje"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
