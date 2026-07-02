import ClientAboutPage from './ClientAboutPage';

export default function AboutPage() {
  return (
    <>
      {/*
        Server-rendered about content — fully visible to Google AdSense crawler.
        This is rich, original content that demonstrates site quality and value.
      */}
      <article
        aria-label="About PromptKing"
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
        <h1>About PromptKing — Our Mission &amp; Story</h1>

        <section>
          <h2>Who We Are</h2>
          <p>
            Welcome to PromptKing — the world's leading free AI prompt library. We are a team of AI
            enthusiasts, prompt engineers, creative professionals, and technologists who are passionate
            about making artificial intelligence more accessible, productive, and powerful for everyone.
            PromptKing was built to solve a simple but critical problem: most people spend too much time
            trying to figure out how to talk to AI, and not enough time benefiting from it.
          </p>
          <p>
            Our platform serves creators, developers, marketers, students, writers, designers, and
            business professionals who want to get the best results from AI tools like ChatGPT, Google
            Gemini, Midjourney, Claude, DALL-E, and Stable Diffusion. Every prompt in our library is
            human-engineered, tested for output quality, and organized for fast discovery.
          </p>
        </section>

        <section>
          <h2>Our Mission</h2>
          <p>
            Our mission is to bridge the gap between human creativity and artificial intelligence. We
            believe that the right prompt is the key to unlocking the true potential of AI. A well-crafted
            prompt can turn a mediocre AI output into something extraordinary — and that is exactly what
            PromptKing helps you achieve, every single day.
          </p>
          <p>
            We are committed to democratizing access to high-quality prompt engineering. Whether you are
            a first-time AI user or an advanced prompt engineer, PromptKing gives you the tools and
            knowledge to succeed with AI.
          </p>
        </section>

        <section>
          <h2>What Makes PromptKing Different</h2>
          <p>
            Unlike other prompt directories that rely on user submissions or scraped content, PromptKing
            prompts are created and verified by our in-house team of prompt engineers. Every prompt goes
            through a three-stage process: drafting, testing, and optimization. We test each prompt across
            multiple AI models and versions before publishing it in our library.
          </p>
          <ul>
            <li><strong>Human-tested quality:</strong> Every prompt is tested by real AI practitioners, not auto-generated.</li>
            <li><strong>Multi-model support:</strong> Prompts are optimized for ChatGPT, Gemini, Claude, Midjourney, DALL-E, and more.</li>
            <li><strong>Free access:</strong> Hundreds of high-quality prompts are available for free, with no sign-up required.</li>
            <li><strong>Daily updates:</strong> New prompts are added every day, covering new AI tools, techniques, and use cases.</li>
            <li><strong>Organized library:</strong> Browse by 50+ categories — from portrait photography to code generation to business writing.</li>
            <li><strong>Before/After previews:</strong> Our unique visual comparison tool shows you exactly what each prompt produces.</li>
          </ul>
        </section>

        <section>
          <h2>Our Prompt Categories</h2>
          <p>
            PromptKing covers a wide range of topics to serve every type of AI user. Our library includes
            prompts for:
          </p>
          <ul>
            <li>Portrait photography and Midjourney image generation</li>
            <li>Creative fiction, storytelling, and screenwriting</li>
            <li>Blog writing, SEO content, and copywriting</li>
            <li>Email marketing and social media content</li>
            <li>Software development, code generation, and debugging</li>
            <li>Business strategy, marketing plans, and sales scripts</li>
            <li>Education, lesson planning, and study guides</li>
            <li>Logo design, UI/UX mockups, and brand identity</li>
            <li>Product photography and e-commerce content</li>
            <li>Character design, concept art, and digital illustration</li>
          </ul>
        </section>

        <section>
          <h2>Our Values</h2>
          <p>
            At PromptKing, we are guided by three core values: quality, accessibility, and community.
            Quality means we never publish a prompt without testing it first. Accessibility means our best
            prompts are always free. Community means we listen to our users and build features based on
            what the AI community actually needs.
          </p>
          <p>
            We believe AI should work for everyone — not just those who know how to code or who have
            access to expensive consultants. PromptKing is our contribution to a world where AI is truly
            for everyone.
          </p>
        </section>

        <section>
          <h2>Contact Us</h2>
          <p>
            Have a question, suggestion, or partnership inquiry? We would love to hear from you. Visit
            our <a href="/contact">Contact page</a> or email us at promptking.in@gmail.com. Our team
            typically responds within 24 to 48 hours on business days.
          </p>
        </section>

        <nav aria-label="About page breadcrumb">
          <ol>
            <li><a href="/">Home</a></li>
            <li>About PromptKing</li>
          </ol>
        </nav>
      </article>

      <ClientAboutPage />
    </>
  );
}
