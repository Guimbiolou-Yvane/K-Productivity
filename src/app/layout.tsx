import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import OneSignalProvider from "@/components/OneSignalProvider";

const montserrat = Montserrat({
  variable: "--font-archivo-black",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#ffda59",
};

export const metadata: Metadata = {
  title: "K-Productivity",
  description: "Application de suivi d'objectifs et de productivité gamifiée",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "K-Productivity",
    startupImage: "/Logo.png",
  },
  icons: {
    icon: "/K_SVG.ico",
    apple: [
      { url: "/Logo.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${montserrat.variable} font-sans antialiased pb-28 md:pb-0 overflow-x-hidden`}
      >
        <Navigation />
        <OneSignalProvider />
        {children}
      </body>
    </html>
  );
}
