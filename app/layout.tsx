import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nunonus Service Provider",
  description: "Service provider portal for bookings, services, promotions, and account management."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
