"use client";

import { useRef } from "react";
import { useScroll, useTransform } from "framer-motion";
import type { MotionValue } from "framer-motion";

/**
 * Returns a parallax `y` MotionValue for a hero section element.
 * The background drifts downward as the user scrolls, creating depth.
 *
 * @param speed  How many pixels to drift per 1px of scroll (default 0.4)
 */
export function useParallax(speed = 0.4): {
    ref: React.RefObject<HTMLElement>;
    backgroundY: MotionValue<string>;
    opacity: MotionValue<number>;
} {
    const ref = useRef<HTMLElement>(null);
    const { scrollY } = useScroll();

    // Drift the BG image 40% as fast as the scroll → parallax depth effect
    const backgroundY = useTransform(
        scrollY,
        [0, 600],
        ["0%", `${speed * 100}%`]
    );

    // Fade out the hero content gently as user scrolls
    const opacity = useTransform(scrollY, [0, 400], [1, 0]);

    return { ref: ref as React.RefObject<HTMLElement>, backgroundY, opacity };
}
