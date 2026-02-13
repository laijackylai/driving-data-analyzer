import type { Metadata, Viewport } from "next";
import { Outfit, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
  weight: ["400", "500", "600"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Driving Data Analyzer",
  description: "Analyze and visualize driving behavior data with privacy-first approach",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "OBD2 Dashboard",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#0a1628",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
    >
      <body className="antialiased bg-sapphire-950 text-sapphire-100 font-body min-h-screen safe-area-pad">
        <div className="pearl-overlay" aria-hidden="true" />
        <div className="grain-overlay" aria-hidden="true" />
        <div className="relative z-10 min-h-screen flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
