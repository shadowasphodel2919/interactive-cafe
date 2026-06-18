import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "My Interactive Café",
  description: "A premium, immersive ambient sound experience. Select and blend ambient café sounds to create your perfect atmosphere.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#0a0a0f] text-white overflow-hidden">
        {children}
      </body>
    </html>
  );
}

