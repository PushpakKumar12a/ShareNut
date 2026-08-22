import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { EngineProvider } from "@/features/transfer/engine/EngineContext";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const outfit = Outfit({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ShareNut — Decentralized Peer-to-Peer WebRTC File Mesh",
  description:
    "Direct browser-to-browser high-speed file transfer using WebRTC SCTP DataChannels and SHA-256 chunk verification. Zero sign-in required.",
  keywords: ["file transfer", "peer-to-peer", "WebRTC", "ShareNut", "P2P", "encrypted"],
  icons: {
    icon: "/sharenut-logo.png",
    shortcut: "/sharenut-logo.png",
    apple: "/sharenut-logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${jakarta.variable} ${outfit.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-[#faf8f5] text-slate-900 selection:bg-amber-600 selection:text-white">
        <EngineProvider>
          {children}
        </EngineProvider>
      </body>
    </html>
  );
}
