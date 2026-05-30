import type { TenantConfig, ThemeTokens } from "@lab/contracts";
import { hexToHsl, hslToHex, readableForeground, withLightness } from "./color";

export type ThemeMode = "light" | "dark";

/**
 * Derive a cohesive dark palette from a tenant's light brand tokens. The
 * canvas/panel hues are pulled from the brand primary so dark mode still feels
 * on-brand, while text/lines are tuned for AA contrast.
 */
export function deriveDarkTokens(tokens: ThemeTokens): ThemeTokens {
  const primary = hexToHsl(tokens.colorPrimary);
  const h = primary.h;

  const darkPrimary = hslToHex({
    h,
    s: Math.max(primary.s, 48),
    l: Math.max(primary.l, 62)
  });

  return {
    ...tokens,
    colorPrimary: darkPrimary,
    colorPrimaryForeground: readableForeground(darkPrimary),
    colorAccentSurface: hslToHex({ h, s: Math.min(primary.s, 42), l: 20 }),
    colorCanvas: hslToHex({ h, s: 16, l: 8 }),
    colorPanel: hslToHex({ h, s: 14, l: 12 }),
    colorPanelMuted: hslToHex({ h, s: 13, l: 16 }),
    colorLine: hslToHex({ h, s: 12, l: 25 }),
    colorText: hslToHex({ h, s: 8, l: 94 }),
    colorTextMuted: hslToHex({ h, s: 10, l: 65 }),
    colorSuccess: withLightness(tokens.colorSuccess, 64, 60),
    colorWarning: withLightness(tokens.colorWarning, 66, 70),
    colorDanger: withLightness(tokens.colorDanger, 66, 70)
  };
}

function tokensToVars(tokens: ThemeTokens): Record<string, string> {
  return {
    "--font-display": tokens.fontDisplay,
    "--font-body": tokens.fontBody,
    "--color-primary": tokens.colorPrimary,
    "--color-primary-foreground": tokens.colorPrimaryForeground,
    "--color-accent-surface": tokens.colorAccentSurface,
    "--color-canvas": tokens.colorCanvas,
    "--color-panel": tokens.colorPanel,
    "--color-panel-muted": tokens.colorPanelMuted,
    "--color-line": tokens.colorLine,
    "--color-text": tokens.colorText,
    "--color-text-muted": tokens.colorTextMuted,
    "--color-success": tokens.colorSuccess,
    "--color-warning": tokens.colorWarning,
    "--color-danger": tokens.colorDanger,
    "--radius-panel": tokens.radius,
    "--density-scale": tokens.density === "compact" ? "0.92" : "1"
  };
}

/** Light-mode CSS variables as an inline style object (backwards compatible). */
export function buildTenantCssVariables(tenant: TenantConfig, mode: ThemeMode = "light"): Record<string, string> {
  const tokens = mode === "dark" ? deriveDarkTokens(tenant.tokens) : tenant.tokens;
  return tokensToVars(tokens);
}

function serialize(vars: Record<string, string>): string {
  return Object.entries(vars)
    .map(([key, value]) => `${key}:${value};`)
    .join("");
}

/**
 * Build a scoped stylesheet for a tenant covering both light and dark mode.
 * Scope is `[data-tenant="slug"]`; dark overrides apply when the document root
 * carries `data-theme="dark"`. This avoids inline styles so dark mode can win
 * on specificity.
 */
export function buildTenantThemeCss(tenant: TenantConfig): string {
  const scope = `[data-tenant="${tenant.slug}"]`;
  const light = serialize(buildTenantCssVariables(tenant, "light"));
  const dark = serialize(buildTenantCssVariables(tenant, "dark"));
  return `${scope}{${light}} :root[data-theme="dark"] ${scope}{${dark}}`;
}
