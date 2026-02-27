"use client";

import { useState, useEffect } from "react";

/**
 * Cycles through an array of placeholder strings with a fade/visible toggle.
 * Returns the current placeholder text and a boolean `visible` flag for fading.
 */
export function useTypingPlaceholder(
    placeholders: string[],
    intervalMs = 3000
): { placeholder: string; visible: boolean } {
    const [index, setIndex] = useState(0);
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        if (placeholders.length <= 1) return;

        const timer = setInterval(() => {
            // Fade out
            setVisible(false);

            // After fade-out completes, switch text and fade in
            setTimeout(() => {
                setIndex((prev) => (prev + 1) % placeholders.length);
                setVisible(true);
            }, 400); // must match CSS transition duration
        }, intervalMs);

        return () => clearInterval(timer);
    }, [placeholders.length, intervalMs]);

    return { placeholder: placeholders[index], visible };
}
