import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AppVault — Download Android Apps",
  description: "Download the latest Android apps. Free, fast, safe.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
