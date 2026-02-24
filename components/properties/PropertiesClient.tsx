"use client";

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { PropertyCard } from '@/components/ui/PropertyCard';
import { Database } from '@/lib/database.types';
import { Search, SlidersHorizontal, MapPin, Building2, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';

type Property = Database['public']['Tables']['properties']['Row'];

interface PropertiesClientProps {
    initialProperties: Property[];
    cardStyle: string;
}

export function PropertiesClient({ initialProperties, cardStyle }: PropertiesClientProps) {
    const searchParams = useSearchParams();

    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
    const [propertyType, setPropertyType] = useState(searchParams.get('type') || 'all');
    const [minBedrooms, setMinBedrooms] = useState(searchParams.get('beds') || 'any');
    const [priceRange, setPriceRange] = useState(searchParams.get('price') || 'all');

    // Re-sync if URL changes (like when using back/forward buttons)
    useEffect(() => {
        setSearchTerm(searchParams.get('q') || '');
        setPropertyType(searchParams.get('type') || 'all');
        setMinBedrooms(searchParams.get('beds') || 'any');
        setPriceRange(searchParams.get('price') || 'all');
    }, [searchParams]);

    // Filter properties based on state
    const filteredProperties = useMemo(() => {
        return initialProperties.filter(property => {
            const matchSearch = searchTerm === '' ||
                property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                property.location.toLowerCase().includes(searchTerm.toLowerCase());

            const matchType = propertyType === 'all' || property.property_type === propertyType;

            const matchBedrooms = minBedrooms === 'any' ||
                (property.bedrooms !== null && property.bedrooms >= parseInt(minBedrooms));

            let matchPrice = true;
            if (priceRange !== 'all') {
                const p = property.price;
                if (priceRange === 'under100k') matchPrice = p < 100000;
                else if (priceRange === '100k-250k') matchPrice = p >= 100000 && p <= 250000;
                else if (priceRange === 'over250k') matchPrice = p > 250000;
            }

            return matchSearch && matchType && matchBedrooms && matchPrice;
        });
    }, [initialProperties, searchTerm, propertyType, minBedrooms, priceRange]);

    return (
        <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Filters */}
            <aside className="w-full lg:w-1/4 flex-shrink-0">
                <div className="bg-card border border-border rounded-3xl p-6 sticky top-28 shadow-sm">
                    <div className="flex items-center gap-2 mb-6 text-foreground font-semibold text-lg pb-4 border-b border-border">
                        <SlidersHorizontal className="w-5 h-5" />
                        Filtros
                    </div>

                    <div className="space-y-6">
                        {/* Search Input */}
                        <div>
                            <label className="text-sm font-medium text-muted-foreground mb-2 block flexitems-center gap-2">
                                <Search className="w-4 h-4 inline-block mr-1" /> Buscar
                            </label>
                            <input
                                type="text"
                                placeholder="Ej: Yerba Buena, Pileta..."
                                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand outline-none transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Property Type */}
                        <div>
                            <label className="text-sm font-medium text-muted-foreground mb-2 block flexitems-center gap-2">
                                <Building2 className="w-4 h-4 inline-block mr-1" /> Tipo de Propiedad
                            </label>
                            <select
                                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand outline-none transition-all cursor-pointer"
                                value={propertyType}
                                onChange={(e) => setPropertyType(e.target.value)}
                            >
                                <option value="all">Todas</option>
                                <option value="Casa">Casa</option>
                                <option value="Departamento">Departamento</option>
                                <option value="Terreno">Terreno</option>
                                <option value="Local">Local</option>
                                <option value="Oficina">Oficina</option>
                            </select>
                        </div>

                        {/* Price Range */}
                        <div>
                            <label className="text-sm font-medium text-muted-foreground mb-2 block flexitems-center gap-2">
                                <Wallet className="w-4 h-4 inline-block mr-1" /> Rango de Precio
                            </label>
                            <select
                                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand outline-none transition-all cursor-pointer"
                                value={priceRange}
                                onChange={(e) => setPriceRange(e.target.value)}
                            >
                                <option value="all">Cualquiera</option>
                                <option value="under100k">Menos de $100.000</option>
                                <option value="100k-250k">$100.000 a $250.000</option>
                                <option value="over250k">Más de $250.000</option>
                            </select>
                        </div>

                        {/* Bedrooms */}
                        <div>
                            <label className="text-sm font-medium text-muted-foreground mb-2 block">Habitaciones mínimas</label>
                            <div className="flex gap-2">
                                {['any', '1', '2', '3', '4'].map(num => (
                                    <button
                                        key={num}
                                        onClick={() => setMinBedrooms(num)}
                                        className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${minBedrooms === num ? 'bg-brand text-white border-brand' : 'bg-background border-border text-foreground hover:bg-muted'
                                            }`}
                                    >
                                        {num === 'any' ? 'Cualquiera' : `${num}+`}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {(searchTerm || propertyType !== 'all' || minBedrooms !== 'any' || priceRange !== 'all') && (
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setPropertyType('all');
                                    setMinBedrooms('any');
                                    setPriceRange('all');
                                }}
                                className="w-full py-3 text-sm text-brand font-medium hover:bg-brand/5 rounded-xl transition-colors"
                            >
                                Limpiar Filtros
                            </button>
                        )}

                    </div>
                </div>
            </aside>

            {/* Property Grid */}
            <main className="flex-1">
                <div className="mb-6 flex justify-between items-center bg-card border border-border rounded-xl px-4 py-3">
                    <p className="font-medium text-muted-foreground">
                        Buscando <span className="text-foreground font-bold">{filteredProperties.length}</span> propiedades
                    </p>
                </div>

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
                    </div>
                )}
            </main>
        </div>
    );
}
