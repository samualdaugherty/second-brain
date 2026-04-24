import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Gary",
  description: "Your second brain.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Gary",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#141414",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${ibmPlexMono.variable} h-full`}>
      <head>
        <link rel="apple-touch-icon" href="/apple-icon" />
      </head>
      <body className="h-full overflow-hidden">{children}</body>
    </html>
  );
}
