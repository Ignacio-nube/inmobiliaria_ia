"use client";

/**
 * DynamicTheme
 *
 * Injects two things:
 * 1. CSS variables at :root level (colors, --font-heading var)
 * 2. A direct .font-heading class override — this bypasses Tailwind v4's
 *    @theme layer which has higher cascade priority than :root variable
 *    overrides for font-family utilities.
 */
export function DynamicTheme({ cssVars, fontHeadingFamily }: { cssVars: string; fontHeadingFamily: string }) {
    const css = [
        `:root { ${cssVars} }`,
        // Override the Tailwind utility class directly so the font actually changes
        `.font-heading { font-family: ${fontHeadingFamily} !important; }`,
    ].join('\n');

    return (
        <style
            id="dynamic-theme"
            dangerouslySetInnerHTML={{ __html: css }}
        />
    );
}
