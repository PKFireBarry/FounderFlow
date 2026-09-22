export default function StructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://founderflow.space/#website",
        "url": "https://founderflow.space",
        "name": "Founder Flow",
        "description": "Find and connect with tech startup founders through AI-powered outreach platform",
        "publisher": {
          "@id": "https://founderflow.space/#organization"
        }
      },
      {
        "@type": "Organization",
        "@id": "https://founderflow.space/#organization",
        "name": "Founder Flow",
        "url": "https://founderflow.space",
        "logo": {
          "@type": "ImageObject",
          "url": "https://founderflow.space/favicon.png",
          "width": "512",
          "height": "512"
        },
        "description": "AI-powered platform for finding and connecting with tech startup founders",
        "foundingDate": "2024",
        "sameAs": [
          "https://twitter.com/founder-flow",
          "https://linkedin.com/company/founder-flow"
        ]
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