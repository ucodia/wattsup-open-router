import Link from "next/link";

export default function NavBar() {
  return (
    <nav className="border-b bg-white">
      <div className="mx-auto flex max-w-5xl items-center p-4">
        <Link href="/" className="flex items-center gap-1 text-lg font-bold">
          <span role="img" aria-label="lightning">
            ⚡️
          </span>
          Wattsup for OpenRouter
        </Link>
      </div>
    </nav>
  );
}
