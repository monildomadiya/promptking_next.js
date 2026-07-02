import ClientContactPage from './ClientContactPage';

export default function ContactPage() {
  return (
    <>
      {/*
        Server-rendered contact content — visible to Google AdSense crawler.
        Provides genuine value and context about how to contact PromptKing.
      */}
      <article
        aria-label="Contact PromptKing"
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0,0,0,0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      >
        <h1>Contact PromptKing — Get in Touch with Our Team</h1>

        <p>
          Have a question, feedback, or collaboration inquiry? The PromptKing team is here to help.
          Whether you want to report a bug, suggest a new prompt category, request a custom prompt,
          inquire about advertising partnerships, or simply say hello — we would love to hear from you.
        </p>

        <section>
          <h2>How to Contact Us</h2>
          <p>
            You can reach the PromptKing team through any of the following channels:
          </p>
          <ul>
            <li><strong>Contact Form:</strong> Fill out the form on this page and we will respond within 24–48 business hours.</li>
            <li><strong>Email:</strong> Send us an email at promptking.in@gmail.com for support, partnerships, or media inquiries.</li>
            <li><strong>Social Media:</strong> Follow us and send us a message on Instagram, YouTube, or Twitter/X for quick responses.</li>
          </ul>
        </section>

        <section>
          <h2>What Can We Help You With?</h2>
          <ul>
            <li><strong>Prompt Support:</strong> Having trouble using a prompt? We can help you customize it for your specific use case.</li>
            <li><strong>Feature Requests:</strong> Want to see a new category, AI tool, or feature on PromptKing? Let us know.</li>
            <li><strong>Bug Reports:</strong> Found something not working correctly? Tell us and we will fix it as quickly as possible.</li>
            <li><strong>Content Partnerships:</strong> Are you a content creator, blogger, or AI educator interested in collaborating?</li>
            <li><strong>Advertising Inquiries:</strong> Interested in advertising on PromptKing to reach our audience of AI enthusiasts?</li>
            <li><strong>Custom Prompts:</strong> Need a prompt engineered specifically for your business or workflow?</li>
            <li><strong>Press &amp; Media:</strong> Journalists and researchers can reach us for information about PromptKing and our data.</li>
          </ul>
        </section>

        <section>
          <h2>Our Response Time</h2>
          <p>
            We take every message seriously and aim to respond to all inquiries within 24 to 48 hours on
            business days (Monday through Friday). For urgent support issues, please include "URGENT" in
            your subject line or message title.
          </p>
        </section>

        <section>
          <h2>Frequently Asked Contact Questions</h2>
          <dl>
            <div>
              <dt><strong>Can I request a custom prompt for my business?</strong></dt>
              <dd>Yes! Use the contact form below to describe your use case and we will engineer a custom prompt for you.</dd>
            </div>
            <div>
              <dt><strong>How do I report a prompt that is not working?</strong></dt>
              <dd>Contact us via the form below with the prompt name and the AI tool you are using. Include the error or unexpected output you received.</dd>
            </div>
            <div>
              <dt><strong>Are you open to partnerships and collaborations?</strong></dt>
              <dd>Absolutely. We welcome collaborations with AI educators, content creators, software companies, and complementary tools. Reach out to discuss opportunities.</dd>
            </div>
          </dl>
        </section>

        <nav aria-label="Contact page breadcrumb">
          <ol>
            <li><a href="/">Home</a></li>
            <li>Contact Us</li>
          </ol>
        </nav>
      </article>

      <ClientContactPage />
    </>
  );
}
