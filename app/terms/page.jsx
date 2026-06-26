import ClientTermsPage from './ClientTermsPage';

export default function TermsPage() {
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
        <h1>Terms and Conditions - PromptKing</h1>
        <p>
          These Terms and Conditions govern your use of the PromptKing website and all related
          services, products, and AI prompts available on the platform. By accessing or using
          PromptKing, you agree to be bound by these terms. Please read them carefully before
          using our services. PromptKing provides a library of free and premium AI prompts for
          personal and commercial use, subject to the terms outlined here. Free prompts may be
          used for personal, educational, or commercial projects without attribution. Premium
          prompts are available through purchase and are licensed for personal or commercial use
          by the purchasing user only. Redistribution, resale, or sharing of premium prompts is
          strictly prohibited without explicit written permission from PromptKing. Users must not
          use PromptKing prompts to generate content that is illegal, harmful, defamatory, or
          violates the terms of service of any AI platform. PromptKing reserves the right to
          update these terms at any time. Continued use of the platform after changes constitutes
          acceptance of the updated terms.
        </p>
      </div>
      <ClientTermsPage />
    </>
  );
}
