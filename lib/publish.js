import { revalidatePath } from 'next/cache';
import { cacheInvalidate, CACHE_KEYS } from './cache';

/**
 * Everything an admin write has to knock over before the public site shows it.
 *
 * There are two caches between a saved row and a visitor: this process's own
 * data cache, and Next's rendered-page cache (the `revalidate = 60` on the home,
 * prompt and category pages). Admin routes used to clear whichever of the two
 * their author happened to think of — save_settings cleared the data cache but
 * left the rendered pages, save_faq and save_author cleared neither — so the
 * delay depended on which button was pressed.
 *
 * Pass the *names* from CACHE_KEYS, not the raw strings: a name that doesn't
 * exist is a mistake worth hearing about, and it is exactly the mistake that
 * left `all_prompts_listing` being cleared by four routes and written by none.
 *
 * @param {...keyof CACHE_KEYS} keys
 */
export function publishChanges(...keys) {
  for (const key of keys) {
    const storeKey = CACHE_KEYS[key];
    if (!storeKey) {
      const message = `publishChanges: unknown cache key "${key}"`;
      // Loud in development, survivable in production — a bad key should never
      // be the reason an admin's save fails outright.
      if (process.env.NODE_ENV !== 'production') throw new Error(message);
      console.error(message);
      continue;
    }
    cacheInvalidate(storeKey);
  }

  // From a route handler this only marks the paths; Next rebuilds them on the
  // next visit rather than immediately.
  try {
    revalidatePath('/', 'layout');
  } catch (e) {
    console.error('publishChanges: revalidatePath failed', e?.message);
  }
}

export default publishChanges;
