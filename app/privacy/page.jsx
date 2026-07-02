import React from 'react';

export const metadata = {
  title: "Privacy Policy - PromptKing | How We Handle Your Data",
  description: "Read PromptKing's complete Privacy Policy. Learn how we collect, use, protect, and share your data, cookies, and personal information on our AI prompts platform.",
  alternates: { canonical: "https://promptking.in/privacy" },
  openGraph: {
    title: "Privacy Policy - PromptKing",
    description: "Read PromptKing's Privacy Policy to understand how we handle your personal data, cookies, and information.",
    url: "https://promptking.in/privacy",
    images: [
      {
        url: 'https://promptking.in/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'PromptKing Privacy Policy',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Privacy Policy - PromptKing",
    description: "Read PromptKing's Privacy Policy to understand how we handle your personal data, cookies, and information.",
    images: ['https://promptking.in/og-image.jpg'],
  },
};

export default function PrivacyPage() {
  const lastUpdated = "July 1, 2026";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Privacy Policy - PromptKing",
    description: "PromptKing's complete Privacy Policy explaining data collection, cookies, third-party services, and user rights.",
    url: "https://promptking.in/privacy",
    dateModified: "2026-07-01",
    publisher: {
      "@type": "Organization",
      name: "PromptKing",
      url: "https://promptking.in",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div style={{ minHeight: '100vh', color: 'white', padding: '60px 20px', maxWidth: '900px', margin: '0 auto' }}>
        
        {/* Header */}
        <header style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div style={{
            display: 'inline-block', padding: '8px 20px',
            background: 'rgba(229, 9, 20, 0.1)', borderRadius: '100px',
            fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-main)',
            border: '1px solid rgba(229, 9, 20, 0.3)', marginBottom: '20px',
            textTransform: 'uppercase', letterSpacing: '2px'
          }}>
            Legal Center
          </div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 900, marginBottom: '16px', letterSpacing: '-1px' }}>
            Privacy Policy
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem' }}>
            Last updated: <strong style={{ color: 'rgba(255,255,255,0.7)' }}>{lastUpdated}</strong>
          </p>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.95rem', marginTop: '10px' }}>
            Your privacy is our priority. This policy explains how PromptKing collects, uses, and protects your information.
          </p>
        </header>

        {/* Content Card */}
        <div style={{
          background: 'rgba(255,255,255,0.02)', borderRadius: '32px',
          border: '1px solid rgba(255,255,255,0.06)', padding: 'clamp(30px, 5vw, 60px)',
          display: 'flex', flexDirection: 'column', gap: '50px'
        }}>

          {/* 1. Introduction */}
          <section>
            <h2 style={h2Style}>1. Introduction</h2>
            <p style={pStyle}>
              At PromptKing, accessible from <strong>https://promptking.in</strong>, one of our main priorities is the privacy of our visitors. This Privacy Policy document describes the types of information that is collected and recorded by PromptKing and how we use it.
            </p>
            <p style={{ ...pStyle, marginTop: '15px' }}>
              If you have additional questions or require more information about our Privacy Policy, please contact us at <a href="https://promptking.in/contact" style={linkStyle}>promptking.in/contact</a>.
            </p>
            <p style={{ ...pStyle, marginTop: '15px' }}>
              This Privacy Policy applies only to our online activities and is valid for visitors to our website with regards to the information that they share and/or collect on PromptKing. This policy does not apply to information collected offline or via channels other than this website.
            </p>
          </section>

          {/* 2. Consent */}
          <section>
            <h2 style={h2Style}>2. Consent</h2>
            <p style={pStyle}>
              By using our website, you hereby consent to our Privacy Policy and agree to its terms. If you do not agree with the terms of this Privacy Policy, please do not use our website.
            </p>
          </section>

          {/* 3. Information We Collect */}
          <section>
            <h2 style={h2Style}>3. Information We Collect</h2>
            <p style={pStyle}>
              The personal information that you are asked to provide, and the reasons why you are asked to provide it, will be made clear to you at the point we ask you to provide your personal information.
            </p>
            <p style={{ ...pStyle, marginTop: '15px' }}>
              If you contact us directly, we may receive additional information about you such as your name, email address, the contents of the message, and any other information you choose to provide.
            </p>
            <h3 style={h3Style}>Information collected automatically:</h3>
            <ul style={listStyle}>
              <li>Internet Protocol (IP) address</li>
              <li>Browser type and version</li>
              <li>Internet Service Provider (ISP)</li>
              <li>Date and time of visit</li>
              <li>Referring and exit pages</li>
              <li>Number of clicks and pages visited</li>
              <li>Device type (desktop, mobile, tablet)</li>
              <li>Operating system</li>
            </ul>
            <p style={{ ...pStyle, marginTop: '15px' }}>
              This information is not linked to any personally identifiable information and is used solely for analytics, site improvement, and security purposes.
            </p>
          </section>

          {/* 4. How We Use Your Information */}
          <section>
            <h2 style={h2Style}>4. How We Use Your Information</h2>
            <p style={pStyle}>We use the information we collect in various ways, including to:</p>
            <ul style={listStyle}>
              <li>Provide, operate, and maintain our website</li>
              <li>Improve, personalize, and expand our website</li>
              <li>Understand and analyze how you use our website</li>
              <li>Develop new products, services, features, and functionality</li>
              <li>Communicate with you for customer service, updates, and other information relating to the website</li>
              <li>Send you emails (only if you have opted in)</li>
              <li>Find and prevent fraud and abuse</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          {/* 5. Cookies & Tracking */}
          <section>
            <h2 style={h2Style}>5. Cookies and Tracking Technologies</h2>
            <p style={pStyle}>
              Like any other website, PromptKing uses cookies. Cookies are small data files placed on your device that help us improve our services and your experience. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
            </p>
            <h3 style={h3Style}>Types of cookies we use:</h3>
            <ul style={listStyle}>
              <li><strong>Essential Cookies:</strong> Required for the website to function properly. These cannot be disabled.</li>
              <li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with the website (via Google Analytics).</li>
              <li><strong>Advertising Cookies:</strong> Used by Google AdSense to serve personalized advertisements based on your interests.</li>
              <li><strong>Preference Cookies:</strong> Remember your settings and preferences for a better experience.</li>
            </ul>
            <p style={{ ...pStyle, marginTop: '15px' }}>
              You may manage or disable cookies through your browser settings. Note that disabling cookies may affect the functionality of parts of our website. For more information on how Google uses cookies, visit{' '}
              <a href="https://policies.google.com/technologies/cookies" target="_blank" rel="noopener noreferrer" style={linkStyle}>
                Google's Cookie Policy
              </a>.
            </p>
          </section>

          {/* 6. Google AdSense & DART Cookies */}
          <section>
            <h2 style={h2Style}>6. Google AdSense & Advertising</h2>
            <p style={pStyle}>
              PromptKing uses Google AdSense, a third-party advertising service provided by Google LLC. Google AdSense uses cookies — known as DART cookies — to serve relevant ads to our visitors based on their visits to <strong>promptking.in</strong> and other sites on the internet.
            </p>
            <p style={{ ...pStyle, marginTop: '15px' }}>
              Google's use of advertising cookies enables it and its partners to serve ads based on your visit to our site and/or other sites on the internet. You may opt out of personalized advertising by:
            </p>
            <ul style={listStyle}>
              <li>Visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" style={linkStyle}>Google Ads Settings</a></li>
              <li>Visiting <a href="https://optout.aboutads.info/" target="_blank" rel="noopener noreferrer" style={linkStyle}>AboutAds.info</a></li>
              <li>Visiting <a href="https://optout.networkadvertising.org/" target="_blank" rel="noopener noreferrer" style={linkStyle}>Network Advertising Initiative Opt-Out</a></li>
            </ul>
            <p style={{ ...pStyle, marginTop: '15px' }}>
              PromptKing does not have access to or control over the cookies used by Google or other third-party advertisers. For more information, visit{' '}
              <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" style={linkStyle}>
                Google's Advertising & Privacy Policy
              </a>.
            </p>
          </section>

          {/* 7. Google Analytics */}
          <section>
            <h2 style={h2Style}>7. Google Analytics</h2>
            <p style={pStyle}>
              We use Google Analytics to monitor and analyze website traffic. Google Analytics collects information such as how often users visit this site, what pages they visit, and what other sites they used prior to coming to this site. We use the information we get from Google Analytics only to improve this site.
            </p>
            <p style={{ ...pStyle, marginTop: '15px' }}>
              Google Analytics collects only the IP address assigned to you on the date you visit this site, rather than your name or other identifying information. We do not combine the information collected through the use of Google Analytics with personally identifiable information.
            </p>
            <p style={{ ...pStyle, marginTop: '15px' }}>
              You can opt out of Google Analytics by installing the{' '}
              <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" style={linkStyle}>
                Google Analytics Opt-out Browser Add-on
              </a>.
            </p>
          </section>

          {/* 8. Third-Party Services */}
          <section>
            <h2 style={h2Style}>8. Third-Party Privacy Policies</h2>
            <p style={pStyle}>
              PromptKing's Privacy Policy does not apply to other advertisers, partners, or websites. Thus, we are advising you to consult the respective Privacy Policies of these third-party ad servers for more detailed information. This includes their practices and instructions about how to opt-out of certain options.
            </p>
            <p style={{ ...pStyle, marginTop: '15px' }}>Third-party services used on this site include:</p>
            <ul style={listStyle}>
              <li><strong>Google AdSense</strong> — Advertising (<a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={linkStyle}>Privacy Policy</a>)</li>
              <li><strong>Google Analytics</strong> — Traffic analytics (<a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={linkStyle}>Privacy Policy</a>)</li>
              <li><strong>Cloudinary</strong> — Image hosting and optimization</li>
            </ul>
          </section>

          {/* 9. Data Sharing */}
          <section>
            <h2 style={h2Style}>9. Data Sharing and Disclosure</h2>
            <p style={pStyle}>
              We do not sell, trade, or rent your personal identification information to others. We may share generic aggregated demographic information not linked to any personal identification information regarding visitors and users with our business partners, trusted affiliates, and advertisers for the purposes outlined above.
            </p>
            <p style={{ ...pStyle, marginTop: '15px' }}>
              We may disclose your information when we believe release is appropriate to comply with the law, enforce our site policies, or protect ours or others' rights, property, or safety.
            </p>
          </section>

          {/* 10. Children's Privacy */}
          <section>
            <h2 style={h2Style}>10. Children's Privacy (COPPA)</h2>
            <p style={pStyle}>
              PromptKing does not knowingly collect any Personal Identifiable Information from children under the age of 13. If you think that your child provided this kind of information on our website, we strongly encourage you to contact us immediately and we will do our best efforts to promptly remove such information from our records.
            </p>
            <p style={{ ...pStyle, marginTop: '15px' }}>
              Our website is not directed at children under 13 years of age. By using this website, you represent that you are at least 13 years of age.
            </p>
          </section>

          {/* 11. User Rights */}
          <section>
            <h2 style={h2Style}>11. Your Privacy Rights</h2>
            <p style={pStyle}>Depending on your location, you may have the following rights regarding your personal data:</p>
            <ul style={listStyle}>
              <li><strong>Right to Access:</strong> Request a copy of the personal data we hold about you.</li>
              <li><strong>Right to Correction:</strong> Request correction of inaccurate personal data.</li>
              <li><strong>Right to Deletion:</strong> Request deletion of your personal data ("right to be forgotten").</li>
              <li><strong>Right to Object:</strong> Object to processing of your personal data for direct marketing.</li>
              <li><strong>Right to Data Portability:</strong> Request transfer of your data to another service.</li>
              <li><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time where processing is based on consent.</li>
            </ul>
            <p style={{ ...pStyle, marginTop: '15px' }}>
              To exercise any of these rights, please contact us via our <a href="https://promptking.in/contact" style={linkStyle}>contact page</a>.
            </p>
          </section>

          {/* 12. Online Privacy Only */}
          <section>
            <h2 style={h2Style}>12. Online Privacy Policy Only</h2>
            <p style={pStyle}>
              This Privacy Policy applies only to our online activities and is valid for visitors to our website with regards to the information that they share and/or collect on PromptKing. This policy does not apply to any information collected offline or via channels other than this website.
            </p>
          </section>

          {/* 13. Changes */}
          <section>
            <h2 style={h2Style}>13. Changes to This Privacy Policy</h2>
            <p style={pStyle}>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date at the top of this policy. You are advised to review this Privacy Policy periodically for any changes.
            </p>
          </section>

          {/* 14. Contact */}
          <section style={{
            background: 'rgba(229, 9, 20, 0.05)', padding: '40px',
            borderRadius: '24px', border: '1px solid rgba(229, 9, 20, 0.15)'
          }}>
            <h2 style={{ ...h2Style, color: 'white' }}>14. Contact Us</h2>
            <p style={pStyle}>
              If you have any questions about this Privacy Policy, please contact us:
            </p>
            <ul style={listStyle}>
              <li>📧 Via our contact form: <a href="https://promptking.in/contact" style={linkStyle}>promptking.in/contact</a></li>
              <li>🌐 Website: <a href="https://promptking.in" style={linkStyle}>https://promptking.in</a></li>
            </ul>
          </section>

        </div>
      </div>
    </>
  );
}

// Shared styles
const h2Style = {
  fontSize: '1.4rem', fontWeight: 800, marginBottom: '16px',
  color: 'white', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px'
};
const h3Style = {
  fontSize: '1.1rem', fontWeight: 700, margin: '20px 0 10px', color: 'rgba(255,255,255,0.85)'
};
const pStyle = {
  color: 'rgba(255,255,255,0.6)', fontSize: '1rem', lineHeight: 1.8, margin: 0
};
const listStyle = {
  paddingLeft: '20px', margin: '12px 0',
  color: 'rgba(255,255,255,0.6)', fontSize: '1rem', lineHeight: 2.0,
  display: 'flex', flexDirection: 'column', gap: '4px'
};
const linkStyle = {
  color: 'var(--accent-main)', textDecoration: 'none', fontWeight: 600
};
