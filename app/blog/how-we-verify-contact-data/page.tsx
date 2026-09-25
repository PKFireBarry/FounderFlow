import { Metadata } from 'next';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';

export const metadata: Metadata = {
  title: 'How We Verify Contact Data | FounderFlow Blog',
  description: "The actual process behind FounderFlow's directory — where records come from, how they're checked, and what happens when they're wrong.",
  alternates: {
    canonical: 'https://www.founderflow.space/blog/how-we-verify-contact-data',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: 'How We Verify Contact Data',
  description: "The actual process behind FounderFlow's directory — where records come from, how they're checked, and what happens when they're wrong.",
  datePublished: '2026-09-24',
  author: {
    '@type': 'Person',
    name: 'Darion George',
  },
  publisher: {
    '@type': 'Organization',
    name: 'Founder Flow',
    '@id': 'https://www.founderflow.space/#organization',
  },
  mainEntityOfPage: 'https://www.founderflow.space/blog/how-we-verify-contact-data',
};

export default function HowWeVerifyContactDataPost() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-neutral-300">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navigation />
      <div className="mx-auto max-w-3xl px-6 py-20">
        <p className="text-sm text-neutral-500 mb-2">
          <a href="/blog" className="hover:text-neutral-300 transition-colors">Blog</a>
        </p>
        <h1 className="text-3xl font-bold text-white mb-2">How We Verify Contact Data</h1>
        <p className="text-sm text-neutral-500 mb-12">
          By <a href="/about" className="underline underline-offset-2 hover:text-neutral-300 transition-colors">Darion George</a> · September 24, 2026
        </p>

        <div className="space-y-8 text-sm leading-relaxed">
          <section>
            <p>
              The most common question I get about FounderFlow is some version of: &quot;how do you
              actually know this email address works?&quot; It&apos;s a fair question — the entire
              value of the directory rests on the contact info being real, and I&apos;d rather be
              upfront about the process (and its limits) than let people assume it&apos;s more
              automated or more certain than it is.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">The process, plainly</h2>
            <p className="mb-3">
              Records are built by manually researching and cross-referencing public sources —
              company websites, team pages, LinkedIn profiles, and public hiring signals. This is
              the same kind of research a recruiter would do by hand before reaching out to someone:
              find the company, find who&apos;s actually behind it, find a way to reach them, and
              check that the pieces agree with each other before treating it as reliable.
            </p>
            <p>
              Records are refreshed on an ongoing basis, not written once and left alone. When a
              piece of information can&apos;t be confirmed with reasonable confidence, it&apos;s
              flagged or left out rather than guessed at.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">What &quot;not perfect&quot; actually means</h2>
            <p>
              This is manual research at meaningful scale, and manual research doesn&apos;t catch
              everything. People change roles, companies go quiet, an email that worked last month
              might bounce today. I&apos;d rather say that plainly than imply a level of certainty
              the process doesn&apos;t have. If something is wrong, the honest response isn&apos;t to
              hide it — it&apos;s to make it easy to flag and fix.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">If a record is wrong, or it&apos;s you</h2>
            <p>
              Two different situations, two different paths. If a detail is outdated or incorrect,
              email{' '}
              <a href="mailto:info@founderflow.space" className="text-white underline underline-offset-2 hover:text-neutral-200 transition-colors">
                info@founderflow.space
              </a>{' '}
              and I&apos;ll correct or remove it. If you&apos;re the person listed and you&apos;d
              rather not be in the directory at all — regardless of whether the data is accurate —
              you can request removal at{' '}
              <a href="/data-removal" className="text-white underline underline-offset-2 hover:text-neutral-200 transition-colors">
                founderflow.space/data-removal
              </a>{' '}
              and it will be taken down.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">Why this is worth writing down</h2>
            <p>
              FounderFlow is one person, not a research team with a published methodology. That
              doesn&apos;t mean there isn&apos;t a real process behind it — it means the process is
              simpler than a company might have, and I think it&apos;s more useful to describe it
              accurately than to make it sound bigger than it is. If you&apos;re relying on this
              directory to reach someone, you should know exactly how confident to be in what you
              find.
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
