import { Metadata } from 'next';
import { listCompanies } from '../../lib/companies';
import Navigation from '../components/Navigation';
import CompanyIndexFilter from './CompanyIndexFilter';

export const metadata: Metadata = {
  title: 'All companies hiring | FounderFlow',
  description: 'Browse every company in the FounderFlow directory — 1.5+ years of startup hiring history with direct founder contacts.',
  openGraph: {
    title: 'All companies hiring | FounderFlow',
    description: 'Every startup that has posted on FounderFlow, with their full hiring history.',
    url: 'https://founderflow.space/companies',
  },
  alternates: {
    canonical: 'https://founderflow.space/companies',
  },
};

export default async function CompaniesPage() {
  const companies = await listCompanies();

  return (
    <div className="min-h-screen text-white">
      <Navigation />
      <div className="max-w-6xl mx-auto px-4 pt-8 pb-16">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl">Companies hiring</h1>
          <p className="mt-1.5 text-sm" style={{ color: 'rgba(255,255,255,.38)' }}>
            {companies.length.toLocaleString()} companies &middot; 1.5+ years of startup hiring history
          </p>
        </div>

        <CompanyIndexFilter companies={companies} />
      </div>
    </div>
  );
}
