import db from '@/lib/db';
import ClientBlogPage from './ClientBlogPage';

export const revalidate = 3600;

export default async function BlogPage() {
  let blogs = [];
  try {
    blogs = await db`SELECT id, title, slug, excerpt, featured_image, featured_image_alt, read_time, published_at, created_at FROM blogs ORDER BY created_at DESC`;
  } catch (err) {
    console.error('Failed to fetch blogs for SSR:', err);
  }

  return (
    <>
      {/*
        Server-rendered blog content — visible to Google AdSense crawler
        even without JavaScript. This fixes the "low value content" issue
        caused by client-side-only rendering.
      */}
      <article
        aria-label="PromptKing Blog Articles"
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
        <h2>PromptKing Blog — AI Prompt Tips, Guides &amp; Updates</h2>
        <p>
          The PromptKing Blog is your go-to resource for AI prompt engineering tutorials, creative writing
          guides, ChatGPT tips, Midjourney techniques, and the latest updates from the world of artificial
          intelligence. Our expert team publishes in-depth articles to help creators, developers, marketers,
          and students get the most out of AI tools like ChatGPT, Google Gemini, Claude, and Midjourney.
          Whether you are a beginner exploring AI for the first time or an advanced user seeking to master
          prompt engineering, our blog has step-by-step guides, best practices, and inspiration for everyone.
        </p>

        {blogs.length > 0 && (
          <section>
            <h2>Latest Articles</h2>
            <ul>
              {blogs.map((blog) => (
                <li key={blog.id}>
                  <article>
                    <h3>
                      <a href={`/article/${blog.slug}`}>{blog.title}</a>
                    </h3>
                    {blog.excerpt && <p>{blog.excerpt}</p>}
                    {blog.published_at && (
                      <time dateTime={new Date(blog.published_at || blog.created_at).toISOString()}>
                        Published: {new Date(blog.published_at || blog.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </time>
                    )}
                    {blog.read_time && <span>Read time: {blog.read_time}</span>}
                  </article>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <h2>What You Will Learn on the PromptKing Blog</h2>
          <ul>
            <li>How to write effective prompts for ChatGPT and GPT-4o</li>
            <li>Advanced Midjourney prompt techniques for stunning AI art</li>
            <li>Google Gemini tips for research, coding, and creative tasks</li>
            <li>Prompt engineering best practices for professional results</li>
            <li>AI workflow automation and productivity hacks</li>
            <li>Creative writing prompts and storytelling with AI</li>
            <li>Business use cases for AI — from marketing copy to product descriptions</li>
          </ul>
        </section>
      </article>

      <ClientBlogPage initialBlogs={blogs} />
    </>
  );
}
