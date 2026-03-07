"use client";

import { useState, useMemo, useEffect, useCallback, useTransition } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { PropertyCard } from '@/components/ui/PropertyCard';
import { Database } from '@/lib/database.types';
import {
    Search, SlidersHorizontal, Sparkles, X, ChevronDown, ChevronUp,
    Building2, Wallet, Bed, Bath, Car, MapPin, Ruler, Tag, Loader2,
    ChevronLeft, ChevronRight, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useTypingPlaceholder } from '@/hooks/useTypingPlaceholder';

// Typing placeholders for AI Search
const SEARCH_PLACEHOLDERS = [
    "Casa con pileta cerca del cerro...",
    "Departamento en el Centro...",
    "Terreno en Yerba Buena...",
    "Local comercial en Yerba Buena...",
    "Casa 3 dormitorios en Barrio Sur..."
];

type Property = Database['public']['Tables']['properties']['Row'];

interface PropertiesClientProps {
    initialProperties: Property[];
    initialTotal: number;
    initialRelaxed: boolean;
    initialRelaxedMessage?: string;
    cardStyle: string;
}

// Primary filter chips data
const OPERATION_OPTIONS = [
    { value: 'all', label: 'Todas' },
    { value: 'venta', label: 'Venta' },
    { value: 'alquiler', label: 'Alquiler' },
    { value: 'alquiler_temporal', label: 'Temporal' },
];
const TYPE_OPTIONS = [
    { value: 'all', label: 'Tipo' },
    { value: 'Casa', label: 'Casa' },
    { value: 'Departamento', label: 'Depto' },
    { value: 'Terreno', label: 'Terreno' },
    { value: 'Local', label: 'Local' },
    { value: 'Oficina', label: 'Oficina' },
    { value: 'Duplex', label: 'Duplex' },
];
const BEDROOMS_OPTIONS = [
    { value: 'any', label: 'Dorm.' },
    { value: '1', label: '1+' },
    { value: '2', label: '2+' },
    { value: '3', label: '3+' },
    { value: '4', label: '4+' },
];

const AMENITIES_LIST = [
    "pileta", "quincho", "parrilla", "seguridad", "ascensor", "jardin",
    "cochera_cubierta", "vestidor", "deposito", "vidriera", "alta_visibilidad",
    "vista_panoramica", "servicios_completos", "lavadero", "terraza", "calefaccion"
];

const PAGE_SIZE = 20;

