export const metadata = {
  title: "Privacy Policy | FounderFlow",
  description: "Privacy Policy for FounderFlow",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-neutral-300">
      <div className="mx-auto max-w-3xl px-6 py-20">
        <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-sm text-neutral-500 mb-12">Last updated: March 16, 2026</p>

        <div className="space-y-10 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. Information We Collect</h2>
            <p className="mb-3">We collect the following types of information:</p>
            <ul className="list-disc list-inside space-y-2 text-neutral-400">
              <li>
                <span className="text-neutral-300 font-medium">Account Information:</span> When you
                sign up through Clerk, we collect your name, email address, and authentication
                credentials.
              </li>
              <li>
                <span className="text-neutral-300 font-medium">Profile &amp; Resume Data:</span> Information
                you voluntarily provide, including your resume, skills, experience, and professional
                profile details used for outreach personalization.
              </li>
              <li>
                <span className="text-neutral-300 font-medium">Usage Data:</span> Information about
                how you interact with the Service, including saved contacts, outreach records,
                kanban board activity, and generated messages.
              </li>
              <li>
                <span className="text-neutral-300 font-medium">Payment Information:</span> Billing
                details processed securely through Stripe. We do not store your full payment card
                information on our servers.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. How We Use Your Data</h2>
            <p className="mb-3">We use your information to:</p>
            <ul className="list-disc list-inside space-y-1 text-neutral-400">
              <li>Provide, maintain, and improve the Service</li>
              <li>Generate personalized AI-powered outreach messages</li>
              <li>Process payments and manage your subscription</li>
              <li>Communicate with you about your account and the Service</li>
              <li>Ensure security and prevent abuse</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. AI Processing Disclosure</h2>
            <p>
              To generate personalized outreach messages, your profile information and resume data
              are sent to the Google Gemini API for processing. This data is transmitted securely
              and is used solely for the purpose of generating outreach content on your behalf.
              Google&apos;s use of this data is governed by their own privacy policies and terms of
              service. We recommend reviewing{" "}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white underline underline-offset-2 hover:text-neutral-200 transition-colors"
              >
                Google&apos;s Privacy Policy
              </a>{" "}
              for more information.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. Third-Party Services</h2>
            <p className="mb-3">We use the following third-party services to operate the platform:</p>
            <ul className="list-disc list-inside space-y-2 text-neutral-400">
              <li>
                <span className="text-neutral-300 font-medium">Clerk</span> — Authentication and
                user account management
              </li>
              <li>
                <span className="text-neutral-300 font-medium">Firebase (Google Cloud)</span> — Data
                storage and file hosting
              </li>
              <li>
                <span className="text-neutral-300 font-medium">Stripe</span> — Payment processing
                and subscription billing
              </li>
              <li>
                <span className="text-neutral-300 font-medium">Google Gemini API</span> — AI-powered
                outreach message generation
              </li>
            </ul>
            <p className="mt-3">
              Each third-party service has its own privacy policy governing their handling of your
              data. We encourage you to review their respective policies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. Data Retention</h2>
            <p>
              We retain your data for as long as your account is active or as needed to provide the
              Service. If you delete your account, we will remove your personal data within a
              reasonable timeframe, except where we are required to retain it by law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. Data Security</h2>
            <p>
              We implement reasonable technical and organizational measures to protect your personal
              data against unauthorized access, alteration, disclosure, or destruction. However, no
              method of transmission over the Internet or electronic storage is completely secure,
              and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">7. Your Rights</h2>
            <p className="mb-3">You have the right to:</p>
            <ul className="list-disc list-inside space-y-1 text-neutral-400">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Export your data in a portable format</li>
              <li>Withdraw consent for data processing where applicable</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, contact us at{" "}
              <a href="mailto:info@founderflow.space" className="text-white underline underline-offset-2 hover:text-neutral-200 transition-colors">
                info@founderflow.space
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">8. No Sale of Data</h2>
            <p>
              We do not sell, rent, or trade your personal data to third parties. Your data is used
              exclusively to provide and improve the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">9. Children&apos;s Privacy</h2>
            <p>
              FounderFlow is not intended for use by individuals under the age of 18. We do not
              knowingly collect personal information from anyone under 18. If we become aware that
              we have collected data from someone under 18, we will take steps to delete that
              information promptly.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify users of material
              changes by updating the &quot;Last updated&quot; date. Your continued use of the
              Service after changes constitutes acceptance of the revised policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">11. Contact</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at{" "}
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
