import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gacha Mon - Undian Mon",
  description: "For Indonads User",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Toaster 
          position="top-center"
          richColors
          expand={true}
          visibleToasts={3}
          toastOptions={{
            style: {
              background: '#fff',
              color: '#000',
              border: '1px solid #7c3aed',
              fontSize: '14px',
              fontWeight: '500',
              marginTop: '1rem',
            },
            className: 'font-sans',
            duration: 3000,
          }}
        />
        {children}
      </body>
    </html>
  );
}