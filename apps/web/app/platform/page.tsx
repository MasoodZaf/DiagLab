import { ShieldAlert } from "lucide-react";
import { getPlatformData } from "@lab/demo-data";
import { Card } from "@lab/ui";
import { PlatformConsole } from "../../components/platform/platform-console";
import { getAppContext } from "../../lib/session";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PlatformPage({ searchParams }: PageProps) {
  const sp = searchParams ? await searchParams : undefined;
  const { actor, locale, dir, t, intlLocale } = getAppContext(sp, {
    defaultRole: "super_admin"
  });

  // RBAC: the cross-tenant platform console is a super-admin–only surface.
  if (actor.role !== "super_admin") {
    return (
      <div lang={locale} dir={dir} className="flex min-h-dvh items-center justify-center bg-[var(--color-canvas)] p-6 text-[var(--color-text)]">
        <Card className="mx-auto max-w-xl p-8 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--color-danger)_14%,transparent)] text-[var(--color-danger)]">
            <ShieldAlert className="size-6" />
          </div>
          <h2 className="mt-5 font-[var(--font-display)] text-2xl text-[var(--color-text)]">
            {t("platform.restrictedTitle")}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">{t("platform.restrictedBody")}</p>
        </Card>
      </div>
    );
  }

  const { accounts, tickets } = getPlatformData();

  return (
    <PlatformConsole
      accounts={accounts}
      tickets={tickets}
      intlLocale={intlLocale}
      locale={locale}
      operatorName={actor.displayName}
    />
  );
}
