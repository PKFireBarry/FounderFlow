import type { Metadata } from "next";
import { Inter, DM_Sans, DM_Serif_Display } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
import StructuredData from './components/StructuredData';
import NotificationProvider from './components/NotificationProvider';
import { SubscriptionProvider } from './hooks/useSubscription';
import OnboardingProvider from './components/onboarding/OnboardingProvider';
import PostHogProvider from './components/PostHogProvider';
import PostHogPageView from './components/PostHogPageView';
import "./globals.css";
import "./globals-founder-flow.css";
import "./design-system.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const dmSerifDisplay = DM_Serif_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Founder Flow | Early-Stage Startup Opportunities",
  description: "Access early-stage startup opportunities before they hit mainstream job boards. Connect directly with seed-stage founders and get verified contact info.",
  keywords: "startup jobs not on linkedin, direct founder contact, verified founder emails, startup founder outreach, founder contact information, skip the job boards, early-stage startup jobs, startup hiring directory",
  authors: [{ name: "Founder Flow" }],
  creator: "Founder Flow",
  publisher: "Founder Flow",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: "website",
    siteName: "Founder Flow",
    title: "Founder Flow | Early-Stage Startup Opportunities",
    description: "Startup jobs you won't find on LinkedIn. Connect directly with seed-stage founders and get verified contact info.",
    url: "https://www.founderflow.space",
    images: [
      {
        url: "/favicon.png",
        width: 1024,
        height: 1024,
        alt: "Founder Flow - Startup Founder Networking Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Founder Flow | Early-Stage Startup Opportunities",
    description: "Startup jobs you won't find on LinkedIn. Connect directly with seed-stage founders and get verified contact info.",
    images: ["/favicon.png"],
  },
  alternates: {
    canonical: "https://www.founderflow.space",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider afterSignUpUrl="/opportunities?welcome=1">
      <PostHogProvider>
        <html lang="en" className="dark">
          <head>
            <StructuredData />
          </head>
          <body
            className={`${inter.variable} ${dmSans.variable} ${dmSerifDisplay.variable} antialiased min-h-screen`}
          >
            <PostHogPageView />
            <SubscriptionProvider>
              <OnboardingProvider>
                <NotificationProvider>
                  {children}
                </NotificationProvider>
              </OnboardingProvider>
            </SubscriptionProvider>
          </body>
        </html>
      </PostHogProvider>
    </ClerkProvider>
  );
}
