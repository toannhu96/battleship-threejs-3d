import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Battleships 3D",
  description: "A 3D Battleships game with AI opponent",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <a
          target="_blank"
          href="https://jam.pieter.com"
          style="font-family: 'system-ui', sans-serif; position: fixed; bottom: -1px; right: -1px; padding: 7px; font-size: 14px; font-weight: bold; background: #fff; color: #000; text-decoration: none; z-index: 10; border-top-left-radius: 12px; z-index: 10000; border: 1px solid #fff;"
        >
          🕹️ Vibe Jam 2025
        </a>
      </body>
    </html>
  );
}
