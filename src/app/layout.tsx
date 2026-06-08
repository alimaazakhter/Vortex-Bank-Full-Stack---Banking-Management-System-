import type { Metadata } from "next";
import { cookies } from "next/headers";
import Script from "next/script";
import ToastContainer from "@/components/Toast";
import { getCurrentUser } from "@/lib/session";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vortex Bank | Premium Digital Banking Platform",
  description: "Experience modern, seamless, and secure digital banking. Generate virtual cards, transfer funds instantly, and grow your savings pots with Vortex Bank.",
  keywords: ["banking", "saas", "fintech", "virtual cards", "savings goals", "digital wallet"],
  authors: [{ name: "Vortex Fintech Group" }],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  const cookieStore = await cookies();
  const cookieTheme = cookieStore.get('vortex_theme')?.value;
  const theme = user?.themePreference?.toLowerCase() || cookieTheme || "dark";

  return (
    <html lang="en" data-theme={theme} suppressHydrationWarning>
      <head>
        <Script
          id="vortex-theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var match = document.cookie.match(/(^|;)\\s*vortex_theme\\s*=\\s*([^;]+)/);
                  var theme = match ? match[2] : 'dark';
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {}
              })();
            `
          }}
        />
      </head>
      <body id="vortex-app-root">
        {/* Persistent background glowing gradients for visual premium quality */}
        <div className="bg-glow-container" id="bg-glow-effects">
          <div className="bg-glow-1"></div>
          <div className="bg-glow-2"></div>
        </div>
        
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
