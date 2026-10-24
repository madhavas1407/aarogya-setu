import type { Metadata, Viewport } from "next";
import { DM_Sans, Manrope } from "next/font/google";
import "./globals.css";

const body = DM_Sans({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const display = Manrope({ subsets: ["latin"], variable: "--font-display", display: "swap" });

export const metadata: Metadata = {
  title: "AAROGYA-SETU · Care without the wait",
  description: "Find hospitals across India, understand where to seek care, and prepare for an outpatient visit. Emergency numbers, consent-first visit requests and a visit checklist.",
  applicationName: "AAROGYA-SETU",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0e2a31" },
    { media: "(prefers-color-scheme: dark)", color: "#071316" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN" className={`${body.variable} ${display.variable}`}>
      <body>{children}</body>
    </html>
  );
}
