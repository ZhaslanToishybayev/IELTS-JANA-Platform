import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { QueryProvider } from "@/lib/query-provider";
import { SidebarWrapper } from "@/components/SidebarWrapper";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  title: "JANA - AI-Powered IELTS Prep",
  description: "Gamified, adaptive IELTS preparation platform with AI-driven skill tracking and personalized learning",
  keywords: ["IELTS", "Reading", "Listening", "Writing", "Speaking", "Preparation", "AI", "Adaptive Learning", "Gamification"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ErrorBoundary>
          <QueryProvider>
            <AuthProvider>
              <SidebarWrapper>
                {children}
              </SidebarWrapper>
            </AuthProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
