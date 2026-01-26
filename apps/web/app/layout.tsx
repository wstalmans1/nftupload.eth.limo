import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import type { Metadata } from "next";
import { Fraunces, Space_Grotesk } from "next/font/google";
import { ClientProviders } from "./client-providers";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "700"]
});

const sans = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"]
});

export const metadata: Metadata = {
  title: "NFTupload",
  description: "Mint ERC721s on Sepolia from an image CID."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body>
        <div className="background-grid" />
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
