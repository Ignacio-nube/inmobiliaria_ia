"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, Maximize2, Minimize2, Send, CornerDownLeft, Sparkles } from "lucide-react";

export function PublishAssistantBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<{ role: 'ai' | 'user', content: string }[]>([
        { role: 'ai', content: '¡Hola! Soy tu asistente de Ignacio Propiedades. Estoy aquí para ayudarte a publicar tu propiedad. ¿Tienes alguna duda sobre qué poner en la descripción, el precio o cómo tomar las mejores fotos?' }
    ]);
    const [input, setInput] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Auto scroll
    useEffect(() => {
        if (isOpen && !isMinimized) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen, isMinimized]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        // Add user message
        const userMessage = input;
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setInput("");

        // Simulate AI thinking and responding
        setTimeout(() => {
            let aiResponse = "¡Excelente pregunta! Para la descripción, te sugiero enfocarte en lo que hace única a tu propiedad (luminosidad, tipo de construcción, ubicación estratégica).";

            if (userMessage.toLowerCase().includes('foto') || userMessage.toLowerCase().includes('imagen')) {
                aiResponse = "Te recomiendo subir al menos 5 fotos horizontales y con buena luz natural, mostrando primero la fachada, luego el living/comedor, cocina, dormitorios y finalmente el patio o amenidades si tiene.";
            } else if (userMessage.toLowerCase().includes('precio') || userMessage.toLowerCase().includes('dolar')) {
                aiResponse = "Puedes publicar el precio en dólares. Si no estás seguro del valor de mercado, Ignacio Nube puede hacerte la tasación sin cargo.";
            } else if (userMessage.toLowerCase().includes('expensa')) {
                aiResponse = "Si es un barrio privado o edificio, no olvides colocar un aproximado de las expensas mensuales en Pesos (ARS).";
            }

            setMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);
        }, 1200);
    };

    // If fully closed (not even the trigger button), don't render?
    // Actually we want a floating trigger button when closed.

    if (!mounted) return null;

    return createPortal(
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end pointer-events-none">

            {/* The Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                            y: 0,
                            height: isMinimized ? 'auto' : 480
                        }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className={`bg-card/95 backdrop-blur-xl border border-border shadow-2xl overflow-hidden flex flex-col pointer-events-auto rounded-3xl origin-bottom-right mb-4 ${isMinimized ? 'w-80' : 'w-96'}`}
                    >
                        {/* Header */}
                        <div className="px-5 py-4 bg-brand flex items-center justify-between text-white shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                    <Bot className="w-5 h-5 text-gold" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-sm">Asistente de Publicación</h3>
                                    <p className="text-[11px] text-white/70 flex items-center gap-1">
                                        <Sparkles className="w-3 h-3 text-gold" />
                                        Inteligencia Artificial
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setIsMinimized(!isMinimized)} className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white">
                                    {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                                </button>
                                <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Body */}
                        {!isMinimized && (
                            <>
                                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                                    {messages.map((msg, idx) => (
                                        <div key={idx} className={`flex ${msg.role === 'ai' ? 'justify-start' : 'justify-end'}`}>
                                            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${msg.role === 'ai'
                                                ? 'bg-muted/50 text-foreground border border-border/50 rounded-tl-sm'
                                                : 'bg-brand text-white rounded-tr-sm shadow-md'
                                                }`}>
                                                {msg.content}
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input */}
                                <div className="p-3 border-t border-border bg-background shrink-0">
                                    <form onSubmit={handleSubmit} className="relative flex items-center">
                                        <input
                                            type="text"
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            placeholder="Pregúntame cómo llenar algo..."
                                            className="w-full bg-muted/30 border border-border rounded-full pl-5 pr-12 py-3 text-sm focus:ring-2 focus:ring-brand outline-none transition-all placeholder:text-muted-foreground/60"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!input.trim()}
                                            className="absolute right-2 p-2 bg-brand text-white rounded-full hover:bg-gold hover:text-black hover:scale-105 transition-all disabled:opacity-50 disabled:hover:bg-brand disabled:hover:scale-100 disabled:hover:text-white"
                                        >
                                            <CornerDownLeft className="w-4 h-4" />
                                        </button>
                                    </form>
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Trigger Button (Only show when closed) */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsOpen(true)}
                        className="bg-brand text-white border border-brand/20 shadow-[-5px_10px_30px_rgba(212,175,55,0.3)] hover:shadow-gold/40 w-16 h-16 rounded-full flex items-center justify-center transition-shadow pointer-events-auto relative group"
                    >
                        <Bot className="w-8 h-8" />

                        {/* Notification dot */}
                        <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 border-2 border-background rounded-full animate-pulse" />

                        {/* Tooltip */}
                        <span className="absolute right-full mr-4 bg-foreground text-background text-xs font-medium px-3 py-1.5 rounded-xl opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all pointer-events-none whitespace-nowrap shadow-lg">
                            Ayuda con tu publicación
                        </span>
                    </motion.button>
                )}
            </AnimatePresence>

        </div>,
        document.body
    );
}
