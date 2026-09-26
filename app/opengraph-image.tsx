import { ImageResponse } from 'next/og';

export const alt = 'Founder Flow — Startup jobs you won\'t find on LinkedIn';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0c0d14 0%, #05204a 55%, #0a0b12 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: 42,
              background: 'rgba(180,151,214,0.15)',
              border: '3px solid rgba(180,151,214,0.55)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 44,
              fontWeight: 700,
              color: '#e1e2ef',
            }}
          >
            F
          </div>
          <div style={{ display: 'flex', fontSize: 60, fontWeight: 700, letterSpacing: -1.5, color: '#ffffff' }}>
            Founder Flow
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: 36,
            fontSize: 34,
            color: 'rgba(255,255,255,0.65)',
            maxWidth: 860,
            textAlign: 'center',
          }}
        >
          Startup jobs you won&apos;t find on LinkedIn
        </div>
      </div>
    ),
    { ...size }
  );
}
