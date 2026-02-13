import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Driving Data Analyzer",
  description: "Analyze and visualize driving behavior data with privacy-first approach",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
