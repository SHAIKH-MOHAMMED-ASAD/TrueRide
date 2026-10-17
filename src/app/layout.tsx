import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TrueRide — Continuous Rider Identity Intelligence",
  description:
    "Trust the rider, not just the account. Continuous identity-risk intelligence and behavioral verification platform for delivery fleets.",
  keywords: [
    "Continuous Authentication",
    "Rider Identity",
    "Behavioral Biometrics",
    "Delivery Fraud",
    "Rented Account Detection",
    "Cybersecurity",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#F7F7F5] text-[#17191B]">
        {children}
      </body>
    </html>
  );
}
