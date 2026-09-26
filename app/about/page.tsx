import { Metadata } from 'next';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import StructuredData from '../components/StructuredData';

export const metadata: Metadata = {
  title: 'About FounderFlow | Startup Job & Founder Contact Directory',
  description: 'FounderFlow is built and run by Darion George. Learn who is behind the directory and why it exists.',
  alternates: {
    canonical: 'https://www.founderflow.space/about',
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-neutral-300">
      <StructuredData />
      <Navigation />
      <div className="mx-auto max-w-3xl px-6 py-20">
        <h1 className="text-3xl font-bold text-white mb-2">About FounderFlow</h1>
        <p className="text-sm text-neutral-500 mb-12">Who&apos;s behind this, and why it exists.</p>

        <div className="space-y-8 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">Who runs this</h2>
            <p>
              FounderFlow is built and operated by me, Darion George, as a sole proprietorship —
              there&apos;s no separate company behind it, no team, just one person building and
              maintaining the product.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">Why FounderFlow exists</h2>
            <p>
              Most job search advice assumes you&apos;ll find your next role through a posted
              listing. Early-stage startups rarely post listings anywhere public — they hire through
              their own network, or by whoever happens to reach out at the right time. FounderFlow
              exists to close that gap: a directory of founders and the roles they&apos;re actually
              trying to fill, with a real way to contact them directly instead of waiting for a job
              board listing that may never come.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">How the directory is built</h2>
            <p>
              Records are compiled from publicly available information — company sites, team pages,
              and public hiring signals — the same kind of research a recruiter would do by hand. It
              isn&apos;t perfect, and some records go stale. If you find something outdated, or you&apos;re
              listed and would rather not be, you can{' '}
              <a href="/data-removal" className="text-white underline underline-offset-2 hover:text-neutral-200 transition-colors">
                request a correction or removal
              </a>{' '}
              at any time. For more detail on the verification process, see{' '}
              <a href="/blog/how-we-verify-contact-data" className="text-white underline underline-offset-2 hover:text-neutral-200 transition-colors">
                how contact data is verified
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">The official FounderFlow site</h2>
            <p>
              This site, founderflow.space, is the only official home of FounderFlow. Other
              businesses and websites use similar names, including on other domains and social
              accounts. FounderFlow isn&apos;t affiliated with any of them, so if you&apos;re looking for
              the startup jobs and founder-contact directory run by Darion George, you&apos;re in the
              right place.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">Get in touch</h2>
            <p>
              Questions, feedback, or something looks wrong? Reach me directly at{' '}
              <a href="mailto:info@founderflow.space" className="text-white underline underline-offset-2 hover:text-neutral-200 transition-colors">
                info@founderflow.space
              </a>.
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
