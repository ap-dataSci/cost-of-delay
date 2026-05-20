import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cost of Delay",
  description: "How much did waiting cost you? A scrollytelling FIRE explorable.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-neutral-900 antialiased">{children}</body>
    </html>
  );
}
