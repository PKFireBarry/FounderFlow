"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";

function PostHogIdentifier() {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded || !user) return;
    posthog.identify(user.id, {
      email: user.primaryEmailAddress?.emailAddress,
      name: user.fullName ?? undefined,
    });
  }, [isLoaded, user]);

  return null;
}

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      capture_pageview: false,
      capture_pageleave: true,
    });
  }, []);

  return (
    <PHProvider client={posthog}>
      <PostHogIdentifier />
      {children}
    </PHProvider>
  );
}
