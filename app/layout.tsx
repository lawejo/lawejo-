import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "lawejo",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0b1129",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="da">
      <body>
        <header className="site-header">
          <Link href="/">lawejo</Link>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
