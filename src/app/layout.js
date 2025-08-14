import Link from "next/link";
import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="icon"
          href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E%E2%9A%A1%EF%B8%8F%3C/text%3E%3C/svg%3E"
        />
      </head>
      <body className="min-h-screen font-sans">
        <nav className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center p-4">
            <Link
              href="/"
              className="flex items-center gap-1 text-lg font-bold"
            >
              <span role="img" aria-label="lightning">
                ⚡️
              </span>
              Wattsup for OpenRouter
            </Link>
          </div>
        </nav>
        <div className="mx-auto max-w-5xl p-4">{children}</div>
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
      </body>
    </html>
  );
}
