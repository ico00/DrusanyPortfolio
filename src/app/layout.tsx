import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import CustomCursor from "@/components/CustomCursor";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Drusany | Photography",
    template: "%s | Drusany",
  },
  description:
    "Photography portfolio — portraits, landscapes and moments in natural light.",
  openGraph: {
    title: "Drusany | Photography",
    description:
      "Photography portfolio — portraits, landscapes and moments in natural light.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Drusany | Photography",
    description:
      "Photography portfolio — portraits, landscapes and moments in natural light.",
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
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} antialiased`}
      >
        <CustomCursor />
        {children}
      </body>
    </html>
  );
}
