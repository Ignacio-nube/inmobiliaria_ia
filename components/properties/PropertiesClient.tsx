"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { PropertyCard } from '@/components/ui/PropertyCard';
import { Database } from '@/lib/database.types';
import {
    Search, SlidersHorizontal, Sparkles, X, ChevronDown, ChevronUp,
    Building2, Wallet, Bed, Bath, Car, MapPin, Ruler, Tag, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useTypingPlaceholder } from '@/hooks/useTypingPlaceholder';
import Fuse from 'fuse.js';

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
const PRICE_OPTIONS = [
    { value: 'all', label: 'Precio' },
    { value: 'under50k', label: '< USD 50k' },
    { value: '50k-100k', label: '50k - 100k' },
    { value: '100k-250k', label: '100k - 250k' },
    { value: 'over250k', label: '> USD 250k' },
];
const BEDROOMS_OPTIONS = [
    { value: 'any', label: 'Dorm.' },
    { value: '1', label: '1+' },
    { value: '2', label: '2+' },
    { value: '3', label: '3+' },
    { value: '4', label: '4+' },
];

export function PropertiesClient({ initialProperties, cardStyle }: PropertiesClientProps) {
    const searchParams = useSearchParams();

    // Primary filters
    const [operationType, setOperationType] = useState(searchParams.get('op') || 'all');
    const [propertyType, setPropertyType] = useState(searchParams.get('type') || 'all');
    const [priceRange, setPriceRange] = useState(searchParams.get('price') || 'all');
    const [minBedrooms, setMinBedrooms] = useState(searchParams.get('beds') || 'any');

    // Advanced filters
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [city, setCity] = useState('');
    const [neighborhood, setNeighborhood] = useState('');
    const [minBathrooms, setMinBathrooms] = useState('any');
    const [minGarage, setMinGarage] = useState('any');
    const [minArea, setMinArea] = useState('');
    const [maxArea, setMaxArea] = useState('');
    const [condition, setCondition] = useState('all');
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

    // AI Search
    const [aiQuery, setAiQuery] = useState('');
    const [aiSearchTerm, setAiSearchTerm] = useState('');
    const [isAiSearching, setIsAiSearching] = useState(false);

    // Typing Placeholder Hook
    const { placeholder } = useTypingPlaceholder(SEARCH_PLACEHOLDERS);

    // Track mount state for SSR safe Portals
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    // Gather unique neighborhoods
    const neighborhoods = useMemo(() => {
        const set = new Set<string>();
        initialProperties.forEach(p => { if (p.neighborhood) set.add(p.neighborhood); });
        return Array.from(set).sort();
    }, [initialProperties]);

    // Gather unique cities
    const cities = useMemo(() => {
        const set = new Set<string>();
        initialProperties.forEach(p => { if (p.city) set.add(p.city); });
        return Array.from(set).sort();
    }, [initialProperties]);

    // Gather unique amenities
    const allAmenities = useMemo(() => {
        const set = new Set<string>();
        initialProperties.forEach(p => { p.amenities?.forEach(a => set.add(a)); });
        return Array.from(set).sort();
    }, [initialProperties]);

    // Count active filters
    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (operationType !== 'all') count++;
        if (propertyType !== 'all') count++;
        if (priceRange !== 'all') count++;
        if (minBedrooms !== 'any') count++;
        if (city) count++;
        if (neighborhood) count++;
        if (minBathrooms !== 'any') count++;
        if (minGarage !== 'any') count++;
        if (minArea) count++;
        if (maxArea) count++;
        if (condition !== 'all') count++;
        if (selectedAmenities.length > 0) count++;
        if (aiSearchTerm) count++;
        return count;
    }, [operationType, propertyType, priceRange, minBedrooms, city, neighborhood, minBathrooms, minGarage, minArea, maxArea, condition, selectedAmenities, aiSearchTerm]);

    // AI Search handler
    const handleAiSearch = useCallback(async () => {
        if (!aiQuery.trim()) return;
        setIsAiSearching(true);

        // Reset old filters before applying new ones to avoid stacking
        setAiSearchTerm('');
        setPropertyType('all');
        setMinBedrooms('any');
        setPriceRange('all');
        setOperationType('all');
        setCity('');
        setNeighborhood('');
        setMinBathrooms('any');
        setMinGarage('any');
        setMinArea('');
        setMaxArea('');
        setCondition('all');
        setSelectedAmenities([]);

        try {
            const res = await fetch('/api/ai-search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: aiQuery }),
            });
            const data = await res.json();

            // Apply AI-parsed filters
            if (data.searchTerm) setAiSearchTerm(data.searchTerm);
            if (data.propertyType && data.propertyType !== 'all') setPropertyType(data.propertyType);
            if (data.minBedrooms && data.minBedrooms !== 'any') setMinBedrooms(data.minBedrooms);
            if (data.minBathrooms && data.minBathrooms !== 'any') setMinBathrooms(data.minBathrooms);
            if (data.minGarage && data.minGarage !== 'any') setMinGarage(data.minGarage);
            if (data.minArea) setMinArea(data.minArea);
            if (data.maxArea) setMaxArea(data.maxArea);
            if (data.condition && data.condition !== 'all') setCondition(data.condition);
            if (data.amenities && Array.isArray(data.amenities)) {
                // Filter only valid amenities that exist in allAmenities to prevent garbage UI
                const validAmenities = data.amenities.filter((a: string) => allAmenities.includes(a));
                if (validAmenities.length > 0) setSelectedAmenities(validAmenities);
            }
            if (data.priceRange && data.priceRange !== 'all') setPriceRange(data.priceRange);
            if (data.operationType && data.operationType !== 'all') setOperationType(data.operationType);
            if (data.city) setCity(data.city);
            if (data.neighborhood) setNeighborhood(data.neighborhood);

            // Log search
            logSearch(aiQuery, data);
        } catch {
            // Fallback: just use the text as search term
            setAiSearchTerm(aiQuery);
        } finally {
            setIsAiSearching(false);
        }
    }, [aiQuery]);

    const logSearch = async (query: string, filters: any) => {
        try {
            // TODO: implement when search_logs insert is ready via API
        } catch { }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAiSearch();
        }
    };

    // Clear all
    const clearAll = () => {
        setOperationType('all');
        setPropertyType('all');
        setPriceRange('all');
        setMinBedrooms('any');
        setCity('');
        setNeighborhood('');
        setMinBathrooms('any');
        setMinGarage('any');
        setMinArea('');
        setMaxArea('');
        setCondition('all');
        setSelectedAmenities([]);
        setAiQuery('');
        setAiSearchTerm('');
    };

    // Filter properties
    const filteredProperties = useMemo(() => {
        // Prepare fuse instance early for text search
        let matchedIds = new Set<string>();

        if (aiSearchTerm) {
            const fuse = new Fuse(initialProperties, {
                keys: [
                    { name: 'title', weight: 2 },
                    { name: 'description', weight: 1 },
                    { name: 'neighborhood', weight: 1.5 },
                    { name: 'address', weight: 1.5 },
                    { name: 'city', weight: 1.2 },
                    { name: 'amenities', weight: 1 }
                ],
                threshold: 0.3, // Allow a moderate amount of typos (fuzzy search)
                ignoreLocation: true,
                useExtendedSearch: true
            });

            const results = fuse.search(aiSearchTerm);
            matchedIds = new Set(results.map(r => r.item.id));
        }

        return initialProperties.filter(property => {
            // Text search
            if (aiSearchTerm && !matchedIds.has(property.id)) {
                return false;
            }

            // Operation
            if (operationType !== 'all' && property.operation_type !== operationType) return false;

            // Type
            if (propertyType !== 'all' && property.property_type !== propertyType) return false;

            // Price
            if (priceRange !== 'all') {
                const p = property.price;
                if (priceRange === 'under50k' && p >= 50000) return false;
                if (priceRange === '50k-100k' && (p < 50000 || p > 100000)) return false;
                if (priceRange === '100k-250k' && (p < 100000 || p > 250000)) return false;
                if (priceRange === 'over250k' && p <= 250000) return false;
            }

            // Bedrooms
            if (minBedrooms !== 'any' && (property.bedrooms === null || property.bedrooms < parseInt(minBedrooms))) return false;

            // City
            if (city && property.city !== city) return false;

            // Neighborhood
            if (neighborhood && property.neighborhood !== neighborhood) return false;

            // Bathrooms
            if (minBathrooms !== 'any' && (property.bathrooms === null || property.bathrooms < parseInt(minBathrooms))) return false;

            // Garage
            if (minGarage !== 'any' && (property.garage === null || property.garage < parseInt(minGarage))) return false;

            // Area
            if (minArea && (property.square_meters === null || property.square_meters < parseInt(minArea))) return false;
            if (maxArea && (property.square_meters === null || property.square_meters > parseInt(maxArea))) return false;

            // Condition
            if (condition !== 'all' && property.condition !== condition) return false;

            // Amenities
            if (selectedAmenities.length > 0) {
                const propAmenities = property.amenities || [];
                if (!selectedAmenities.every(a => propAmenities.includes(a))) return false;
            }

            return true;
        });
    }, [initialProperties, aiSearchTerm, operationType, propertyType, priceRange, minBedrooms, city, neighborhood, minBathrooms, minGarage, minArea, maxArea, condition, selectedAmenities]);

    const toggleAmenity = (amenity: string) => {
        setSelectedAmenities(prev =>
            prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
        );
    };

    return (
        <div className="relative pb-28">
            {/* Header Bar */}
            <div className="flex flex-col gap-4 mb-6">
                {/* Primary Filter Chips */}
                <div className="flex flex-wrap gap-2 items-center">
                    <FilterChipGroup value={operationType} onChange={setOperationType} options={OPERATION_OPTIONS} icon={<Tag className="w-3.5 h-3.5" />} />
                    <span className="w-px h-6 bg-border hidden sm:block" />
                    <FilterChipGroup value={propertyType} onChange={setPropertyType} options={TYPE_OPTIONS} icon={<Building2 className="w-3.5 h-3.5" />} />
                    <span className="w-px h-6 bg-border hidden sm:block" />
                    <FilterChipGroup value={priceRange} onChange={setPriceRange} options={PRICE_OPTIONS} icon={<Wallet className="w-3.5 h-3.5" />} />
                    <span className="w-px h-6 bg-border hidden sm:block" />
                    <FilterChipGroup value={minBedrooms} onChange={setMinBedrooms} options={BEDROOMS_OPTIONS} icon={<Bed className="w-3.5 h-3.5" />} />
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
                        <span className="font-bold text-foreground">{filteredProperties.length}</span> propiedades
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
                                <select
                                    value={city}
                                    onChange={e => setCity(e.target.value)}
                                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand outline-none"
                                >
                                    <option value="">Todas</option>
                                    {cities.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>

                            {/* Neighborhood */}
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                                    <MapPin className="w-3 h-3" /> Barrio
                                </label>
                                <select
                                    value={neighborhood}
                                    onChange={e => setNeighborhood(e.target.value)}
                                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand outline-none"
                                >
                                    <option value="">Todos</option>
                                    {neighborhoods.map(n => <option key={n} value={n}>{n}</option>)}
                                </select>
                            </div>

                            {/* Bathrooms */}
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                                    <Bath className="w-3 h-3" /> Baños mín.
                                </label>
                                <select
                                    value={minBathrooms}
                                    onChange={e => setMinBathrooms(e.target.value)}
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
                                    onChange={e => setMinGarage(e.target.value)}
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
                                    onChange={e => setMinArea(e.target.value)}
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
                                    onChange={e => setMaxArea(e.target.value)}
                                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand outline-none"
                                />
                            </div>

                            {/* Condition */}
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Estado</label>
                                <select
                                    value={condition}
                                    onChange={e => setCondition(e.target.value)}
                                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand outline-none"
                                >
                                    <option value="all">Cualquiera</option>
                                    <option value="nuevo">A Estrenar</option>
                                    <option value="bueno">Buen Estado</option>
                                    <option value="a_refaccionar">A Refaccionar</option>
                                </select>
                            </div>

                            {/* Amenities */}
                            {allAmenities.length > 0 && (
                                <div className="col-span-full">
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Amenidades</label>
                                    <div className="flex flex-wrap gap-2">
                                        {allAmenities.map(a => (
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
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Property Grid */}
            {filteredProperties.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredProperties.map((property, index) => (
                        <PropertyCard
                            key={property.id}
                            property={property}
                            cardStyle={cardStyle}
                            index={index}
                        />
                    ))}
                </div>
            ) : (
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
            )}

            {/* Sticky AI Search Bar at Bottom (Claude / ChatGPT Premium Style) */}
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
                                onClick={() => { setAiQuery(''); setAiSearchTerm(''); }}
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
