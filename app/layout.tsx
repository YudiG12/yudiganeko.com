import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";
import ThemeToggle from "./theme-toggle";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Yudi Ganeko",
  description: "Criado por Yudi Ganeko",
};

const themeInitScript = `(function(){try{var s=localStorage.getItem('theme');var d=s?s==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
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
      </body>
    </html>
  );
}
