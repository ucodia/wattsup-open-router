import Link from 'next/link'

export default function NavBar() {
  return (
    <nav className="border-b bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between p-4">
        <Link href="/" className="text-lg font-bold">LLM Rankings</Link>
        <div className="space-x-4 text-sm">
          <Link href="https://github.com" className="text-gray-600 hover:text-gray-900">GitHub</Link>
        </div>
      </div>
    </nav>
  )
}
