import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FlashGuard AI | Command Center",
  description: "Predict the Risk. Understand the Impact. Decide What Happens Next.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} dark bg-zinc-950 text-zinc-50 overflow-hidden`}>
        <div className="flex h-screen w-full">
          <Sidebar />
          <div className="flex flex-col flex-1 min-w-0">
            <Topbar />
            <main className="flex-1 overflow-auto bg-zinc-900/50">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
