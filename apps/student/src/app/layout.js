import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { AuthContextProvider, CartContextProvider } from "@uet-panda/shared-config";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "UET Panda | Multi-Vendor Cafe System",
  description: "Independent cafes, unified flavor. Centralized food portal for UET Lahore.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${poppins.variable} font-sans antialiased`}
      >
        <AuthContextProvider>
          <CartContextProvider>
            {children}
          </CartContextProvider>
        </AuthContextProvider>
      </body>
    </html>
  );
}
