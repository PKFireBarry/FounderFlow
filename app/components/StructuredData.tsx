export default function StructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://www.founderflow.space/#website",
        "url": "https://www.founderflow.space",
        "name": "Founder Flow",
        "description": "Find and connect with tech startup founders through AI-powered outreach platform",
        "publisher": {
          "@id": "https://www.founderflow.space/#organization"
        }
      },
      {
        "@type": "Organization",
        "@id": "https://www.founderflow.space/#organization",
        "name": "Founder Flow",
        "url": "https://www.founderflow.space",
        "logo": {
          "@type": "ImageObject",
          "url": "https://www.founderflow.space/favicon.png",
          "width": 1024,
          "height": 1024
        },
        "alternateName": "FounderFlow",
        "description": "Startup job directory with direct founder contact info, for roles that aren't posted on LinkedIn",
        "disambiguatingDescription": "founderflow.space is the official FounderFlow: a directory of early-stage startups hiring, run by Darion George. Not affiliated with other businesses that use similar names.",
        "foundingDate": "2024",
        "founder": {
          "@id": "https://www.founderflow.space/about#darion-george"
        },
        "contactPoint": {
          "@type": "ContactPoint",
          "email": "info@founderflow.space",
          "contactType": "customer support"
        },
        "sameAs": [
          "https://linkedin.com/company/founder-flow"
        ]
      },
      {
        "@type": "Person",
        "@id": "https://www.founderflow.space/about#darion-george",
        "name": "Darion George",
        "url": "https://www.founderflow.space/about",
        "jobTitle": "Founder",
        "worksFor": {
          "@id": "https://www.founderflow.space/#organization"
        }
      },
      {
        "@type": "SoftwareApplication",
        "name": "Founder Flow",
        "applicationCategory": "BusinessApplication",
        "description": "AI-powered startup founder outreach and networking platform",
        "operatingSystem": "Web Browser",
        "offers": {
          "@type": "Offer",
          "price": "3.00",
          "priceCurrency": "USD",
          "availability": "https://schema.org/InStock"
        }
      }
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}