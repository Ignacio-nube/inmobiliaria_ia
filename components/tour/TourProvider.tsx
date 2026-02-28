"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { TourOverlay } from "./TourOverlay";

// Define the steps of our tour
export const TOUR_STEPS = [
    {
        id: "ai-search-home",
        title: "Buscador Inteligente IA",
        description: "Encontrá lo que buscás usando lenguaje natural. Nuestra IA analizará tus palabras y aplicará los filtros correctos.",
        targetId: "tour-search-bar",
    },
    {
        id: "publish-property-cta",
        title: "Publicar Propiedad",
        description: "¿Tenés una propiedad para alquilar o vender? Publicala en nuestra plataforma fácilmente.",
        targetId: "tour-publish-property",
    }
];

interface TourContextType {
    currentStep: number;
    isActive: boolean;
    nextStep: () => void;
    prevStep: () => void;
    skipTour: () => void;
    completeTour: () => void;
    startTour: () => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export function useTour() {
    const context = useContext(TourContext);
    if (!context) {
        throw new Error("useTour must be used within a TourProvider");
    }
    return context;
}

interface TourProviderProps {
    children: ReactNode;
}

export function TourProvider({ children }: TourProviderProps) {
    const [isActive, setIsActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [isMounted, setIsMounted] = useState(false);

    const pathname = usePathname();

    useEffect(() => {
        setIsMounted(true);
        // Check if tour was already completed
        const isCompleted = localStorage.getItem("tour_completed");

        // Auto-start ONLY if not completed AND we are on the main home page
        const isHomePage = pathname === '/';

        if (isCompleted !== "true" && isHomePage) {
            // Small delay to ensure UI is ready
            const timer = setTimeout(() => {
                setIsActive(true);
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [pathname]);

    const completeTour = useCallback(() => {
        setIsActive(false);
        localStorage.setItem("tour_completed", "true");
    }, []);

    const skipTour = useCallback(() => {
        completeTour();
    }, [completeTour]);

    const nextStep = useCallback(() => {
        setCurrentStep((prev) => {
            if (prev >= TOUR_STEPS.length - 1) {
                completeTour();
                return prev;
            }
            return prev + 1;
        });
    }, [completeTour]);

    const prevStep = useCallback(() => {
        setCurrentStep((prev) => Math.max(0, prev - 1));
    }, []);

    const startTour = useCallback(() => {
        setCurrentStep(0);
        setIsActive(true);
    }, []);

    return (
        <TourContext.Provider
            value={{
                currentStep,
                isActive,
                nextStep,
                prevStep,
                skipTour,
                completeTour,
                startTour,
            }}
        >
            {children}

            {/* Render overlay ONLY when active and mounted */}
            {isMounted && isActive && <TourOverlay />}
        </TourContext.Provider>
    );
}
