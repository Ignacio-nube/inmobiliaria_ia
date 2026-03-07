"use client";

import { Toaster } from "sonner";

export function ToastProvider() {
    return (
        <Toaster
            position="bottom-right"
            toastOptions={{
                duration: 4000,
                style: {
                    background: "rgba(15, 23, 42, 0.95)",
                    border: "1px solid rgba(51, 65, 85, 0.5)",
                    color: "#e2e8f0",
                    backdropFilter: "blur(12px)",
                    borderRadius: "16px",
                    fontSize: "13px",
                    padding: "14px 18px",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
                },
                classNames: {
                    success: "!border-emerald-500/30",
                    error: "!border-red-500/30",
                    warning: "!border-amber-500/30",
                    info: "!border-blue-500/30",
                },
            }}
            richColors
            closeButton
        />
    );
}
