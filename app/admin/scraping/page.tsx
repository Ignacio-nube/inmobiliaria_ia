"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Globe, Play, Square, Download, CheckCircle2, AlertCircle,
    Image as ImageIcon, Loader2, ChevronDown, ChevronUp,
    Check, X, RefreshCw, ExternalLink, ArrowUpFromLine,
    Eye, EyeOff, Filter,
} from "lucide-react";
import { importScrapedProperties } from "./actions";
import { toast } from "sonner";

interface ScrapedProperty {
    source_url: string;
    source_slug: string;
    scraped_at: string;
    title: string | null;
    property_code: string | null;
    price: number | null;
    currency: string | null;
    operation_type: string | null;
    property_type: string | null;
    address: string | null;
    city: string | null;
    province: string | null;
    square_meters: number | null;
    square_meters_covered: number | null;
    ambientes: number | null;
    is_monoambiente: boolean;
    description: string | null;
    amenities: string[];
    bedrooms: number | null;
    bathrooms: number | null;
    toilets: number | null;
    year_built: number | null;
    images: string[];
    expenses: number | null;
}

interface LogEntry {
    type: 'status' | 'property' | 'error' | 'warning' | 'complete' | 'info';
    message: string;
    timestamp: string;
}

const PRESET_URLS = [
    {
        name: "Tucumán Propiedades - Todas",
        url: "https://tucumanpropiedades.com.ar/listing?state=24&city=&purpose=&type=&beds=-&q=&user_id=1208&shortBy=null&min_price=&max_price=",
    },
    {
        name: "Tucumán Propiedades - Venta",
        url: "https://tucumanpropiedades.com.ar/listing?user_id=1208&purpose=sale",
    },
    {
        name: "Tucumán Propiedades - Alquiler",
        url: "https://tucumanpropiedades.com.ar/listing?user_id=1208&purpose=rent",
    },
];

