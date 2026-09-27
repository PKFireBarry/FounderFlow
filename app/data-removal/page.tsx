import { Metadata } from 'next';
import DataRemovalForm from './DataRemovalForm';
import { socialMetadata } from '@/lib/social-metadata';

export const metadata: Metadata = {
  title: 'Request Data Removal | FounderFlow',
  description: "If you appear in FounderFlow's directory but never signed up, request removal of your information here.",
  alternates: {
    canonical: 'https://www.founderflow.space/data-removal',
  },
  ...socialMetadata({
    title: 'Request Data Removal | FounderFlow',
    description: "If you appear in FounderFlow's directory but never signed up, request removal of your information here.",
    path: '/data-removal',
  }),
};

export default function DataRemovalPage() {
  return <DataRemovalForm />;
}
