import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "InsightRush | AQP Engine",
  description: "High-Performance Approximate Query Processing Engine — Real-time analytical throughput with configurable accuracy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