export default function ScrapingPage() {
    const [url, setUrl] = useState(PRESET_URLS[0].url);
    const [maxPages, setMaxPages] = useState<number>(10);
    const [isScrapingActive, setIsScrapingActive] = useState(false);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [properties, setProperties] = useState<ScrapedProperty[]>([]);
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [isImporting, setIsImporting] = useState(false);
    const [importResult, setImportResult] = useState<{ imported: number; errors: number; details: string[] } | null>(null);
    const [expandedRow, setExpandedRow] = useState<number | null>(null);
    const [showLogs, setShowLogs] = useState(false);
    const [resultFilter, setResultFilter] = useState<"all" | "new">("all");
    const abortRef = useRef<AbortController | null>(null);
    const logEndRef = useRef<HTMLDivElement>(null);

    const addLog = useCallback((type: LogEntry['type'], message: string) => {
        setLogs(prev => [...prev, { type, message, timestamp: new Date().toLocaleTimeString() }]);
        setTimeout(() => logEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }, []);

    const handleScrape = async () => {
        setIsScrapingActive(true);
        setProperties([]);
        setSelected(new Set());
        setLogs([]);
        setProgress({ current: 0, total: 0 });
        setImportResult(null);
        setShowLogs(true);
        abortRef.current = new AbortController();

        addLog('info', `🚀 Iniciando scraping: ${url}`);

        try {
            const res = await fetch('/api/scrape', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, maxPages }),
                signal: abortRef.current.signal,
            });

            if (!res.ok) {
                const err = await res.json();
                addLog('error', `Error: ${err.error}`);
                setIsScrapingActive(false);
                return;
            }

            const reader = res.body?.getReader();
            if (!reader) throw new Error('No reader');

            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const data = JSON.parse(line);
                        switch (data.type) {
                            case 'status':
                                addLog('status', data.message);
                                break;
                            case 'warning':
                                addLog('warning', data.message);
                                break;
                            case 'error':
                                addLog('error', data.message);
                                break;
                            case 'property':
                                setProperties(prev => [...prev, data.data]);
                                setProgress({ current: data.index, total: data.total });
                                addLog('property', `✅ [${data.index}/${data.total}] ${data.summary}`);
                                break;
                            case 'complete':
                                addLog('info', `🎉 Scraping completado: ${data.total} propiedades`);
                                break;
                        }
                    } catch { /* ignore partial JSON chunks */ }
                }
            }
        } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') {
                addLog('warning', '⏹ Scraping cancelado');
            } else {
                addLog('error', `Error: ${err instanceof Error ? err.message : 'Error desconocido'}`);
            }
        } finally {
            setIsScrapingActive(false);
        }
    };

    const handleStop = () => {
        abortRef.current?.abort();
    };

    const handleSelectAll = () => {
        if (selected.size === properties.length) {
            setSelected(new Set());
        } else {
            setSelected(new Set(properties.map((_, i) => i)));
        }
    };

    const toggleSelect = (idx: number) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(idx)) next.delete(idx);
            else next.add(idx);
            return next;
        });
    };

    const handleImport = async () => {
        const toImport = properties.filter((_, i) => selected.has(i));
        if (toImport.length === 0) return;

        setIsImporting(true);
        addLog('info', `📦 Importando ${toImport.length} propiedades...`);

        try {
            const result = await importScrapedProperties(toImport);
            setImportResult(result);
            addLog('info', `✅ Importadas: ${result.imported} | ❌ Errores: ${result.errors}`);
            toast.success(`${result.imported} propiedades importadas${result.errors > 0 ? `, ${result.errors} con errores` : ''}`);
        } catch (err) {
            addLog('error', `Error al importar: ${err instanceof Error ? err.message : 'Error'}`);
            toast.error('Error al importar propiedades');
        } finally {
            setIsImporting(false);
        }
    };

    const handleExportJSON = () => {
        const data = properties.filter((_, i) => selected.size === 0 || selected.has(i));
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const href = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = href;
        a.download = `scraped_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(href);
    };

    const formatPrice = (prop: ScrapedProperty) => {
        if (!prop.price || prop.currency === 'consultar') return 'Consultar';
        return `${prop.currency} ${prop.price.toLocaleString('es-AR')}`;
    };

    const formatFeatures = (prop: ScrapedProperty) => {
        const parts: string[] = [];
        if (prop.is_monoambiente) parts.push('Mono');
        else if (prop.ambientes) parts.push(`${prop.ambientes} amb.`);
        if (prop.bedrooms !== null && prop.bedrooms > 0) parts.push(`${prop.bedrooms} dorm.`);
        if (prop.bathrooms !== null && prop.bathrooms > 0) parts.push(`${prop.bathrooms} baños`);
        return parts.join(' · ') || '-';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white tracking-tight mb-1 flex items-center gap-3">
                    <Globe className="w-8 h-8 text-emerald-400" />
                    Scraping de Propiedades
                </h1>
                <p className="text-slate-400 text-sm">
                    Extraé propiedades de inmobiliarias externas para importar a tu web.
                </p>
            </div>

            {/* Configuration */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 backdrop-blur-sm"
            >
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Configuración</h2>

                {/* Preset URLs */}
                <div className="flex flex-wrap gap-2 mb-3">
                    {PRESET_URLS.map((preset) => (
                        <button
                            key={preset.url}
                            onClick={() => setUrl(preset.url)}
                            className={`text-xs px-3 py-1.5 rounded-full border transition-all ${url === preset.url
                                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                                : 'bg-slate-700/30 border-slate-600/30 text-slate-400 hover:text-white hover:border-slate-500'
                                }`}
                        >
                            {preset.name}
                        </button>
                    ))}
                </div>

                {/* URL + Max pages + Action button */}
                <div className="flex gap-3 items-end">
                    <div className="flex-1">
                        <input
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://..."
                            className="w-full bg-slate-900/60 border border-slate-600/40 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 transition-all"
                            disabled={isScrapingActive}
                        />
                    </div>
                    <div className="w-24">
                        <label className="text-[10px] text-slate-500 mb-0.5 block">Págs.</label>
                        <input
                            type="number"
                            value={maxPages}
                            onChange={(e) => setMaxPages(parseInt(e.target.value) || 1)}
                            min={1}
                            max={50}
                            className="w-full bg-slate-900/60 border border-slate-600/40 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/60 transition-all"
                            disabled={isScrapingActive}
                        />
                    </div>
                    {/* FIX for insertBefore: using a single stable button with dynamic content instead of conditional rendering */}
                    <button
                        onClick={isScrapingActive ? handleStop : handleScrape}
                        disabled={!isScrapingActive && !url}
                        className={`flex items-center gap-2 px-5 py-2.5 text-white text-sm font-semibold rounded-xl transition-all shrink-0 ${isScrapingActive
                            ? 'bg-red-600 hover:bg-red-500'
                            : 'bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 shadow-lg shadow-emerald-500/20'
                            }`}
                    >
                        {isScrapingActive ? (
                            <>
                                <Square className="w-4 h-4" />
                                Detener
                            </>
                        ) : (
                            <>
                                <Play className="w-4 h-4" />
                                Scraping
                            </>
                        )}
                    </button>
                </div>

                {/* Progress bar */}
                {isScrapingActive && progress.total > 0 && (
                    <div className="mt-3">
                        <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                            <span>Scrapeando propiedades...</span>
                            <span>{progress.current}/{progress.total}</span>
                        </div>
                        <div className="w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${(progress.current / progress.total) * 100}%` }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>
                    </div>
                )}
            </motion.div>

            {/* Log panel - collapsible */}
            {logs.length > 0 && (
                <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl overflow-hidden">
                    <button
                        onClick={() => setShowLogs(!showLogs)}
                        className="w-full flex items-center justify-between px-4 py-2 text-xs text-slate-400 hover:bg-slate-800/30 transition-colors"
                    >
                        <span className="flex items-center gap-2">
                            <Loader2 className={`w-3 h-3 animate-spin text-emerald-400 ${isScrapingActive ? '' : 'hidden'}`} />
                            Log ({logs.length})
                        </span>
                        <Eye className={`w-3.5 h-3.5 ${showLogs ? 'hidden' : ''}`} />
                        <EyeOff className={`w-3.5 h-3.5 ${showLogs ? '' : 'hidden'}`} />
                    </button>
                    {showLogs && (
                        <div className="max-h-48 overflow-y-auto px-4 pb-3 space-y-0.5 font-mono text-[11px] border-t border-slate-700/30">
                            {logs.map((log, i) => (
                                <div key={i} className={`flex gap-2 ${log.type === 'error' ? 'text-red-400' : log.type === 'warning' ? 'text-amber-400' : log.type === 'property' ? 'text-emerald-400' : log.type === 'info' ? 'text-blue-400' : 'text-slate-500'}`}>
                                    <span className="text-slate-600 shrink-0">{log.timestamp}</span>
                                    <span className="truncate">{log.message}</span>
                                </div>
                            ))}
                            <div ref={logEndRef} />
                        </div>
                    )}
                </div>
            )}

            {/* Results Table */}
            {properties.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                    {/* Toolbar */}
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                            <h2 className="text-sm font-semibold text-white">
                                Resultados <span className="text-slate-400 font-normal">({properties.length})</span>
                            </h2>
                            {/* Filter toggle */}
                            <div className="flex gap-1">
                                <button onClick={() => setResultFilter('all')}
                                    className={`flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-lg transition-all border ${resultFilter === 'all' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-slate-700/30 border-slate-600/30 text-slate-400 hover:text-white'}`}>
                                    <Filter className="w-3 h-3" /> Todas
                                </button>
                                <button onClick={() => setResultFilter('new')}
                                    className={`flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-lg transition-all border ${resultFilter === 'new' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-700/30 border-slate-600/30 text-slate-400 hover:text-white'}`}>
                                    <CheckCircle2 className="w-3 h-3" /> Nuevas
                                </button>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleSelectAll} className="flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-lg bg-slate-700/50 text-slate-300 hover:text-white hover:bg-slate-700 transition-all border border-slate-600/30">
                                <Check className={`w-3 h-3 ${selected.size === properties.length ? 'hidden' : ''}`} />
                                <X className={`w-3 h-3 ${selected.size === properties.length ? '' : 'hidden'}`} />
                                {selected.size === properties.length ? 'Ninguno' : 'Todos'}
                            </button>
                            <button onClick={handleExportJSON} className="flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-lg bg-slate-700/50 text-slate-300 hover:text-white hover:bg-slate-700 transition-all border border-slate-600/30">
                                <Download className="w-3 h-3" />
                                JSON
                            </button>
                            <button onClick={handleImport} disabled={selected.size === 0 || isImporting} className="flex items-center gap-1 px-4 py-1.5 text-[11px] rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-all disabled:opacity-40 font-semibold shadow-lg shadow-emerald-500/10">
                                <ArrowUpFromLine className={`w-3 h-3 ${isImporting ? 'hidden' : ''}`} />
                                <Loader2 className={`w-3 h-3 animate-spin ${isImporting ? '' : 'hidden'}`} />
                                Importar seleccionadas {selected.size > 0 ? `(${selected.size})` : ''}
                            </button>
                        </div>
                    </div>

                    {/* Import result */}
                    {importResult && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className={`p-3 rounded-lg border text-xs ${importResult.errors === 0 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'}`}>
                            <div className="flex items-center gap-1.5 font-semibold mb-1">
                                <CheckCircle2 className={`w-4 h-4 ${importResult.errors === 0 ? '' : 'hidden'}`} />
                                <AlertCircle className={`w-4 h-4 ${importResult.errors === 0 ? 'hidden' : ''}`} />
                                {importResult.imported} importadas, {importResult.errors} errores
                            </div>
                        </motion.div>
                    )}

                    {/* Compact Table */}
                    <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl overflow-hidden">
                        {/* Table header */}
                        <div className="grid grid-cols-[36px_52px_1fr_110px_100px_80px_60px_50px_36px] gap-0 items-center px-3 py-2 bg-slate-800/80 border-b border-slate-700/40 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                            <div className="flex justify-center">
                                <button
                                    onClick={handleSelectAll}
                                    className={`w-4.5 h-4.5 rounded flex items-center justify-center transition-all ${selected.size === properties.length ? 'bg-emerald-500 text-white' : 'bg-slate-700/50 text-slate-500 hover:bg-slate-600'}`}
                                >
                                    {selected.size === properties.length && <Check className="w-3 h-3" />}
                                </button>
                            </div>
                            <div></div>
                            <div>Nombre</div>
                            <div>Precio</div>
                            <div>Detalles</div>
                            <div>Ciudad</div>
                            <div className="text-center">m²</div>
                            <div className="text-center">📷</div>
                            <div></div>
                        </div>

                        {/* Table rows */}
                        <div className="max-h-[60vh] overflow-y-auto divide-y divide-slate-700/20">
                            {properties.map((prop, idx) => (
                                <div key={idx}>
                                    {/* Main row */}
                                    <div
                                        className={`grid grid-cols-[36px_52px_1fr_110px_100px_80px_60px_50px_36px] gap-0 items-center px-3 py-1.5 text-xs transition-colors cursor-pointer group ${selected.has(idx) ? 'bg-emerald-500/5' : 'hover:bg-slate-700/20'}`}
                                        onClick={() => setExpandedRow(expandedRow === idx ? null : idx)}
                                    >
                                        {/* Checkbox */}
                                        <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={() => toggleSelect(idx)}
                                                className={`w-4.5 h-4.5 rounded flex items-center justify-center transition-all ${selected.has(idx) ? 'bg-emerald-500 text-white' : 'bg-slate-700/40 text-transparent hover:bg-slate-600 hover:text-slate-400'}`}
                                            >
                                                <Check className="w-3 h-3" />
                                            </button>
                                        </div>

                                        {/* Thumbnail */}
                                        <div className="pr-1">
                                            {prop.images.length > 0 ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={prop.images[0]}
                                                    alt=""
                                                    className="w-9 h-9 object-cover rounded-lg"
                                                    onError={(e) => { (e.target as HTMLImageElement).src = ''; (e.target as HTMLImageElement).className = 'w-9 h-9 rounded-lg bg-slate-700'; }}
                                                />
                                            ) : (
                                                <div className="w-9 h-9 rounded-lg bg-slate-700/50 flex items-center justify-center">
                                                    <ImageIcon className="w-3.5 h-3.5 text-slate-600" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Name + address */}
                                        <div className="min-w-0 pr-2">
                                            <div className="flex items-center gap-1.5">
                                                <p className="text-white font-medium truncate text-[12px] leading-tight">
                                                    {prop.title || prop.source_slug}
                                                </p>
                                                {prop.is_monoambiente && (
                                                    <span className="text-[9px] px-1 py-0.5 rounded bg-violet-500/20 text-violet-300 shrink-0">MONO</span>
                                                )}
                                            </div>
                                            <p className="text-slate-500 truncate text-[10px]">
                                                {prop.address || prop.property_type || ''}
                                            </p>
                                        </div>

                                        {/* Price */}
                                        <div>
                                            <span className={`text-[11px] font-semibold ${prop.price ? 'text-emerald-400' : 'text-amber-400'}`}>
                                                {formatPrice(prop)}
                                            </span>
                                            {prop.operation_type && (
                                                <span className={`ml-1 text-[9px] px-1 py-0.5 rounded ${prop.operation_type === 'venta' ? 'bg-blue-500/15 text-blue-400' : 'bg-purple-500/15 text-purple-400'}`}>
                                                    {prop.operation_type === 'alquiler_temporal' ? 'temp.' : prop.operation_type}
                                                </span>
                                            )}
                                        </div>

                                        {/* Features summary */}
                                        <div className="text-slate-400 text-[10px] truncate">
                                            {formatFeatures(prop)}
                                        </div>

                                        {/* City */}
                                        <div className="text-slate-400 truncate text-[10px]">
                                            {prop.city || '-'}
                                        </div>

                                        {/* m² */}
                                        <div className="text-center text-slate-400 text-[10px]">
                                            {prop.square_meters || prop.square_meters_covered || '-'}
                                        </div>

                                        {/* Images count */}
                                        <div className="text-center">
                                            <span className={`text-[10px] ${prop.images.length > 0 ? 'text-emerald-400' : 'text-slate-600'}`}>
                                                {prop.images.length}
                                            </span>
                                        </div>

                                        {/* Expand chevron */}
                                        <div className="flex justify-center">
                                            <ChevronDown className={`w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 ${expandedRow === idx ? 'hidden' : ''}`} />
                                            <ChevronUp className={`w-3.5 h-3.5 text-slate-400 ${expandedRow === idx ? '' : 'hidden'}`} />
                                        </div>
                                    </div>

                                    {/* Expanded detail */}
                                    <AnimatePresence>
                                        {expandedRow === idx && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden bg-slate-800/30 border-t border-slate-700/20"
                                            >
                                                <div className="px-6 py-4 space-y-3">
                                                    {/* Info grid */}
                                                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3 text-xs">
                                                        <div>
                                                            <span className="text-slate-500 block text-[10px]">Tipo</span>
                                                            <span className="text-slate-300">{prop.property_type || '-'}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-500 block text-[10px]">Ambientes</span>
                                                            <span className="text-slate-300">{prop.ambientes ?? '-'}{prop.is_monoambiente ? ' (Mono)' : ''}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-500 block text-[10px]">Dormitorios</span>
                                                            <span className="text-slate-300">{prop.bedrooms ?? '-'}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-500 block text-[10px]">Baños</span>
                                                            <span className="text-slate-300">{prop.bathrooms ?? '-'}{prop.toilets ? ` + ${prop.toilets} toilet` : ''}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-500 block text-[10px]">m² Total</span>
                                                            <span className="text-slate-300">{prop.square_meters ?? '-'}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-500 block text-[10px]">m² Cubiertos</span>
                                                            <span className="text-slate-300">{prop.square_meters_covered ?? '-'}</span>
                                                        </div>
                                                    </div>

                                                    {/* Description */}
                                                    {prop.description && (
                                                        <p className="text-slate-400 text-xs line-clamp-3 leading-relaxed">{prop.description}</p>
                                                    )}

                                                    {/* Amenities */}
                                                    {prop.amenities.length > 0 && (
                                                        <div className="flex flex-wrap gap-1">
                                                            {prop.amenities.slice(0, 10).map((a, i) => (
                                                                <span key={i} className="bg-slate-700/40 text-slate-400 px-1.5 py-0.5 rounded text-[10px]">{a}</span>
                                                            ))}
                                                            {prop.amenities.length > 10 && <span className="text-slate-500 text-[10px] self-center">+{prop.amenities.length - 10}</span>}
                                                        </div>
                                                    )}

                                                    {/* Image gallery */}
                                                    {prop.images.length > 0 && (
                                                        <div className="flex gap-1.5 overflow-x-auto py-1">
                                                            {prop.images.slice(0, 12).map((img, i) => (
                                                                // eslint-disable-next-line @next/next/no-img-element
                                                                <img
                                                                    key={i}
                                                                    src={img}
                                                                    alt={`${i + 1}`}
                                                                    className="w-14 h-14 object-cover rounded-lg shrink-0 border border-slate-700/30"
                                                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                                />
                                                            ))}
                                                            {prop.images.length > 12 && (
                                                                <div className="w-14 h-14 rounded-lg bg-slate-700/50 flex items-center justify-center shrink-0 text-slate-400 text-[11px]">
                                                                    +{prop.images.length - 12}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Source link */}
                                                    <a href={prop.source_url} target="_blank" rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 transition-colors">
                                                        <ExternalLink className="w-3 h-3" />
                                                        Ver en sitio original
                                                    </a>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Empty state */}
            {!isScrapingActive && properties.length === 0 && logs.length === 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-800/60 flex items-center justify-center mb-3">
                        <RefreshCw className="w-8 h-8 text-slate-600" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-400 mb-1">Listo para empezar</h3>
                    <p className="text-sm text-slate-500 max-w-md">
                        Pegá la URL de un listado de propiedades y presioná &quot;Scraping&quot; para extraer toda la información y fotos.
                    </p>
                </motion.div>
            )}
        </div>
    );
}
