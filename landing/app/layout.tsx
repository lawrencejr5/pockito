import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const googleSans = localFont({
  src: [
    { path: "../public/fonts/GoogleSans-Regular.ttf", weight: "400" },
    { path: "../public/fonts/GoogleSans-Medium.ttf", weight: "500" },
    { path: "../public/fonts/GoogleSans-SemiBold.ttf", weight: "600" },
    { path: "../public/fonts/GoogleSans-Bold.ttf", weight: "700" },
  ],
  variable: "--font-google-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pockito — Your money, beautifully simple",
  description:
    "Track income and expenses, set smart budgets, see your net worth and understand your spending. Pockito for iPhone.",
  openGraph: {
    title: "Pockito — Your money, beautifully simple",
    description:
      "Track spending, set budgets and watch your net worth grow. Pockito for iPhone.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#161714",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={googleSans.variable}>
      <body>{children}</body>
    </html>
  );
}
