"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Images } from "lucide-react";

interface PropertyGalleryProps {
    images: string[];
    title: string;
}

export function PropertyGallery({ images, title }: PropertyGalleryProps) {
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    const openLightbox = (index: number) => {
        setCurrentIndex(index);
        setLightboxOpen(true);
    };

    if (!images || images.length === 0) {
        return (
            <div className="w-full h-[500px] bg-muted rounded-3xl flex items-center justify-center border border-dashed border-border text-muted-foreground">
                Sin imágenes disponibles
            </div>
        );
    }

    const mainImage = images[0];
    const thumbImages = images.slice(1, 5);
    const extraCount = images.length - 5;

    return (
        <div className="mb-12">
            {/* Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2 h-[500px]">
                {/* Main Image — 60% */}
                <div
                    className="md:col-span-3 relative rounded-2xl overflow-hidden cursor-pointer group h-full"
                    onClick={() => openLightbox(0)}
                >
                    <Image
                        src={mainImage}
                        alt={title}
                        fill
                        className="object-cover transition-all duration-300 group-hover:brightness-[0.85]"
                        priority
                        sizes="(max-width: 768px) 100vw, 60vw"
                    />
                </div>

                {/* Thumbnails — 40% */}
                <div className="hidden md:grid md:col-span-2 grid-cols-2 grid-rows-2 gap-2 h-full">
                    {thumbImages.map((img, idx) => {
                        const isLast = idx === thumbImages.length - 1 && extraCount > 0;
                        return (
                            <div
                                key={idx}
                                className="relative rounded-2xl overflow-hidden cursor-pointer group"
                                onClick={() => openLightbox(idx + 1)}
                            >
                                <Image
                                    src={img}
                                    alt={`${title} - Vista ${idx + 2}`}
                                    fill
                                    className="object-cover transition-all duration-300 group-hover:brightness-[0.85]"
                                    sizes="(max-width: 768px) 50vw, 20vw"
                                />
                                {isLast && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center pointer-events-none">
                                        <span className="text-white text-xl font-semibold">
                                            +{extraCount} fotos
                                        </span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {/* Fill empty slots if < 4 thumbnails */}
                    {thumbImages.length < 4 &&
                        Array.from({ length: 4 - thumbImages.length }).map((_, i) => (
                            <div
                                key={`empty-${i}`}
                                className="relative rounded-2xl overflow-hidden bg-muted flex items-center justify-center border border-border"
                            >
                                <Images className="w-8 h-8 text-muted-foreground/40" />
                            </div>
                        ))
                    }
                </div>
            </div>

            {/* "Ver todas las fotos" button */}
            {images.length > 1 && (
                <button
                    onClick={() => openLightbox(0)}
                    className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-card border border-border rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                    <Images className="w-4 h-4" />
                    Ver todas las fotos ({images.length})
                </button>
            )}

            {/* Lightbox — rendered via portal to avoid transform context issues */}
            {lightboxOpen && createPortal(
                <AnimatePresence>
                    <Lightbox
                        images={images}
                        title={title}
                        currentIndex={currentIndex}
                        onClose={() => setLightboxOpen(false)}
                        onChangeIndex={setCurrentIndex}
                    />
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}

/* ─── Lightbox ─────────────────────────────────────────── */

interface LightboxProps {
    images: string[];
    title: string;
    currentIndex: number;
    onClose: () => void;
    onChangeIndex: (i: number) => void;
}

function Lightbox({ images, title, currentIndex, onClose, onChangeIndex }: LightboxProps) {
    const touchStartX = useRef<number | null>(null);
    const thumbStripRef = useRef<HTMLDivElement>(null);

    const goNext = useCallback(() => {
        onChangeIndex(currentIndex < images.length - 1 ? currentIndex + 1 : 0);
    }, [currentIndex, images.length, onChangeIndex]);

    const goPrev = useCallback(() => {
        onChangeIndex(currentIndex > 0 ? currentIndex - 1 : images.length - 1);
    }, [currentIndex, images.length, onChangeIndex]);

    // Keyboard navigation
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "ArrowRight") goNext();
            else if (e.key === "ArrowLeft") goPrev();
            else if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [goNext, goPrev, onClose]);

    // Lock body scroll
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "";
        };
    }, []);

    // Scroll active thumbnail into view
    useEffect(() => {
        if (thumbStripRef.current) {
            const activeThumb = thumbStripRef.current.children[currentIndex] as HTMLElement | undefined;
            activeThumb?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
        }
    }, [currentIndex]);

    // Touch handlers
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    };
    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX.current === null) return;
        const diff = touchStartX.current - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) {
            diff > 0 ? goNext() : goPrev();
        }
        touchStartX.current = null;
    };

    return (
        <motion.div
            className="fixed inset-0 z-[9999] bg-black/95 flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
        >
            {/* Top bar */}
            <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" onClick={e => e.stopPropagation()}>
                <div />
                <span className="text-white/80 text-sm font-medium tabular-nums">
                    {currentIndex + 1} / {images.length}
                </span>
                <button
                    onClick={onClose}
                    className="text-white/70 hover:text-white transition-colors p-1"
                    aria-label="Cerrar"
                >
                    <X className="w-7 h-7" />
                </button>
            </div>

            {/* Main image area */}
            <div
                className="flex-1 flex items-center justify-center relative px-16 min-h-0"
                onClick={e => e.stopPropagation()}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                {/* Left arrow */}
                <button
                    onClick={goPrev}
                    className="absolute left-4 md:left-8 z-10 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors backdrop-blur-sm"
                    aria-label="Anterior"
                >
                    <ChevronLeft className="w-7 h-7" />
                </button>

                {/* Image */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        className="flex items-center justify-center w-full h-full"
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.2 }}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={images[currentIndex]}
                            alt={`${title} - Foto ${currentIndex + 1}`}
                            className="max-h-[70vh] max-w-full object-contain rounded-lg"
                        />
                    </motion.div>
                </AnimatePresence>

                {/* Right arrow */}
                <button
                    onClick={goNext}
                    className="absolute right-4 md:right-8 z-10 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors backdrop-blur-sm"
                    aria-label="Siguiente"
                >
                    <ChevronRight className="w-7 h-7" />
                </button>
            </div>

            {/* Thumbnail strip */}
            <div
                className="flex-shrink-0 px-4 py-4"
                onClick={e => e.stopPropagation()}
            >
                <div
                    ref={thumbStripRef}
                    className="flex gap-2 overflow-x-auto justify-center pb-2 scrollbar-thin scrollbar-thumb-white/20"
                >
                    {images.map((img, idx) => (
                        <button
                            key={idx}
                            onClick={() => onChangeIndex(idx)}
                            className={`relative flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden transition-all ${idx === currentIndex
                                ? "ring-2 ring-brand ring-offset-2 ring-offset-black brightness-100"
                                : "brightness-50 hover:brightness-75"
                                }`}
                        >
                            <Image
                                src={img}
                                alt={`Miniatura ${idx + 1}`}
                                fill
                                className="object-cover"
                                sizes="80px"
                            />
                        </button>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
