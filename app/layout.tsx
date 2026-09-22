import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nadiyah's Work Duration",
  description: "Track Nadiyah's work duration and weekly progress."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
