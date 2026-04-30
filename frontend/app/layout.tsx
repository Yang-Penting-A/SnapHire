import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
// @ts-ignore - Next.js supports global CSS side-effect imports in app/layout
import "./globals.css";

const jakartaSans = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  weight: ['400', '500', '600', '700', '800'], 
});

export const metadata: Metadata = {
  title: "snapHire",
  description: "Platform pencarian kerja masa depan",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html 
      lang="en"
      data-arpa="snapHire"
      suppressHydrationWarning>
      <body className={jakartaSans.className}>
        {children}
      </body>
    </html>
  );
}