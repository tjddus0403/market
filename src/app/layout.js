import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '../contexts/AuthContext';
import { FavoritesProvider } from '../contexts/FavoritesContext';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "당근마켓 클론",
  description: "우리 동네 중고거래 당근마켓",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <FavoritesProvider>
            {children}
          </FavoritesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
