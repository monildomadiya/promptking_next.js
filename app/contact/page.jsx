import ClientContactPage from './ClientContactPage';

export default function ContactPage() {
  return (
    <>
      <div
        aria-hidden="false"
        style={{
          position: 'absolute', width: '1px', height: '1px', padding: 0,
          margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)',
          whiteSpace: 'nowrap', border: 0,
        }}
      >
        <h1>Contact Us - PromptKing</h1>
        <p>
          Get in touch with the PromptKing team. We are here to help you with any questions,
          support requests, collaboration inquiries, or feedback about our AI prompts platform.
          Whether you want to report a bug, suggest a new feature, inquire about partnerships,
          or simply say hello, we would love to hear from you. Our team typically responds within
          24 to 48 hours on business days. You can reach us through the contact form on this page
          or by emailing us directly. PromptKing is committed to providing excellent customer support
          and ensuring every user has the best possible experience on our platform. We value your
          feedback and use it to continuously improve our AI prompt library and platform services.
        </p>
      </div>
      <ClientContactPage />
    </>
  );
}