export function PropertiesClient({
    initialProperties,
    initialTotal,
    initialRelaxed,
    initialRelaxedMessage,
    cardStyle
}: PropertiesClientProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    // ── State derived from URL params ──
    const operationType = searchParams.get('operacion') || 'all';
    const propertyType = searchParams.get('tipo') || 'all';
    const minBedrooms = searchParams.get('dormitorios') || 'any';
    const city = searchParams.get('ciudad') || '';
    const neighborhood = searchParams.get('barrio') || '';
    const minBathrooms = searchParams.get('banos') || 'any';
    const minGarage = searchParams.get('cocheras') || 'any';
    const minArea = searchParams.get('supMin') || '';
    const maxArea = searchParams.get('supMax') || '';
    const condition = searchParams.get('estado') || 'all';
    const precioMin = searchParams.get('precioMin') || '';
    const precioMax = searchParams.get('precioMax') || '';
    const moneda = searchParams.get('moneda') || '';
    const amenitiesParam = searchParams.get('amenities') || '';
    const selectedAmenities = amenitiesParam ? amenitiesParam.split(',').filter(Boolean) : [];
    const searchTerm = searchParams.get('q') || '';
    const currentPage = parseInt(searchParams.get('page') || '1');

    // ── Properties data from server ──
    const [properties, setProperties] = useState<Property[]>(initialProperties);
    const [total, setTotal] = useState(initialTotal);
    const [relaxed, setRelaxed] = useState(initialRelaxed);
    const [relaxedMessage, setRelaxedMessage] = useState(initialRelaxedMessage);
    const [isLoading, setIsLoading] = useState(false);

    // ── AI Search state ──
    const [aiQuery, setAiQuery] = useState('');
    const [isAiSearching, setIsAiSearching] = useState(false);

    // Advanced filters panel
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Typing Placeholder Hook
    const { placeholder } = useTypingPlaceholder(SEARCH_PLACEHOLDERS);

    // Track mount state for SSR safe Portals
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    // ── Helper: update URL params ──
    const updateParams = useCallback((updates: Record<string, string>) => {
        const params = new URLSearchParams(searchParams.toString());

        // Apply updates
        for (const [key, value] of Object.entries(updates)) {
            if (value === '' || value === 'all' || value === 'any') {
                params.delete(key);
            } else {
                params.set(key, value);
            }
        }

        // Always reset to page 1 when filters change (unless page itself is being set)
        if (!('page' in updates)) {
            params.delete('page');
        }

        const queryString = params.toString();
        const newUrl = queryString ? `${pathname}?${queryString}` : pathname;

        startTransition(() => {
            router.push(newUrl, { scroll: false });
        });
    }, [searchParams, pathname, router]);

    // ── Fetch from API when URL params change ──
    const paramsString = searchParams.toString();

    useEffect(() => {
        // Skip fetch on initial mount — we already have SSR data
        const isInitialMount = properties === initialProperties && paramsString === '';
        if (isInitialMount && initialProperties.length > 0) return;

        const fetchProperties = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`/api/properties?${paramsString}`);
                const data = await res.json();
                setProperties(data.data || []);
                setTotal(data.total || 0);
                setRelaxed(data.relaxed || false);
                setRelaxedMessage(data.relaxedMessage);
            } catch (error) {
                console.error('Failed to fetch properties:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProperties();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paramsString]);

    // ── Count active filters ──
    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (operationType !== 'all') count++;
        if (propertyType !== 'all') count++;
        if (minBedrooms !== 'any') count++;
        if (city) count++;
        if (neighborhood) count++;
        if (minBathrooms !== 'any') count++;
        if (minGarage !== 'any') count++;
        if (minArea) count++;
        if (maxArea) count++;
        if (condition !== 'all') count++;
        if (selectedAmenities.length > 0) count++;
        if (precioMin) count++;
        if (precioMax) count++;
        if (moneda) count++;
        if (searchTerm) count++;
        return count;
    }, [operationType, propertyType, minBedrooms, city, neighborhood, minBathrooms, minGarage, minArea, maxArea, condition, selectedAmenities, precioMin, precioMax, moneda, searchTerm]);

    // ── AI Search handler ──
    const handleAiSearch = useCallback(async () => {
        if (!aiQuery.trim()) return;
        setIsAiSearching(true);

        try {
            const res = await fetch('/api/ai-search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: aiQuery }),
            });
            const data = await res.json();

            // Build URL params from AI response
            const params: Record<string, string> = {};

            if (data.searchTerm) params.q = data.searchTerm;
            if (data.propertyType && data.propertyType !== 'all') params.tipo = data.propertyType;
            if (data.operationType && data.operationType !== 'all') params.operacion = data.operationType;
            if (data.minBedrooms && data.minBedrooms !== 'any') params.dormitorios = data.minBedrooms;
            if (data.minBathrooms && data.minBathrooms !== 'any') params.banos = data.minBathrooms;
            if (data.minGarage && data.minGarage !== 'any') params.cocheras = data.minGarage;
            if (data.minArea) params.supMin = data.minArea;
            if (data.maxArea) params.supMax = data.maxArea;
            if (data.condition && data.condition !== 'all') params.estado = data.condition;
            if (data.city) params.ciudad = data.city;
            if (data.neighborhood) params.barrio = data.neighborhood;
            if (data.precioMin !== null && data.precioMin !== undefined) params.precioMin = String(data.precioMin);
            if (data.precioMax !== null && data.precioMax !== undefined) params.precioMax = String(data.precioMax);
            if (data.moneda) params.moneda = data.moneda;
            if (data.amenities && Array.isArray(data.amenities) && data.amenities.length > 0) {
                params.amenities = data.amenities.join(',');
            }

            // Replace all URL params with AI-extracted ones
            const newParams = new URLSearchParams();
            for (const [key, value] of Object.entries(params)) {
                newParams.set(key, value);
            }
            const queryString = newParams.toString();
            const newUrl = queryString ? `${pathname}?${queryString}` : pathname;

            startTransition(() => {
                router.push(newUrl, { scroll: false });
            });
        } catch {
            // Fallback: just use the text as search term
            updateParams({ q: aiQuery });
        } finally {
            setIsAiSearching(false);
        }
    }, [aiQuery, pathname, router, updateParams]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAiSearch();
        }
    };

    // ── Clear all ──
    const clearAll = () => {
        setAiQuery('');
        startTransition(() => {
            router.push(pathname, { scroll: false });
        });
    };

    // ── Pagination ──
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    const goToPage = (page: number) => {
        if (page < 1 || page > totalPages) return;
        updateParams({ page: String(page) });
        // Scroll to top of results
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // ── Amenity toggle ──
    const toggleAmenity = (amenity: string) => {
        const current = [...selectedAmenities];
        const idx = current.indexOf(amenity);
        if (idx >= 0) {
            current.splice(idx, 1);
        } else {
            current.push(amenity);
        }
        updateParams({ amenities: current.join(',') });
    };

    // ── Loading overlay ──
    const showLoading = isLoading || isPending;

    return (
        <div className="relative pb-28">
            {/* Header Bar */}
            <div className="flex flex-col gap-4 mb-6">
                {/* Primary Filter Chips */}
                <div className="flex flex-wrap gap-2 items-center">
                    <FilterChipGroup
                        value={operationType}
                        onChange={(v) => updateParams({ operacion: v })}
                        options={OPERATION_OPTIONS}
                        icon={<Tag className="w-3.5 h-3.5" />}
                    />
                    <span className="w-px h-6 bg-border hidden sm:block" />
                    <FilterChipGroup
                        value={propertyType}
                        onChange={(v) => updateParams({ tipo: v })}
                        options={TYPE_OPTIONS}
                        icon={<Building2 className="w-3.5 h-3.5" />}
                    />
                    <span className="w-px h-6 bg-border hidden sm:block" />
                    <FilterChipGroup
                        value={minBedrooms}
                        onChange={(v) => updateParams({ dormitorios: v })}
                        options={BEDROOMS_OPTIONS}
                        icon={<Bed className="w-3.5 h-3.5" />}
                    />
                </div>

                {/* Secondary controls row */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${showAdvanced ? 'bg-brand/10 text-brand' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                }`}
                        >
                            <SlidersHorizontal className="w-4 h-4" />
                            Más filtros
                            {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>

                        {activeFilterCount > 0 && (
                            <button
                                onClick={clearAll}
                                className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                                <X className="w-3.5 h-3.5" />
                                Limpiar ({activeFilterCount})
                            </button>
                        )}
                    </div>

                    <p className="text-sm text-muted-foreground">
                        {showLoading ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Buscando...
                            </span>
                        ) : (
                            <>
                                <span className="font-bold text-foreground">{total}</span> propiedades
                            </>
                        )}
                    </p>
                </div>
            </div>

            {/* Advanced Filters Panel */}
            <AnimatePresence>
                {showAdvanced && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden mb-6"
                    >
                        <div className="bg-card border border-border rounded-2xl p-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {/* City */}
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                                    <Building2 className="w-3 h-3" /> Ciudad
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ej: Yerba Buena"
                                    value={city}
                                    onChange={e => updateParams({ ciudad: e.target.value })}
                                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand outline-none"
                                />
                            </div>

                            {/* Neighborhood */}
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                                    <MapPin className="w-3 h-3" /> Barrio
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ej: Centro"
                                    value={neighborhood}
                                    onChange={e => updateParams({ barrio: e.target.value })}
                                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand outline-none"
                                />
                            </div>

                            {/* Bathrooms */}
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                                    <Bath className="w-3 h-3" /> Baños mín.
                                </label>
                                <select
                                    value={minBathrooms}
                                    onChange={e => updateParams({ banos: e.target.value })}
                                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand outline-none"
                                >
                                    <option value="any">Cualquiera</option>
                                    <option value="1">1+</option>
                                    <option value="2">2+</option>
                                    <option value="3">3+</option>
                                </select>
                            </div>

                            {/* Garage */}
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                                    <Car className="w-3 h-3" /> Cocheras
                                </label>
                                <select
                                    value={minGarage}
                                    onChange={e => updateParams({ cocheras: e.target.value })}
                                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand outline-none"
                                >
                                    <option value="any">Cualquiera</option>
                                    <option value="1">1+</option>
                                    <option value="2">2+</option>
                                </select>
                            </div>

                            {/* Area Range */}
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                                    <Ruler className="w-3 h-3" /> m² mín
                                </label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={minArea}
                                    onChange={e => updateParams({ supMin: e.target.value })}
                                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                                    <Ruler className="w-3 h-3" /> m² máx
                                </label>
                                <input
                                    type="number"
                                    placeholder="∞"
                                    value={maxArea}
                                    onChange={e => updateParams({ supMax: e.target.value })}
                                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand outline-none"
                                />
                            </div>

                            {/* Price Range */}
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                                    <Wallet className="w-3 h-3" /> Precio mín
                                </label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={precioMin}
                                    onChange={e => updateParams({ precioMin: e.target.value })}
                                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                                    <Wallet className="w-3 h-3" /> Precio máx
                                </label>
                                <input
                                    type="number"
                                    placeholder="∞"
                                    value={precioMax}
                                    onChange={e => updateParams({ precioMax: e.target.value })}
                                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                                    <Wallet className="w-3 h-3" /> Moneda
                                </label>
                                <select
                                    value={moneda}
                                    onChange={e => updateParams({ moneda: e.target.value })}
                                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand outline-none"
                                >
                                    <option value="">Todas</option>
                                    <option value="USD">USD</option>
                                    <option value="ARS">ARS</option>
                                </select>
                            </div>

                            {/* Condition */}
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Estado</label>
                                <select
                                    value={condition}
                                    onChange={e => updateParams({ estado: e.target.value })}
                                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand outline-none"
                                >
                                    <option value="all">Cualquiera</option>
                                    <option value="nuevo">A Estrenar</option>
                                    <option value="bueno">Buen Estado</option>
                                    <option value="a_refaccionar">A Refaccionar</option>
                                </select>
                            </div>

                            {/* Amenities */}
                            <div className="col-span-full">
                                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Amenidades</label>
                                <div className="flex flex-wrap gap-2">
                                    {AMENITIES_LIST.map(a => (
                                        <button
                                            key={a}
                                            onClick={() => toggleAmenity(a)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedAmenities.includes(a)
                                                ? 'bg-brand/10 text-brand'
                                                : 'bg-muted text-muted-foreground hover:text-foreground'
                                                }`}
                                        >
                                            {a.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Relaxed Results Banner */}
            <AnimatePresence>
                {relaxed && relaxedMessage && !showLoading && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mb-6 flex items-center gap-3 px-5 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm text-amber-200"
                    >
                        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        {relaxedMessage}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Property Grid */}
            <div className={`transition-opacity duration-200 ${showLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                {properties.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {properties.map((property, index) => (
                            <PropertyCard
                                key={property.id}
                                property={property}
                                cardStyle={cardStyle}
                                index={index}
                            />
                        ))}
                    </div>
                ) : !showLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-muted/30 rounded-3xl border border-dashed border-border text-center">
                        <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center shadow-sm mb-4">
                            <Search className="w-8 h-8 text-muted-foreground p-1" />
                        </div>
                        <h3 className="text-xl font-heading font-medium mb-2 text-foreground">No encontramos propiedades</h3>
                        <p className="text-muted-foreground max-w-md">No hay resultados que coincidan con tu búsqueda. Intentá cambiar los filtros o los términos de búsqueda.</p>
                        <button onClick={clearAll} className="mt-4 text-brand font-medium text-sm hover:underline">
                            Limpiar todos los filtros
                        </button>
                    </div>
                ) : null}
            </div>

            {/* Pagination */}
            {totalPages > 1 && !showLoading && (
                <div className="flex items-center justify-center gap-2 mt-10">
                    <button
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage <= 1}
                        className="p-2 rounded-xl border border-border hover:bg-muted transition-colors disabled:opacity-30 disabled:pointer-events-none"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page => {
                            // Show first, last, and pages around current
                            if (page === 1 || page === totalPages) return true;
                            if (Math.abs(page - currentPage) <= 2) return true;
                            return false;
                        })
                        .reduce<(number | 'dots')[]>((acc, page, idx, arr) => {
                            if (idx > 0 && page - (arr[idx - 1] as number) > 1) {
                                acc.push('dots');
                            }
                            acc.push(page);
                            return acc;
                        }, [])
                        .map((item, idx) => (
                            item === 'dots' ? (
                                <span key={`dots-${idx}`} className="px-2 text-muted-foreground">…</span>
                            ) : (
                                <button
                                    key={item}
                                    onClick={() => goToPage(item as number)}
                                    className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${currentPage === item
                                        ? 'bg-brand text-white shadow-lg shadow-brand/20'
                                        : 'border border-border hover:bg-muted text-foreground'
                                        }`}
                                >
                                    {item}
                                </button>
                            )
                        ))
                    }

                    <button
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        className="p-2 rounded-xl border border-border hover:bg-muted transition-colors disabled:opacity-30 disabled:pointer-events-none"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Sticky AI Search Bar at Bottom */}
            {mounted && typeof document !== 'undefined' && createPortal(
                <div className="fixed bottom-6 w-full z-50 pointer-events-none flex justify-center px-4" style={{ left: 0 }}>
                    <motion.div
                        id="tour-ai-search-fixed"
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1, type: "spring", stiffness: 400, damping: 25 }}
                        className="w-full max-w-3xl pointer-events-auto shadow-[0_8px_40px_rgba(0,0,0,0.12)] rounded-full bg-background/80 backdrop-blur-2xl border border-border/50 p-2 flex items-center gap-3 transition-all hover:shadow-[0_8px_50px_rgba(0,0,0,0.16)] hover:border-brand/30 group"
                    >
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-brand/10 text-brand flex-shrink-0 group-hover:scale-105 transition-transform">
                            <Sparkles className="w-5 h-5" />
                        </div>

                        {/* Animated Typing Placeholder */}
                        <div className="relative flex-1 overflow-hidden flex items-center h-[24px]">
                            <input
                                type="text"
                                value={aiQuery}
                                onChange={e => setAiQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={isAiSearching}
                                className="absolute inset-0 w-full h-full bg-transparent text-base outline-none text-foreground placeholder-transparent z-10"
                            />
                            {/* Fake placeholder underneath */}
                            {!aiQuery && (
                                <span className="absolute left-0 pointer-events-none text-muted-foreground text-base">
                                    {placeholder}
                                </span>
                            )}
                        </div>

                        {aiQuery && !isAiSearching && (
                            <button
                                onClick={() => { setAiQuery(''); clearAll(); }}
                                className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            onClick={handleAiSearch}
                            disabled={isAiSearching || !aiQuery.trim()}
                            className="flex items-center justify-center w-10 h-10 rounded-full bg-foreground text-background disabled:opacity-30 hover:scale-105 active:scale-95 transition-all flex-shrink-0"
                        >
                            {isAiSearching ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Search className="w-5 h-5" />
                            )}
                        </button>
                    </motion.div>
                </div>,
                document.body
            )}
        </div>
    );
}

// Filter Chip Group component
function FilterChipGroup({ value, onChange, options, icon }: {
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
    icon: React.ReactNode;
}) {
    const activeOption = options.find(o => o.value === value);
    const isDefault = value === options[0]?.value;

    return (
        <div className="relative group inline-flex">
            <button className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all peer ${!isDefault ? 'bg-brand/10 text-brand' : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}>
                {icon}
                {activeOption?.label || options[0]?.label}
                <ChevronDown className="w-3 h-3 ml-0.5 opacity-60" />
            </button>
            <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-xl shadow-xl py-1 min-w-[140px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                {options.map(opt => (
                    <button
                        key={opt.value}
                        onClick={() => onChange(opt.value)}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${value === opt.value
                            ? 'text-brand bg-brand/5 font-medium'
                            : 'text-foreground hover:bg-muted'
                            }`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
