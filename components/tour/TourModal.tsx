import React, { useState } from "react";
import { motion } from "framer-motion";
import { useTour, TOUR_STEPS } from "./TourProvider";
import { Sparkles, Home, MousePointerClick } from "lucide-react";

export function TourModal() {
    const { nextStep, skipTour } = useTour();
    const step = TOUR_STEPS[0];

    return (
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0, transition: { duration: 0.2 } }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="bg-white text-black rounded-3xl p-8 max-w-md w-full shadow-[0_20px_60px_rgba(0,0,0,0.5)] relative overflow-hidden text-center z-[110] pointer-events-auto"
        >
            {/* Decorative background elements */}
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-gold/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-brand/10 rounded-full blur-3xl" />

            <div className="relative z-10">
                <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-6 text-brand">
                    <Sparkles className="w-8 h-8" />
                </div>

                <h2 className="text-2xl md:text-3xl font-bold font-heading mb-4 text-balance">
                    {step.title}
                </h2>

                <p className="text-black/70 text-base md:text-lg mb-8 leading-relaxed">
                    {step.description}
                </p>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={nextStep}
                        className="w-full bg-brand text-white py-4 rounded-xl font-bold text-lg hover:bg-brand/90 transition-all shadow-lg hover:shadow-brand/30 active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        <MousePointerClick className="w-5 h-5" /> Empezar tour
                    </button>

                    <button
                        onClick={skipTour}
                        className="w-full py-3 rounded-xl font-medium text-black/50 hover:text-black hover:bg-black/5 transition-all text-sm"
                    >
                        Saltar tour, ya conozco el sitio
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
