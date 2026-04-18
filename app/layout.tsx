import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AppVault — Download Android Apps",
  description: "Download the latest Android apps. Free, fast, safe.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script src="https://quge5.com/88/tag.min.js" data-zone="231197" async data-cfasync="false"></script>
        <script dangerouslySetInnerHTML={{__html: `(function(s){s.dataset.zone='10894886',s.src='https://nap5k.com/tag.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))`}} />
        <script dangerouslySetInnerHTML={{__html: `(function(s){s.dataset.zone='10894893',s.src='https://n6wxm.com/vignette.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))`}} />
      </head>
      <body>{children}</body>
    </html>
  );
}
