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
      <body>{children}</body>
    </html>
  );
}
