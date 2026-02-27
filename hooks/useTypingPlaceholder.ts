"use client";

import { useState, useEffect } from "react";

/**
 * Cycles through an array of placeholder strings with a typewriter effect.
 * Returns the current partial string being typed.
 */
export function useTypingPlaceholder(
    placeholders: string[],
    typingSpeed = 50,
    deletingSpeed = 30,
    delayBetweenWords = 2000
): { placeholder: string; visible: boolean } {
    const [index, setIndex] = useState(0);
    const [subIndex, setSubIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const [blink, setBlink] = useState(true);

    // Blinking cursor effect
    useEffect(() => {
        const cursorInterval = setInterval(() => {
            setBlink((prev) => !prev);
        }, 530);
        return () => clearInterval(cursorInterval);
    }, []);

    useEffect(() => {
        if (placeholders.length === 0) return;

        const currentWord = placeholders[index];

        if (!isDeleting && subIndex === currentWord.length) {
            // Wait before starting to delete
            const timeout = setTimeout(() => setIsDeleting(true), delayBetweenWords);
            return () => clearTimeout(timeout);
        }

        if (isDeleting && subIndex === 0) {
            // Move to next word when fully deleted
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsDeleting(false);
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIndex((prev) => (prev + 1) % placeholders.length);
            return;
        }

        const timeout = setTimeout(() => {
            setSubIndex((prev) => prev + (isDeleting ? -1 : 1));
        }, isDeleting ? deletingSpeed : typingSpeed);

        return () => clearTimeout(timeout);
    }, [subIndex, index, isDeleting, placeholders, typingSpeed, deletingSpeed, delayBetweenWords]);

    // Add blink cursor to the end
    const textAndCursor = placeholders[index].substring(0, subIndex) + (blink ? "|" : "");

    return { placeholder: textAndCursor, visible: true };
}
