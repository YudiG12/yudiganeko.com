import Image from "next/image";
import Link from "next/link";
import ThemeToggle from "./theme-toggle";

// Site-wide chrome: home logo (top-left) + theme toggle. Lives in this
// route group so standalone routes (like /media-kit) can skip it.
export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Link
        href="/"
        aria-label="Yudi Ganeko"
        className="fixed top-4 left-4 z-50 block transition-opacity hover:opacity-80"
      >
        <Image
          src="/logo.png"
          alt="Yudi Ganeko"
          width={871}
          height={286}
          priority
          className="h-8 sm:h-10 w-auto dark:invert"
        />
      </Link>
      <ThemeToggle />
      {children}
    </>
  );
}
