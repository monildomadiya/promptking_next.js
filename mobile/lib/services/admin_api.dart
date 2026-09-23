import '../core/api_client.dart';

/// Every `/api/admin` route the web panel uses, in one place.
///
/// The list endpoints all answer with a bare JSON array and the save endpoints
/// all take the whole row as a JSON body, so these stay deliberately thin —
/// the rows travel as maps rather than typed models. That is not laziness: the
/// `prompts` table has thirty-odd columns and an edit screen that only knows
/// about twelve of them would silently drop the rest on every save.
class AdminApi {
  AdminApi(this.client);

  final ApiClient client;

  // --- Dashboard & analytics ------------------------------------------------
  //
  // There is no wrapper for /api/admin/check_auth: the first screen's load
  // already proves the token, and a 401 from any request clears it and sends
  // the app back to the login form. A separate probe would only add a round
  // trip that can disagree with the request right behind it.

  Future<Map<String, dynamic>> dashboard() async {
    final dynamic data = await client.get('/api/admin/dashboard');
    return _asMap(data);
  }

  /// [days] is either a number of days or the literal `all`, matching the
  /// query the web dashboard sends.
  Future<List<Map<String, dynamic>>> analytics({String days = '30'}) async {
    final dynamic data =
        await client.get('/api/admin/analytics', query: <String, String>{'days': days});
    return _asList(data);
  }

  Future<void> resetAnalytics() => client.post('/api/admin/analytics/reset');

  // --- Generic list access --------------------------------------------------

  /// Lists any admin collection by its route segment: `prompts`, `listicles`,
  /// `blogs`, `categories`, `website_categories`, `wallpapers`,
  /// `wallpaper_categories`, `authors`, `faqs`, `users`.
  Future<List<Map<String, dynamic>>> list(String collection) async {
    final dynamic data = await client.get('/api/admin/$collection');
    return _asList(data);
  }

  /// Deletes by the route the web panel uses: `delete_<type>/<id>`. Prompts and
  /// listicles are keyed by `prompt_key`, everything else by numeric `id`.
  Future<void> deleteItem(String type, Object id) {
    return client.delete('/api/admin/delete_$type/$id');
  }

  // --- Prompts & listicles --------------------------------------------------

  /// [originalKey] is null when creating. The route uses its presence to tell
  /// an update from an insert, and rejects a `prompt_key` that is taken by
  /// somebody else, so the edit screen passes the key it loaded with.
  Future<Map<String, dynamic>> savePrompt(Map<String, dynamic> prompt, {String? originalKey}) async {
    final Map<String, dynamic> body = <String, dynamic>{...prompt};
    if (originalKey != null && originalKey.isNotEmpty) {
      body['originalKey'] = originalKey;
    }
    final dynamic data = await client.post('/api/admin/save_prompt', body);
    return _asMap(data);
  }

  Future<void> toggleFeatured(String promptKey, bool isFeatured) {
    return client.post('/api/admin/toggle_featured', <String, dynamic>{
      'key': promptKey,
      'is_featured': isFeatured,
    });
  }

  /// `field` must be `is_premium` or `is_featured` — the route rejects anything
  /// else. Turning premium on carries the unlock [pin] with it.
  Future<void> toggleStatus(String promptKey, String field, bool value, {String? pin}) {
    final Map<String, dynamic> body = <String, dynamic>{
      'key': promptKey,
      'field': field,
      'value': value,
    };
    if (pin != null && pin.isNotEmpty) body['pin'] = pin;
    return client.post('/api/admin/toggle_status', body);
  }

  Future<void> bulkDeletePrompts(List<String> keys) {
    return client.post('/api/admin/delete_prompts_bulk', <String, dynamic>{'keys': keys});
  }

  /// Hiding sets `is_draft`, which is the flag the sitemap already excludes.
  Future<void> bulkHidePrompts(List<String> keys, bool hide) {
    return client.post('/api/admin/hide_prompts_bulk', <String, dynamic>{
      'keys': keys,
      'hide': hide,
    });
  }

  Future<void> reorderPrompts(List<String> orderedKeys) {
    return client.post('/api/admin/reorder_prompts', <String, dynamic>{'orderedKeys': orderedKeys});
  }

  // --- Content --------------------------------------------------------------

  Future<void> saveBlog(Map<String, dynamic> blog) =>
      client.post('/api/admin/save_blog', blog);

  Future<void> saveWallpaper(Map<String, dynamic> wallpaper) =>
      client.post('/api/admin/save_wallpaper', wallpaper);

  Future<void> saveWallpaperCategory(Map<String, dynamic> category) =>
      client.post('/api/admin/save_wallpaper_category', category);

  Future<void> saveCategory(Map<String, dynamic> category) =>
      client.post('/api/admin/save_category', category);

  Future<void> saveWebsiteCategory(Map<String, dynamic> category) =>
      client.post('/api/admin/save_website_category', category);

  Future<void> saveAuthor(Map<String, dynamic> author) =>
      client.post('/api/admin/save_author', author);

  Future<void> saveFaq(Map<String, dynamic> faq) =>
      client.post('/api/admin/save_faq', faq);

  // --- Settings -------------------------------------------------------------

  /// `site_settings` is a key/value table, so this comes back flat rather than
  /// as rows.
  Future<Map<String, dynamic>> settings() async {
    final dynamic data = await client.get('/api/admin/settings');
    return _asMap(data);
  }

  /// Sends only the keys that changed — the route upserts each one, so a
  /// partial map is not a partial wipe.
  Future<void> saveSettings(Map<String, dynamic> values) =>
      client.post('/api/admin/save_settings', values);

  // --- Shaping --------------------------------------------------------------

  /// The list routes answer with `[]` on a database error rather than a 500, so
  /// an unexpected shape here means "nothing to show", not "crash".
  static List<Map<String, dynamic>> _asList(dynamic data) {
    if (data is! List) return <Map<String, dynamic>>[];
    return data
        .whereType<Map<dynamic, dynamic>>()
        .map((Map<dynamic, dynamic> e) => e.cast<String, dynamic>())
        .toList();
  }

  static Map<String, dynamic> _asMap(dynamic data) {
    if (data is Map) return data.cast<String, dynamic>();
    return <String, dynamic>{};
  }
}
