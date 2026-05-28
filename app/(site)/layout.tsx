import Image from "next/image";
import Link from "next/link";

// Site-wide chrome: home logo top-left. Theme toggle lives in the root
// layout so it shows on every route (including /media-kit).
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
      {children}
    </>
  );
}
