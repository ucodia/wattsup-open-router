"use client";

import {
  SimulationConfigEditor,
  loadSimulationConfig,
} from "@/components/simulation-config-editor";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Analytics } from "@vercel/analytics/next";
import { Github, SlidersVertical } from "lucide-react";
import Link from "next/link";
import { createContext, useContext, useState } from "react";
import "./globals.css";

const SimulationConfigContext = createContext();

export function useSimulationConfig() {
  const context = useContext(SimulationConfigContext);
  if (!context) {
    throw new Error(
      "useSimulationConfig must be used within a SimulationConfigProvider"
    );
  }
  return context;
}

export default function RootLayout({ children }) {
  const [simulationConfig, setSimulationConfig] = useState(() =>
    loadSimulationConfig()
  );

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Wattsup for OpenRouter</title>
        <link
          rel="icon"
          href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E%E2%9A%A1%EF%B8%8F%3C/text%3E%3C/svg%3E"
        />
      </head>
      <body className="min-h-screen font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <nav className="border-b">
            <div className="mx-auto flex max-w-5xl items-center justify-between p-4">
              <Link
                href="/"
                className="flex items-center gap-1 text-lg font-bold"
              >
                <span role="img" aria-label="lightning">
                  ⚡️
                </span>
                Wattsup for OpenRouter
              </Link>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" asChild>
                  <a
                    href="https://github.com/ucodia/wattsup-open-router"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="View source on GitHub"
                  >
                    <Github />
                  </a>
                </Button>
                <ThemeToggle />
                <SimulationConfigEditor
                  config={simulationConfig}
                  onConfigChange={setSimulationConfig}
                >
                  <Button variant="outline" size="icon">
                    <SlidersVertical />
                  </Button>
                </SimulationConfigEditor>
              </div>
            </div>
          </nav>
          <SimulationConfigContext.Provider value={simulationConfig}>
            <div className="mx-auto max-w-5xl p-4">{children}</div>
          </SimulationConfigContext.Provider>
          <footer className="py-8 text-center text-muted-foreground">
            <p>
              <a
                href="https://wattsup.tech"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-bold hover:underline"
              >
                Wattsup
              </a>
              : shining a light on AI energy usage.
            </p>
          </footer>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
