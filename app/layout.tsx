import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cube Atlas — Learn the Solve",
  description:
    "A focused, interactive scroll-led guide to solving a 3×3 Rubik's Cube.",
  openGraph: {
    title: "Cube Atlas — Learn the Solve",
    description: "Scramble, scroll, and learn each move of the 3×3 solve.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cube Atlas — Learn the Solve",
    description: "Scramble, scroll, and learn each move of the 3×3 solve.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
