import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { cacheInvalidate } from '@/lib/cache';

export async function POST(req) {
  try {
    const body = await req.json();
    
    // Convert empty strings to null for integer/date columns to avoid MySQL strict mode errors
    const authorId = body.author_id === '' ? null : body.author_id;
    const enableToc = body.enable_table_of_contents ? 1 : 0;
    
    const fields = {
      title: body.title,
      slug: body.slug,
      category: body.category || null,
      tags: body.tags || null,
      excerpt: body.excerpt || null,
      meta_title: body.meta_title || null,
      meta_description: body.meta_description || null,
      focus_keyword: body.focus_keyword || null,
      canonical_url: body.canonical_url || null,
      featured_image: body.featured_image || null,
      featured_image_alt: body.featured_image_alt || null,
      featured_image_caption: body.featured_image_caption || null,
      og_title: body.og_title || null,
      og_description: body.og_description || null,
      og_image: body.og_image || null,
      twitter_title: body.twitter_title || null,
      twitter_description: body.twitter_description || null,
      twitter_image: body.twitter_image || null,
      content: body.content,
      enable_table_of_contents: enableToc,
      faqs: body.faqs || null,
      author_name: body.author_name || null,
      author_image: body.author_image || null,
      author_description: body.author_description || null,
      author_id: authorId,
      status: body.status || 'published',
      read_time: body.read_time || null
    };

    if (body.id) {
      await db`
        UPDATE blogs SET 
          title=${fields.title}, 
          slug=${fields.slug}, 
          category=${fields.category}, 
          tags=${fields.tags}, 
          excerpt=${fields.excerpt}, 
          meta_title=${fields.meta_title}, 
          meta_description=${fields.meta_description}, 
          focus_keyword=${fields.focus_keyword}, 
          canonical_url=${fields.canonical_url}, 
          featured_image=${fields.featured_image}, 
          featured_image_alt=${fields.featured_image_alt}, 
          featured_image_caption=${fields.featured_image_caption}, 
          og_title=${fields.og_title}, 
          og_description=${fields.og_description}, 
          og_image=${fields.og_image}, 
          twitter_title=${fields.twitter_title}, 
          twitter_description=${fields.twitter_description}, 
          twitter_image=${fields.twitter_image}, 
          content=${fields.content}, 
          enable_table_of_contents=${fields.enable_table_of_contents}, 
          faqs=${fields.faqs}, 
          author_name=${fields.author_name}, 
          author_image=${fields.author_image}, 
          author_description=${fields.author_description}, 
          author_id=${fields.author_id}, 
          status=${fields.status}, 
          read_time=${fields.read_time}
        WHERE id=${body.id}
      `;
    } else {
      await db`
        INSERT INTO blogs (
          title, slug, category, tags, excerpt, meta_title, meta_description, focus_keyword, canonical_url,
          featured_image, featured_image_alt, featured_image_caption, og_title, og_description, og_image,
          twitter_title, twitter_description, twitter_image, content, enable_table_of_contents, faqs,
          author_name, author_image, author_description, author_id, status, read_time
        ) VALUES (
          ${fields.title}, ${fields.slug}, ${fields.category}, ${fields.tags}, ${fields.excerpt}, ${fields.meta_title}, ${fields.meta_description}, ${fields.focus_keyword}, ${fields.canonical_url},
          ${fields.featured_image}, ${fields.featured_image_alt}, ${fields.featured_image_caption}, ${fields.og_title}, ${fields.og_description}, ${fields.og_image},
          ${fields.twitter_title}, ${fields.twitter_description}, ${fields.twitter_image}, ${fields.content}, ${fields.enable_table_of_contents}, ${fields.faqs},
          ${fields.author_name}, ${fields.author_image}, ${fields.author_description}, ${fields.author_id}, ${fields.status}, ${fields.read_time}
        )
      `;
    }
    
    cacheInvalidate('api_blogs');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('SAVE BLOG ERROR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
