import crypto from 'crypto';

/**
 * JSON responses for data the admin panel can change at any moment.
 *
 * These endpoints used to ship `public, max-age=600, stale-while-revalidate=1800`
 * (3600/86400 on /api/faqs). `max-age` is a promise to the browser that the
 * payload will not change for that long, so it stops asking; `stale-while-
 * revalidate` then lets it keep showing the old copy for longer still. That is
 * why an admin change took "some time" to appear on the live site — the server
 * had the new value ready within milliseconds, but every browser that had
 * already loaded the page refused to ask for it again for ten minutes, and up
 * to forty on a repeat visit. FAQs were an hour, and a day.
 *
 * `no-cache` is not `no-store`: the browser still keeps the body, it just has to
 * ask whether it is still current before reusing it. When nothing changed the
 * answer is a 304 with an empty body, so being always-fresh costs a conditional
 * request rather than a re-download — on /api/get_data that is ~250 KB saved per
 * repeat load while still reflecting an edit on the very next one.
 *
 * The in-memory cache behind these routes is untouched: it absorbs the database
 * hit, which is the part that actually costs something.
 *
 * @param {Request} req  the incoming request, for its If-None-Match header
 * @param {*} data       payload to serialize
 */
export function liveJson(req, data, { headers: extra } = {}) {
  const body = JSON.stringify(data);
  // Weak tag: nginx downgrades strong ones when it gzips a proxied response
  // anyway, and comparison here is byte-for-byte on the payload regardless.
  const etag = `W/"${crypto.createHash('sha1').update(body).digest('base64url')}"`;

  const headers = {
    'Cache-Control': 'public, no-cache, must-revalidate',
    ETag: etag,
    ...extra,
  };

  if (req?.headers?.get?.('if-none-match') === etag) {
    return new Response(null, { status: 304, headers });
  }

  return new Response(body, {
    status: 200,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}

export default liveJson;
