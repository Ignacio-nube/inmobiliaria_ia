"use client";

import { motion, useScroll, useTransform } from "framer-motion";

export function ScrollProgress() {
    const { scrollYProgress } = useScroll();
    const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

    return (
        <motion.div
            style={{ scaleX }}
            className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand via-gold to-brand origin-left z-[60]"
        />
    );
}
