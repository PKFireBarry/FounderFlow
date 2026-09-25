import { Metadata } from 'next';
import Link from 'next/link';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';

export const metadata: Metadata = {
  title: 'Blog | FounderFlow',
  description: 'Notes on finding startup jobs that never get posted, and how FounderFlow verifies its founder directory.',
  alternates: {
    canonical: 'https://www.founderflow.space/blog',
  },
};

interface PostSummary {
  slug: string;
  title: string;
  description: string;
  publishedDate: string;
}

const posts: PostSummary[] = [
  {
    slug: 'how-we-verify-contact-data',
    title: 'How We Verify Contact Data',
    description: "The actual process behind FounderFlow's directory — where records come from, how they're checked, and what happens when they're wrong.",
    publishedDate: '2026-09-24',
  },
];

export default function BlogIndexPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-neutral-300">
      <Navigation />
      <div className="mx-auto max-w-3xl px-6 py-20">
        <h1 className="text-3xl font-bold text-white mb-2">Blog</h1>
        <p className="text-sm text-neutral-500 mb-12">Notes from building FounderFlow.</p>

        <div className="space-y-6">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="block rounded-xl border border-white/10 bg-[#11121b] p-5 hover:border-white/20 transition-colors"
            >
              <h2 className="text-lg font-semibold text-white mb-1.5">{post.title}</h2>
              <p className="text-sm text-neutral-400 leading-relaxed mb-2">{post.description}</p>
              <time dateTime={post.publishedDate} className="text-xs text-neutral-600">
                {new Date(`${post.publishedDate}T00:00:00`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </time>
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
