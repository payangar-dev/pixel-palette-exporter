import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://pixel.payangar.io"),
  title: {
    default: "Pixel Palette Exporter - Extract Colors from Pixel Art",
    template: "%s | Pixel Palette Exporter",
  },
  description:
    "Free online tool to extract and manage color palettes from pixel art images. Export palettes in GPL (GIMP), KPL (Krita), and JSON formats. Perfect for game developers and pixel artists.",
  keywords: [
    "pixel art",
    "color palette",
    "palette extractor",
    "color picker",
    "pixel art tools",
    "game development",
    "GIMP palette",
    "Krita palette",
    "color extraction",
    "pixel art colors",
    "palette export",
    "color management",
  ],
  authors: [{ name: "Payangar", url: "https://github.com/payangar-dev" }],
  creator: "Payangar",
  publisher: "Payangar",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://pixel.payangar.io",
    title: "Pixel Palette Exporter - Extract Colors from Pixel Art",
    description:
      "Free online tool to extract and manage color palettes from pixel art images. Export in multiple formats.",
    siteName: "Pixel Palette Exporter",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pixel Palette Exporter - Extract Colors from Pixel Art",
    description:
      "Free online tool to extract and manage color palettes from pixel art images. Export in multiple formats.",
    creator: "@payangar",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} antialiased font-sans`}>
        {children}
      </body>
    </html>
  );
}
