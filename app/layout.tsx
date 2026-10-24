import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AAROGYA-SETU · Care without the wait",
  description: "Citizen-first hospital directory and outpatient care journey.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
