# Wallpapers on Cloudflare R2

Wallpapers are the largest files this site serves — a 4K source is tens of
megabytes and every download ships the whole thing. R2 stores them and charges
nothing for egress; Cloudflare's image resizing makes the small versions the
pages actually display.

Nothing here is required to run the site. With the R2 variables unset, uploads
keep going to Cloudinary exactly as before, and wallpapers already stored there
keep working forever — every URL builder branches on where the file lives, not
on a global setting.

## What goes where

| | |
|---|---|
| **R2 bucket** | the original upload, one immutable object per wallpaper |
| **`/cdn-cgi/image/…`** | grid thumbnails, page previews — resized at the edge |
| **`/api/wallpapers/download/[slug]`** | the save button (see below) |
| **Cloudinary** | every other image on the site, and pre-R2 wallpapers |

## Dashboard setup

1. **Create the bucket.** R2 → *Create bucket*, name it `promptking-wallpapers`
   (any name works; it goes in `R2_BUCKET`). Location: automatic.

2. **Give it a public hostname.** Bucket → *Settings* → *Public access*:
   - **Custom domain** (recommended): `cdn.promptking.in`, on the same
     Cloudflare zone as the site. Required if you want step 4.
   - Or **r2.dev subdomain** — fine to start with, rate-limited by Cloudflare
     and not eligible for image resizing.

   Whichever you pick becomes `NEXT_PUBLIC_R2_PUBLIC_BASE`, without a trailing
   slash.

3. **Create an API token.** R2 → *API* → *Manage API tokens* → *Create token*,
   permission **Object Read & Write**, scoped to this bucket. Copy the Access
   Key ID and Secret Access Key straight into `.env.local` — they are shown
   once and they are as good as write access to the bucket.

4. **Turn on Image Transformations.** Zone → *Images* → *Transformations* →
   enable for the zone serving the custom domain. Then set
   `NEXT_PUBLIC_R2_TRANSFORMS=1`.

   Skipping this is safe: the grid falls back to full-size originals. It is
   also expensive in bandwidth — a 4K JPEG rendered into a 240px card — so it
   is worth doing before the library grows.

5. **Restart the app.** `NEXT_PUBLIC_*` values are inlined at build time, so a
   change to them needs a rebuild, not just a restart.

## Why downloads go through this site

An anchor's `download` attribute is ignored cross-origin, and a public R2
object carries no `Content-Disposition` — so a direct link to the bucket opens
the wallpaper in a tab instead of saving it. `/api/wallpapers/download/[slug]`
is on our own origin, which makes the attribute work again and puts the
filename under our control. It does not become the path the bytes travel:

- **Original** — 302 to a presigned R2 URL that carries the attachment header.
  The browser talks to Cloudflare directly; this server sends a redirect.
- **Phone / Desktop** — these are crops, and R2 does not crop. They are resized
  here with sharp and returned with a year-long immutable cache header.

That last one is the only path where wallpaper bytes cross this server. To take
it off the origin too, add a Cloudflare **Cache Rule**: match
`http.request.uri.path contains "/api/wallpapers/download/"`, *Eligible for
cache*, edge TTL from the response header. One origin fetch per wallpaper per
size, ever.

## Operational notes

- **Keys are permanent.** `wallpapers/YYYY/MM/<slug>-<random>.<ext>`, never
  reused — re-uploading a corrected file writes a new object rather than
  quietly replacing one that is already cached at the edge and linked from a
  published page.
- **Deleting a wallpaper deletes the object**, row first, file second: a failed
  delete in the bucket must not leave a wallpaper on a page the admin was told
  is gone.
- **Uploads never touch this server.** The browser PUTs to a presigned URL, the
  same reasoning that already sends Cloudinary uploads straight from the page —
  nginx caps request bodies around 1 MB, which is well under one wallpaper.
- **The upload limit is 64 MB**, enforced when the URL is signed. A presigned
  PUT cannot carry a size limit of its own, so it is a guard against mistakes,
  not against someone who already holds an admin session.
