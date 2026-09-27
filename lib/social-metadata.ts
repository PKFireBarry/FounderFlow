import type { Metadata } from 'next';

const BASE_URL = 'https://www.founderflow.space';

const OG_IMAGE = {
  url: `${BASE_URL}/opengraph-image`,
  width: 1200,
  height: 630,
  alt: "Founder Flow — Startup jobs you won't find on LinkedIn",
};

/**
 * Open Graph + Twitter metadata for a page. A page-level `openGraph` replaces the
 * layout's entirely (it doesn't merge), so any page that sets its own — or that
 * inherits the layout's homepage title/URL — needs the image, url, and
 * title/description spelled out here or link previews show the wrong page.
 */
export function socialMetadata({
  title,
  description,
  path,
  type = 'website',
}: {
  title: string;
  description: string;
  path: string;
  type?: 'website' | 'article';
}): Pick<Metadata, 'openGraph' | 'twitter'> {
  return {
    openGraph: {
      title,
      description,
      url: `${BASE_URL}${path}`,
      siteName: 'Founder Flow',
      type,
      images: [OG_IMAGE],
    } as Metadata['openGraph'],
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [OG_IMAGE.url],
    },
  };
}
