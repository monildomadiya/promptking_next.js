"use client";

/**
 * Legacy no-op, kept so existing call sites keep working.
 *
 * Metadata is owned by each route's `generateMetadata`, which renders it
 * server-side where crawlers can see it. This component used to overwrite
 * `document.title` on mount with a differently-formatted title, so the title
 * users saw diverged from the one in the served HTML.
 */
const SEOMetadata = () => null;

export default SEOMetadata;
