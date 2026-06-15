import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { SidebarWrapper } from "@/components/SidebarWrapper";

export const metadata: Metadata = {
  title: "JANA - AI-Powered IELTS Reading Prep",
  description: "Gamified, adaptive IELTS Reading preparation platform with AI-driven skill tracking and personalized learning",
  keywords: ["IELTS", "Reading", "Preparation", "AI", "Adaptive Learning", "Gamification"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <SidebarWrapper>
            {children}
          </SidebarWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
