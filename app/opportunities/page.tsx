import { Metadata } from 'next';
import OpportunitiesClient from './OpportunitiesClient';

export const metadata: Metadata = {
  title: 'Browse Early-Stage Startup Opportunities | FounderFlow',
  description: 'Browse curated leads at seed-stage startups with verified founder contact info — search by role or skill to find companies actively hiring.',
  openGraph: {
    title: 'Browse Early-Stage Startup Opportunities | FounderFlow',
    description: 'Curated leads at seed-stage startups with verified founder contact info.',
    url: 'https://founderflow.space/opportunities',
  },
  alternates: {
    canonical: 'https://founderflow.space/opportunities',
  },
};

export default function OpportunitiesPage() {
  return <OpportunitiesClient />;
}
