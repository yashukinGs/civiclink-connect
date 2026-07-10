import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import ccLogo from "@/assets/cc-logo.png.asset.json";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { SplashScreen } from "@/components/SplashScreen";
import { ThemeProvider } from "@/lib/theme";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "CivicConnect — Report Civic Issues in Seconds" },
      {
        name: "description",
        content:
          "CivicConnect is a smart citizen issue reporting platform. Report potholes, garbage, streetlights and more. Connecting Citizens. Solving Problems.",
      },
      { name: "author", content: "CivicConnect" },
      { property: "og:title", content: "CivicConnect — Report Civic Issues in Seconds" },
      {
        property: "og:description",
        content:
          "Help build a cleaner, safer, and smarter city. Report and track civic issues in seconds with CivicConnect.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "CivicConnect" },
      { property: "og:url", content: "https://connect-citizen-pro.lovable.app/" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@CivicConnect" },
      { name: "twitter:title", content: "CivicConnect — Report Civic Issues in Seconds" },
      {
        name: "twitter:description",
        content:
          "Help build a cleaner, safer, and smarter city. Report and track civic issues in seconds with CivicConnect.",
      },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/8912a510-94b7-4426-a77b-7f8b878afcb5/id-preview-5334ddf7--83c1cb5f-edf2-4881-8b0c-2c4d99edb8fa.lovable.app-1780621831421.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/8912a510-94b7-4426-a77b-7f8b878afcb5/id-preview-5334ddf7--83c1cb5f-edf2-4881-8b0c-2c4d99edb8fa.lovable.app-1780621831421.png" },
    ],
    links: [
      { rel: "icon", type: "image/png", href: ccLogo.url },
      { rel: "apple-touch-icon", href: ccLogo.url },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Sora:wght@600;700;800&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "CivicConnect",
          url: "https://connect-citizen-pro.lovable.app/",
          description:
            "Smart citizen issue reporting platform to report and track local civic issues.",
          potentialAction: {
            "@type": "SearchAction",
            target:
              "https://connect-citizen-pro.lovable.app/track?ticket={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "CivicConnect",
          url: "https://connect-citizen-pro.lovable.app/",
          logo: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/8912a510-94b7-4426-a77b-7f8b878afcb5/id-preview-5334ddf7--83c1cb5f-edf2-4881-8b0c-2c4d99edb8fa.lovable.app-1780621831421.png",
          email: "gaikwadyashraj368@gmail.com",
          telephone: "+91 7757886982",
          contactPoint: {
            "@type": "ContactPoint",
            email: "gaikwadyashraj368@gmail.com",
            telephone: "+91 7757886982",
            contactType: "customer support",
          },
        }),
      },
    ],
  }),

  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('cc_theme');if(t==='light'){document.documentElement.classList.add('light');}}catch(e){}})();`,
          }}
        />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function SplashGate() {
  // Show the splash only once, on the very first open of the web app
  // (per browser session). Start false so SSR/first render match (no hydration mismatch).
  const [booting, setBooting] = useState(false);

  useEffect(() => {
    let shown = true;
    try {
      shown = sessionStorage.getItem("cc_splash_shown") === "true";
    } catch {
      shown = true;
    }
    if (shown) return;

    setBooting(true);
    const timer = setTimeout(() => {
      try {
        sessionStorage.setItem("cc_splash_shown", "true");
      } catch {
        /* ignore */
      }
      setBooting(false);
    }, 6000);
    return () => clearTimeout(timer);
  }, []);

  if (!booting) return null;
  return <SplashScreen />;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SplashGate />
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
        <Toaster position="top-center" richColors />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
