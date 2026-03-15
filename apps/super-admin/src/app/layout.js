import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { AuthContextProvider } from "@uet-panda/shared-config";

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
  title: "UET Panda | Super Admin Dashboard",
  description: "Statistics and analytics for all UET Panda cafes.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${poppins.variable} font-sans antialiased`}
      >
        <AuthContextProvider>
            {children}
        </AuthContextProvider>
      </body>
    </html>
  );
}
