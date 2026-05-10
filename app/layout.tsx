import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "./components/AuthProvider";
import Navbar from "./components/Navbar";

export const metadata: Metadata = {
  title: "BookWise — Inhabit the Story",
  description: "See every angle, feel every motive, live in the world. Talk to characters, explore alternate paths, and understand fiction like never before.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-gray-50">
        <AuthProvider>
          <Navbar />
          <main>
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
