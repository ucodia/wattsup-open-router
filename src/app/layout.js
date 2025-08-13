import NavBar from "../components/NavBar";
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
      <body className="min-h-screen bg-gray-50 font-sans">
        <NavBar />
        <div className="mx-auto max-w-5xl p-4">{children}</div>
      </body>
    </html>
  );
}
