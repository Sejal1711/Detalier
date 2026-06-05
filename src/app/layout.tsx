import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Datelier",
  description: "Datelier — internal matchmaking dashboard for the Datelier team",
};

// Runs before React hydrates so the correct theme class is set with no flash.
const themeScript = `
(function () {
  try {
    // Default to light mode; only go dark if the user explicitly chose it before.
    var stored = localStorage.getItem('tdc-theme');
    if (stored === 'dark') document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
