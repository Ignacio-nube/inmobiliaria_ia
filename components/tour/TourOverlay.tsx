"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTour, TOUR_STEPS } from "./TourProvider";
import { TourTooltip } from "./TourTooltip";

export function TourOverlay() {
    const { currentStep, isActive } = useTour();
    const step = TOUR_STEPS[currentStep];

    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
    const targetRef = useRef<HTMLElement | null>(null);

    // Track the window size
    useEffect(() => {
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Scroll into view safely ONCE when the step changes
    useEffect(() => {
        if (!isActive || !step.targetId) return;
        const el = document.getElementById(step.targetId);
        if (el) {
            targetRef.current = el;
            const rect = el.getBoundingClientRect();
            const isInView = (
                rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                rect.right <= (window.innerWidth || document.documentElement.clientWidth)
            );
            if (!isInView) {
                // Smooth scroll to element only if not in viewport
                el.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        } else {
            targetRef.current = null;
        }
    }, [currentStep, isActive, step.targetId]);

    // Use requestAnimationFrame to constantly sync the spotlight with the element's actual layout box
    // This perfectly handes layout changes, scrolling, and Framer Motion entrances.
    useEffect(() => {
        if (!isActive || !step.targetId) return;

        let animationFrameId: number;

        const updateRect = () => {
            // Fallback if targetRef somehow unmounts
            if (!targetRef.current) {
                targetRef.current = document.getElementById(step.targetId!);
            }

            if (targetRef.current) {
                // Get viewport-relative coordinates
                const rect = targetRef.current.getBoundingClientRect();

                // Only update React state if the rect changes by more than 0.5px
                setTargetRect((prev) => {
                    if (!prev) return rect;
                    if (
                        Math.abs(prev.x - rect.x) > 0.5 ||
                        Math.abs(prev.y - rect.y) > 0.5 ||
                        Math.abs(prev.width - rect.width) > 0.5 ||
                        Math.abs(prev.height - rect.height) > 0.5
                    ) {
                        return rect;
                    }
                    return prev;
                });
            } else {
                setTargetRect(null);
            }

            animationFrameId = requestAnimationFrame(updateRect);
        };

        animationFrameId = requestAnimationFrame(updateRect);
        return () => cancelAnimationFrame(animationFrameId);
    }, [isActive, step.targetId]);

    if (!isActive) return null;

    const padding = 16;
    const radius = 16;

    return (
        <div className="fixed inset-0 z-[100] w-screen h-screen pointer-events-none">
            <svg
                className="absolute inset-0 w-full h-full pointer-events-none text-white"
            >
                <defs>
                    <mask id="spotlight-mask">
                        <rect x="0" y="0" width="100%" height="100%" fill="white" />
                        {targetRect && (
                            <motion.rect
                                // SVG Base coordinates MUST be 0 if we are animating 'x' and 'y' via Framer Motion
                                // because Framer Motion applies animate={{x}} as a CSS transform (translateX).
                                // Doing x={targetRect.left} AND animate={{x: targetRect.left}} doubles the position!
                                x={0}
                                y={0}
                                width={targetRect.width + padding * 2}
                                height={targetRect.height + padding * 2}
                                rx={radius}
                                fill="black"
                                initial={false}
                                animate={{
                                    x: targetRect.left - padding,
                                    y: targetRect.top - padding,
                                    width: targetRect.width + padding * 2,
                                    height: targetRect.height + padding * 2,
                                }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                        )}
                    </mask>
                </defs>

                <motion.rect
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.7 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    x="0"
                    y="0"
                    width="100%"
                    height="100%"
                    fill="black"
                    mask="url(#spotlight-mask)"
                    // Trap clicks on the overlay (the SVG rect), but not on the hole
                    className="pointer-events-auto"
                />
            </svg>

            <AnimatePresence mode="wait">
                {targetRect && (
                    <TourTooltip key={currentStep} step={step} targetRect={targetRect} windowSize={windowSize} />
                )}
            </AnimatePresence>
        </div>
    );
}
