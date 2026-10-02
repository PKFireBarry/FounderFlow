import { Metadata } from 'next';
import OpportunitiesClient from './OpportunitiesClient';
import { socialMetadata } from '@/lib/social-metadata';

export const metadata: Metadata = {
  title: 'Browse Early-Stage Startup Opportunities | FounderFlow',
  description: 'Browse curated leads at seed-stage startups with verified founder contact info — search by role or skill to find companies actively hiring.',
  ...socialMetadata({
    title: 'Browse Early-Stage Startup Opportunities | FounderFlow',
    description: 'Curated leads at seed-stage startups with verified founder contact info.',
    path: '/opportunities',
  }),
  alternates: {
    canonical: 'https://www.founderflow.space/opportunities',
  },
};

export default function OpportunitiesPage() {
  return <OpportunitiesClient />;
}
