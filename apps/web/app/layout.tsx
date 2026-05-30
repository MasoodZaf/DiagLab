import "./globals.css";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "AURA — White-label Diagnostic Lab Platform",
  description:
    "AI-native, white-label diagnostic laboratory platform for Pakistan and the GCC. Patient booking, sample tracking, lab workflows, validated reporting, billing — fully branded.",
  applicationName: "AURA LIMS",
  keywords: [
    "LIS",
    "LIMS",
    "diagnostic lab software",
    "pathology",
    "Pakistan",
    "GCC",
    "white-label",
    "ISO 15189"
  ]
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f8f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0a1412" }
  ]
};

// Applies the stored / preferred theme before first paint to avoid a flash.
const themeScript = `(function(){try{var t=localStorage.getItem('aura-theme');if(t!=='light'&&t!=='dark'){t=(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light';}document.documentElement.dataset.theme=t;}catch(e){}})();`;

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
