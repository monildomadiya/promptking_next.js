# PromptKing Admin — Android app

A Flutter app that manages promptking.in from a phone. It talks to the
**existing** `/api/admin` routes; nothing on the server had to change for it.

## How it signs in

`lib/auth.js` already accepts an `x-admin-token` header carrying the same JWT
the web panel keeps in `localStorage`. The app posts the admin PIN to
`/api/admin/login`, stores the returned token in the Android keystore, and
sends it on every request. A 401 anywhere clears the token and drops you back
on the login screen — that is a 24-hour JWT, so it happens about once a day.

The server address is editable on the login screen (behind *Change server
address*). Production is `https://promptking.in`. To point at a laptop running
`next dev`, use that laptop's LAN address — `http://192.168.1.x:3000` — because
`localhost` on a phone means the phone.

## Getting it running

Flutter is not installed on this machine. Once it is:

```powershell
cd mobile
powershell -ExecutionPolicy Bypass -File tool\setup.ps1
flutter run
```

`tool\setup.ps1` generates `android/` with `flutter create` (which leaves
`lib/` and `pubspec.yaml` alone), adds the INTERNET permission to the release
manifest — Flutter only puts it in the debug one, so a release build otherwise
fails every request — sets the app label, and runs `pub get`.

To produce an installable file:

```powershell
flutter build apk --release
```

It lands in `build\app\outputs\flutter-apk\app-release.apk`.

Requires Flutter 3.27 or newer (the theme uses `CardThemeData` and
`Color.withValues`). Built and verified against Flutter 3.47.5 / Dart 3.13.4,
Android SDK 36, JDK 17.

### If the Gradle build dies on `sdkmanager`

On a fresh SDK the first build fails like this:

```
Package ndk not found.
Package 28.2.13676358 not found.
> Process 'command '...\cmdline-tools\latest\bin\sdkmanager.bat'' finished with
  non-zero exit value -1073740791 (NTSTATUS 0xC0000409)
```

`android/app/build.gradle.kts` pins `ndkVersion = flutter.ndkVersion`, so AGP
insists that exact NDK is present even though this app has no native code of
its own. AGP tries to fetch it through `sdkmanager`, which is now a deprecated
shim over Google's new `android` CLI — and the shim crashes instead of
installing anything.

Install the NDK directly with the tool that works, then build again:

```powershell
android sdk install --sdk $env:ANDROID_HOME --no-metrics "ndk;28.2.13676358"
```

The `android` CLI also exits with `0xC0000409` after it finishes, but by then
the files are all written — check `%ANDROID_HOME%\ndk\<version>\source.properties`
rather than trusting its exit code.

## What is in it

| Section | What you can do |
| --- | --- |
| Dashboard | Prompt/blog/view/copy/unlock/like totals, plus a 7d/30d/all traffic chart |
| Prompts | Search, filter by featured/premium/draft, full editor, featured and premium toggles, bulk hide/publish/delete, drag to reorder |
| Listicles | The same screen against `/api/admin/listicles` |
| Wallpapers | Image grid, category filter, full editor, draft and featured flags |
| Wallpaper categories | Create, edit, delete, sort order |
| Blogs | List and edit, including the HTML body, featured image, author and status |
| Authors | Create, edit, delete, photo |
| FAQs | Create, edit, ordering, active flag |
| Categories / Website categories | Create and edit |
| Users | Read-only listing |
| Settings | Logo and sizes, social links, AdSense client and all seven slots, slider default |

Images upload through `/api/admin/upload_image` (Cloudinary) from the gallery or
the camera, or import by URL through `/api/admin/upload_image_url`, which makes
the **server** fetch the file — worth using on mobile data, since it avoids
pulling a large image down only to push it back up.

## Two things the server does not support yet

These are pre-existing gaps in the web panel, not app bugs. The app does not
pretend otherwise — the affected actions are hidden rather than offered and
then failing.

1. **No delete route for categories, website categories or FAQs.** There is a
   `delete_author`, `delete_blog`, `delete_prompt`, `delete_wallpaper` and
   `delete_wallpaper_category`, but no `delete_category`,
   `delete_website_category` or `delete_faq`. The web panel calls them anyway
   and gets a 404. Delete is switched off for those three sections here.

2. **The web panel's category image field never round-trips.** The
   `categories` table has `image` and `icon` columns — `save_category` inserts
   into them — but `CategoryModal.jsx` posts the picked URL as `image_url` and
   reads `category.image_url` back. The route ignores a key by that name, so
   the column is written NULL and the form always reopens empty.

   The app sends `image` *and* `image_url`, and reads `image_url` with a
   fallback to `image`, so category images do save and reload correctly here.
   The web panel will still show the field empty until `CategoryModal.jsx` is
   changed to use `image`.

Also worth knowing: a listicle deletes through `delete_prompt`, not
`delete_listicle` (which does not exist) — a listicle is just a row in
`prompts` with `website_category_id` set.

## Layout

```
lib/
  main.dart                  app entry, splash and the signed-in/out gate
  core/
    api_client.dart          transport, token storage, uploads, 401 handling
    admin scope + theme      AppScope (DI), AppTheme (dark + gold)
    values.dart              MySQL-through-JSON coercion (tinyint, JSON columns, dates)
  services/admin_api.dart    every /api/admin route in one place
  widgets/                   form controls, image picker field, list states
  screens/                   one file per section, plus the editors
```

Rows travel as `Map<String, dynamic>` rather than typed models, and every
editor starts from the row it was opened with. That is deliberate:
`save_prompt` rewrites the whole row, so a form that only knew about the twelve
columns it displays would null out the other twenty on every save.
