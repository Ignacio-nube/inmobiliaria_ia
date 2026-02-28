import React from "react";
import { motion } from "framer-motion";
import { useTour, TOUR_STEPS } from "./TourProvider";

interface TourTooltipProps {
    step: typeof TOUR_STEPS[0];
    targetRect: DOMRect;
    windowSize: { width: number; height: number };
}

export function TourTooltip({ step, targetRect, windowSize }: TourTooltipProps) {
    const { nextStep, skipTour, currentStep } = useTour();
    const isLastStep = currentStep === TOUR_STEPS.length - 1;

    const padding = 24;
    const tooltipWidth = 320;

    let left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
    if (left < 16) left = 16;
    if (left + tooltipWidth > windowSize.width - 16) left = windowSize.width - tooltipWidth - 16;

    let top = targetRect.bottom + padding;
    const tooltipEstimatedHeight = 220;

    // If placing it below the target overflows the visible screen
    if (top + tooltipEstimatedHeight > windowSize.height - padding) {
        // Try placing it above the target
        const topAbove = targetRect.top - padding - tooltipEstimatedHeight;
        if (topAbove >= padding) {
            top = topAbove;
        } else {
            // Target takes up the whole screen or there's no space above/below.
            // Vertically clamp it to the window viewport so it NEVER gets cut off.
            top = Math.max(padding, Math.min(top, windowSize.height - tooltipEstimatedHeight - padding));
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: 20, y: 0 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: -20, y: 0 }}
            transition={{ duration: 0.3, type: "spring", damping: 20 }}
            style={{
                position: "absolute",
                top,
                left,
                width: tooltipWidth,
            }}
            className="bg-white text-black p-5 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-[110] relative overflow-hidden pointer-events-auto"
        >
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-gold/20 rounded-full blur-2xl pointer-events-none" />

            <div className="flex justify-between items-center mb-2 relative z-10">
                <span className="text-xs font-bold text-black/50 tracking-wider uppercase">
                    Paso {currentStep + 1} de {TOUR_STEPS.length}
                </span>
                <button
                    onClick={skipTour}
                    className="text-xs text-black/40 hover:text-black transition-colors"
                >
                    Saltar tour
                </button>
            </div>

            <h3 className="text-lg font-bold font-heading mb-2 relative z-10">{step.title}</h3>
            <p className="text-sm text-black/70 mb-5 leading-relaxed relative z-10">
                {step.description}
            </p>

            <div className="flex justify-end relative z-10">
                <button
                    onClick={nextStep}
                    className="bg-black text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-gold hover:text-black transition-all shadow-md active:scale-95"
                >
                    {isLastStep ? "Finalizar" : "Siguiente →"}
                </button>
            </div>
        </motion.div>
    );
}
