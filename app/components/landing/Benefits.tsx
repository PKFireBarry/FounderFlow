'use client';

import { useEffect, useRef } from 'react';

export default function Benefits() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(sectionRef.current!);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="mx-auto max-w-6xl px-4 py-16 sm:py-24"
      aria-labelledby="benefits-heading"
    >
      <div className="text-center mb-16">
        <h2
          id="benefits-heading"
          className="font-display text-3xl sm:text-4xl text-white"
          style={{ lineHeight: '1.15', letterSpacing: '-0.02em' }}
        >
          How it works
        </h2>
        <p className="mt-4 text-neutral-400 max-w-xl mx-auto text-base">
          Four steps to go from job board frustration to a real conversation with a founder.
        </p>
      </div>

      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <video
          ref={videoRef}
          src="/demo.mp4"
          muted
          playsInline
          loop
          preload="metadata"
          className="w-full block"
          style={{ display: 'block' }}
        />
      </div>
    </section>
  );
}
