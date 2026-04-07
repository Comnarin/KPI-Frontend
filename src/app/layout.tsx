import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import "./globals.css";
import AuthGuard from "@/shared/components/AuthGuard";
import LayoutWrapper from "@/shared/components/LayoutWrapper";
import ErrorBoundary from "@/shared/components/ErrorBoundary";
import { ToastProvider } from "@/shared/components/Toast";
import { I18nProvider } from "@/shared/i18n/provider";

const sarabun = Sarabun({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sarabun",
});

export const metadata: Metadata = {
  title: "ระบบประเมิน KPI | HR Dashboard",
  description: "ระบบประเมินผลการปฏิบัติงานและความสมดุลของภาระงาน",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={`${sarabun.variable} antialiased`} style={{ fontFamily: "'Inter', 'Sarabun', system-ui, sans-serif" }}>
        <ErrorBoundary>
          <I18nProvider>
            <ToastProvider>
              <AuthGuard>
                <LayoutWrapper>
                  {children}
                </LayoutWrapper>
              </AuthGuard>
            </ToastProvider>
          </I18nProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
