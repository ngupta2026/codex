import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ArogyaYatra",
  description: "AI enabled integrated coordination journey for post-discharge virtual care"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
