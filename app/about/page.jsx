import ClientAboutPage from './ClientAboutPage';

export default function AboutPage() {
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
        <h1>About PromptKing - Our Mission &amp; Story</h1>
        <p>
          Welcome to PromptKing, the premier enterprise-grade library for high-performance AI prompts.
          We specialize in curating and optimizing prompts for the world's most advanced AI models,
          including ChatGPT, Midjourney, Claude, and Google Gemini. Our mission is to bridge the gap
          between human creativity and artificial intelligence. We believe the right prompt is the key
          to unlocking the true potential of AI, whether you are a digital artist, a developer, or a
          content creator. PromptKing was founded by a team of AI enthusiasts, prompt engineers, and
          creative professionals passionate about making AI more accessible and powerful for everyone.
          Our curated library features thousands of carefully tested prompts across categories including
          portrait photography, landscape art, business writing, creative fiction, code generation,
          and much more. Every prompt on PromptKing is reviewed for quality, tested for consistency,
          and optimized for the best possible AI output. We offer both free and premium prompts to
          suit every user's needs and budget.
        </p>
      </div>
      <ClientAboutPage />
    </>
  );
}
