import './globals.css'
import NavBar from '../components/NavBar'
import Script from 'next/script'

export const metadata = {
  title: 'LLM Rankings',
  description: 'Token usage statistics',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <Script src="https://cdn.tailwindcss.com" />
      </head>
      <body className="min-h-screen bg-gray-50 font-sans">
        <NavBar />
        <div className="mx-auto max-w-5xl p-4">{children}</div>
      </body>
    </html>
  )
}
