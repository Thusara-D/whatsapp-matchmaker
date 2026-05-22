import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Matchmaking Dashboard",
  description: "Private management dashboard for automated matchmaking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  );
}
