"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function TrackPageView({ propertyId }: { propertyId?: string }) {
    const pathname = usePathname();
    const tracked = useRef<string>("");

    useEffect(() => {
        // Avoid duplicate tracking for same page
        const trackKey = `${pathname}-${propertyId || "none"}`;
        if (tracked.current === trackKey) return;
        tracked.current = trackKey;

        const track = async () => {
            try {
                await fetch("/api/track", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        page_path: pathname,
                        property_id: propertyId || null,
                        referrer: document.referrer || null,
                    }),
                });
            } catch {
                // Silent fail — don't break the page
            }
        };

        // Delay slightly so it doesn't block rendering
        const timer = setTimeout(track, 500);
        return () => clearTimeout(timer);
    }, [pathname, propertyId]);

    return null;
}
