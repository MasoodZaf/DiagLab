import type { CSSProperties, ReactNode } from "react";
import type { TenantConfig } from "@lab/contracts";
import { buildTenantThemeCss } from "@lab/branding";
import { directionOf, localeMeta, type Locale } from "../lib/i18n";

type TenantThemeProps = {
  tenant: TenantConfig;
  locale: Locale;
  children: ReactNode;
  className?: string;
};

/**
 * Scopes a tenant's brand tokens (light + dark) to its subtree and sets the
 * document language/direction. For RTL locales the script-appropriate font is
 * applied inline so it overrides the tenant's Latin display font.
 */
export function TenantTheme({ tenant, locale, children, className }: TenantThemeProps) {
  const dir = directionOf(locale);
  const meta = localeMeta[locale];

  const rtlFontStyle: CSSProperties | undefined =
    dir === "rtl" && meta.fontStack
      ? ({ "--font-display": meta.fontStack, "--font-body": meta.fontStack } as CSSProperties)
      : undefined;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: buildTenantThemeCss(tenant) }} />
      <div data-tenant={tenant.slug} lang={locale} dir={dir} style={rtlFontStyle} className={className}>
        {children}
      </div>
    </>
  );
}
