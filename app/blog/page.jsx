import ClientBlogPage from './ClientBlogPage';

// Server component: renders SEO-critical content server-side for crawlers
export default function BlogPage() {
  return (
    <>
      {/*
        SEO-critical content rendered server-side so crawlers (Semrush, Google)
        can see H1 and text even with JS rendering disabled.
        Visually hidden but present in HTML source for SEO.
      */}
      <div
        aria-hidden="false"
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
        <h1>PromptKing Blog - AI Prompt Tips, Guides &amp; Updates</h1>
        <p>
          Welcome to the PromptKing Blog — your go-to resource for AI prompt tips, creative guides,
          and the latest updates from the world of artificial intelligence. Explore expert tutorials
          on using ChatGPT, Midjourney, Claude, Gemini, and other leading AI tools effectively.
          Learn advanced prompt engineering techniques, discover creative workflows, and stay ahead
          with the latest news from the PromptKing platform. Whether you are a beginner just starting
          with AI tools or an advanced user looking for expert strategies, our blog has something for
          everyone. Browse our collection of in-depth articles, step-by-step how-to guides, and
          prompt inspiration pieces crafted by the PromptKing team of AI enthusiasts and experts.
          Our blog covers topics including AI image generation, text prompts for ChatGPT, Midjourney
          prompting tips, creative writing prompts, business use cases for AI, and much more.
        </p>
      </div>
      <ClientBlogPage />
    </>
  );
}
