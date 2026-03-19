export const metadata = {
  title: "Terms of Service | FounderFlow",
  description: "Terms of Service for FounderFlow",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-neutral-300">
      <div className="mx-auto max-w-3xl px-6 py-20">
        <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-sm text-neutral-500 mb-12">Last updated: March 16, 2026</p>

        <div className="space-y-10 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using FounderFlow (&quot;the Service&quot;), you agree to be bound by these
              Terms of Service. If you do not agree to these terms, do not use the Service. You must
              be at least 18 years of age to use this Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. Description of Service</h2>
            <p>
              FounderFlow provides a platform for startup founders and professionals that includes
              directory browsing of startup founders and companies, AI-powered personalized outreach
              message generation, CRM-style kanban tracking for email and LinkedIn outreach, and
              billing management through Stripe.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. User Accounts</h2>
            <p>
              Account creation and authentication are managed through Clerk. You are responsible for
              maintaining the confidentiality of your account credentials and for all activities that
              occur under your account. You agree to provide accurate and complete information when
              creating your account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. Free Trial &amp; Billing</h2>
            <p>
              FounderFlow offers a 7-day free trial of the Pro plan. After the trial period, the Pro
              plan is billed at $3 per month through Stripe. You may cancel your subscription at any
              time. No refunds will be issued for partial billing periods. By subscribing, you
              authorize FounderFlow to charge your payment method on a recurring monthly basis.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-neutral-400">
              <li>Use the Service for any unlawful purpose or in violation of any applicable laws</li>
              <li>Send spam, harassing, or misleading messages using generated content</li>
              <li>Attempt to gain unauthorized access to other users&apos; accounts or data</li>
              <li>Interfere with or disrupt the Service or its infrastructure</li>
              <li>Scrape, crawl, or otherwise extract data from the Service in an automated manner</li>
              <li>Resell or redistribute the Service without prior written consent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. AI-Generated Content</h2>
            <p>
              FounderFlow uses Google Gemini to generate outreach messages based on your profile,
              resume, and publicly available information. AI-generated content is provided &quot;as
              is&quot; without any guarantee of accuracy, completeness, or suitability. You are solely
              responsible for reviewing, editing, and approving any AI-generated content before
              sending it. FounderFlow is not liable for any consequences arising from the use of
              AI-generated content.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">7. Intellectual Property</h2>
            <p>
              The Service, including its design, features, and content (excluding user-generated
              content), is the property of FounderFlow. You retain ownership of any content you
              submit to the platform. By using the Service, you grant FounderFlow a limited license
              to process your content as necessary to provide the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">8. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, FounderFlow shall not be liable for any
              indirect, incidental, special, consequential, or punitive damages, including but not
              limited to loss of profits, data, or business opportunities, arising from your use of
              the Service. FounderFlow&apos;s total liability shall not exceed the amount you have
              paid for the Service in the twelve months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">9. Termination</h2>
            <p>
              We may suspend or terminate your access to the Service at any time, with or without
              cause, and with or without notice. You may terminate your account at any time by
              canceling your subscription and discontinuing use of the Service. Upon termination,
              your right to use the Service ceases immediately.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">10. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the
              State of Delaware, United States, without regard to its conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">11. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will notify users of
              material changes by updating the &quot;Last updated&quot; date. Your continued use of
              the Service after changes constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">12. Contact</h2>
            <p>
              If you have any questions about these Terms, please contact us at{" "}
              <a href="mailto:info@founderflow.space" className="text-white underline underline-offset-2 hover:text-neutral-200 transition-colors">
                info@founderflow.space
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
