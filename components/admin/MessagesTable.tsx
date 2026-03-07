"use client";

import { useState, useMemo, useTransition } from "react";
import { markMessageRead, deleteMessage, markAllMessagesRead } from "@/app/admin/actions";
import {
    Check, Trash2, MessageSquare, Home, Phone, Calculator,
    ChevronDown, ChevronUp, ExternalLink, Mail, Clock, CheckCheck,
    Send, Loader2
} from "lucide-react";
import { Database } from "@/lib/database.types";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";

type Contact = Database['public']['Tables']['contacts']['Row'];

const INQUIRY_TABS = [
    { key: "all", label: "Todos", icon: MessageSquare },
    { key: "new", label: "No leídos", icon: Mail },
    { key: "property", label: "Propiedad", icon: Home },
    { key: "general", label: "General", icon: Phone },
    { key: "appraisal", label: "Tasación", icon: Calculator },
] as const;

const INQUIRY_BADGE: Record<string, { label: string; className: string }> = {
    property: { label: "Propiedad", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    general: { label: "General", className: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
    appraisal: { label: "Tasación", className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
};

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "ahora";
    if (mins < 60) return `hace ${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `hace ${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `hace ${days}d`;
    return new Date(dateStr).toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
}

function MessageCard({ msg, onMarkRead, onDelete, isPending }: {
    msg: Contact;
    onMarkRead: (id: string) => void;
    onDelete: (id: string) => void;
    isPending: boolean;
}) {
    const [expanded, setExpanded] = useState(false);
    const [replyText, setReplyText] = useState("");
    const isNew = msg.status === "new";
    const type = msg.inquiry_type || "property";
    const badge = INQUIRY_BADGE[type] || INQUIRY_BADGE.general;

    const handleSendEmail = () => {
        const subject = encodeURIComponent(`Re: Consulta - ${msg.property_title || "Ignacio Propiedades"}`);
        const body = encodeURIComponent(replyText);
        window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
        toast.success("Se abrió tu cliente de email");
    };

    return (
        <div className={`rounded-2xl border transition-all duration-200 ${isNew
            ? "border-blue-500/30 bg-blue-500/5"
            : "border-slate-700/50 bg-slate-800/20 opacity-75"
            }`}>
            {/* Header Row */}
            <div
                className="flex items-start gap-4 p-5 cursor-pointer"
                onClick={() => setExpanded(e => !e)}
            >
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${isNew ? "bg-blue-500/20 text-blue-400" : "bg-slate-700/50 text-slate-400"}`}>
                    {msg.name.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`font-semibold text-sm ${isNew ? "text-white" : "text-slate-300"}`}>
                            {msg.name}
                        </span>
                        {isNew && (
                            <span className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0" />
                        )}
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.className}`}>
                            {badge.label}
                        </span>
                        <span className="text-[10px] text-slate-500 ml-auto flex-shrink-0 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {timeAgo(msg.created_at)}
                        </span>
                    </div>
                    <p className={`text-sm leading-relaxed ${isNew ? "text-slate-300" : "text-slate-500"} ${!expanded ? "line-clamp-2" : ""}`}>
                        {msg.message}
                    </p>
                    {msg.property_title && (
                        <div className="mt-2">
                            <a
                                href={`/propiedades/${msg.property_id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
                                onClick={e => e.stopPropagation()}
                            >
                                <Home className="w-3 h-3" />
                                {msg.property_title}
                                <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                    )}
                </div>

                {/* Expand icon */}
                <div className="text-slate-500 flex-shrink-0 mt-1">
                    {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
            </div>

            {/* Expanded Body */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="px-5 pb-5 border-t border-slate-700/40 pt-4 space-y-4">
                            {/* Full message */}
                            <div className="bg-slate-900/50 rounded-xl p-4">
                                <p className="text-sm font-medium text-slate-400 mb-2 uppercase tracking-wider text-[10px]">Mensaje completo</p>
                                <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                            </div>

                            {/* Contact details */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-900/30 rounded-xl p-3">
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Teléfono</p>
                                    <p className="text-sm text-slate-300 font-medium">{msg.phone}</p>
                                </div>
                                <div className="bg-slate-900/30 rounded-xl p-3">
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Fecha</p>
                                    <p className="text-sm text-slate-300 font-medium">
                                        {new Date(msg.created_at).toLocaleDateString("es-AR", {
                                            day: "2-digit", month: "long", year: "numeric",
                                            hour: "2-digit", minute: "2-digit"
                                        })}
                                    </p>
                                </div>
                            </div>

                            {/* Quick Reply Panel */}
                            <div className="bg-slate-900/30 rounded-xl p-4 border border-slate-700/30">
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 font-semibold">Respuesta rápida</p>
                                <textarea
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder={`Hola ${msg.name}, gracias por tu consulta...`}
                                    className="w-full bg-slate-800/60 border border-slate-700/40 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-all resize-none"
                                    rows={3}
                                />
                                <div className="flex justify-end mt-2">
                                    <button
                                        onClick={handleSendEmail}
                                        disabled={!replyText.trim()}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-xl transition-colors disabled:opacity-40"
                                    >
                                        <Send className="w-3.5 h-3.5" />
                                        Enviar por Email
                                    </button>
                                </div>
                            </div>

                            {/* Action buttons */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <a
                                    href={`https://wa.me/${msg.phone.replace(/\D/g, '')}?text=Hola+${encodeURIComponent(msg.name)}!+Te+escribo+de+Ignacio+Propiedades+en+respuesta+a+tu+consulta.`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-400 border border-green-500/20 rounded-xl text-sm font-medium hover:bg-green-500/20 transition-colors"
                                >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.878-.788-1.47-1.761-1.643-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01h-.008c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
                                    </svg>
                                    WhatsApp
                                </a>

                                {isNew && (
                                    <button
                                        onClick={() => onMarkRead(msg.id)}
                                        disabled={isPending}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl text-sm font-medium hover:bg-blue-500/20 transition-colors disabled:opacity-50"
                                    >
                                        <CheckCheck className="w-4 h-4" />
                                        Marcar leído
                                    </button>
                                )}

                                <button
                                    onClick={() => onDelete(msg.id)}
                                    disabled={isPending}
                                    className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 ml-auto"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export function MessagesTable({ messages }: { messages: Contact[] }) {
    const [isPending, startTransition] = useTransition();
    const [activeTab, setActiveTab] = useState<string>("all");
    const [markingAll, setMarkingAll] = useState(false);

    const filteredMessages = useMemo(() => {
        if (activeTab === "all") return messages;
        if (activeTab === "new") return messages.filter(m => m.status === "new");
        return messages.filter(m => (m.inquiry_type || "property") === activeTab);
    }, [messages, activeTab]);

    const counts = useMemo(() => {
        const c: Record<string, number> = {
            all: messages.length,
            new: messages.filter(m => m.status === "new").length,
            property: 0, general: 0, appraisal: 0,
        };
        messages.forEach(m => {
            const type = m.inquiry_type || "property";
            c[type] = (c[type] || 0) + 1;
        });
        return c;
    }, [messages]);

    const handleMarkRead = (id: string) => {
        startTransition(async () => {
            await markMessageRead(id);
            toast.success("Mensaje marcado como leído");
        });
    };

    const handleMarkAllRead = () => {
        if (counts.new === 0) return;
        const count = counts.new;
        setMarkingAll(true);
        startTransition(async () => {
            try {
                await markAllMessagesRead();
                toast.success(`${count} mensajes marcados como leídos ✓`);
            } catch (err) {
                toast.error("Error al marcar mensajes como leídos");
                console.error(err);
            } finally {
                setMarkingAll(false);
            }
        });
    };

    const handleDelete = (id: string) => {
        if (confirm("¿Eliminar este mensaje?")) {
            startTransition(async () => {
                await deleteMessage(id);
                toast.success("Mensaje eliminado");
            });
        }
    };

    const newMsgs = filteredMessages.filter(m => m.status === "new");
    const readMsgs = filteredMessages.filter(m => m.status !== "new");

    return (
        <div>
            {/* Tabs + Mark All Read */}
            <div className="flex items-center justify-between gap-4 mb-6">
                <div className="flex gap-1 overflow-x-auto pb-1">
                    {INQUIRY_TABS.map(tab => {
                        const isActive = activeTab === tab.key;
                        const Icon = tab.icon;
                        const count = counts[tab.key] || 0;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${isActive
                                    ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent"
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                                {count > 0 && (
                                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${tab.key === "new" && count > 0
                                        ? "bg-blue-500 text-white"
                                        : isActive ? "bg-blue-500/20 text-blue-400" : "bg-slate-700/50 text-slate-400"
                                        }`}>
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {counts.new > 0 && (
                    <button
                        onClick={handleMarkAllRead}
                        disabled={markingAll || isPending}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl text-xs font-medium hover:bg-blue-500/20 transition-colors disabled:opacity-50 whitespace-nowrap flex-shrink-0"
                    >
                        {markingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" />}
                        Marcar todos como leídos
                    </button>
                )}
            </div>

            {filteredMessages.length === 0 ? (
                <div className="text-center py-16 bg-slate-800/20 rounded-2xl border border-slate-700/40">
                    <MessageSquare className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 font-medium">No hay mensajes en esta categoría</p>
                    <p className="text-slate-500 text-xs mt-1">Los mensajes nuevos aparecerán aquí</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Unread section */}
                    {newMsgs.length > 0 && (
                        <div className="space-y-3">
                            {activeTab === "all" && (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                                        No leídos ({newMsgs.length})
                                    </span>
                                    <div className="flex-1 h-px bg-blue-500/20" />
                                </div>
                            )}
                            {newMsgs.map(msg => (
                                <MessageCard key={msg.id} msg={msg} onMarkRead={handleMarkRead} onDelete={handleDelete} isPending={isPending} />
                            ))}
                        </div>
                    )}

                    {/* Read section */}
                    {readMsgs.length > 0 && (
                        <div className="space-y-3">
                            {activeTab === "all" && newMsgs.length > 0 && (
                                <div className="flex items-center gap-2 mt-4">
                                    <Check className="w-3.5 h-3.5 text-slate-500" />
                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        Leídos ({readMsgs.length})
                                    </span>
                                    <div className="flex-1 h-px bg-slate-700/50" />
                                </div>
                            )}
                            {readMsgs.map(msg => (
                                <MessageCard key={msg.id} msg={msg} onMarkRead={handleMarkRead} onDelete={handleDelete} isPending={isPending} />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
