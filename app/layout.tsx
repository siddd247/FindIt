import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Nearby Stock Finder · Jammu", template: "%s · Nearby Stock Finder" },
  description: "Find electronics in Jammu shops. Compare prices, stock confirmation times, and distance before you go.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
