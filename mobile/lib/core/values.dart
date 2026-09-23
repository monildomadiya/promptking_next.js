import 'dart:convert';

/// Coercion helpers for rows that came out of MySQL through a JSON route.
///
/// The same column reaches the phone as `1`, `"1"`, `true` or `null` depending
/// on the driver, the route and whether that route bothered to normalise it —
/// `/api/admin/prompts` runs its booleans through `parseDbBool`, but
/// `/api/admin/blogs` hands back `SELECT *` untouched. Reading a flag with
/// `row['is_draft'] == true` therefore works on one screen and silently fails
/// on the next, so nothing in this app reads a raw value directly.
class V {
  const V._();

  static bool asBool(dynamic value) {
    if (value == null) return false;
    if (value is bool) return value;
    if (value is num) return value != 0;
    if (value is String) {
      final String v = value.trim().toLowerCase();
      return v == '1' || v == 'true' || v == 'yes';
    }
    // MariaDB tinyint(1) can arrive as a one-element byte list.
    if (value is List && value.isNotEmpty) return asBool(value.first);
    return false;
  }

  static String asString(dynamic value, {String fallback = ''}) {
    if (value == null) return fallback;
    if (value is String) return value;
    return value.toString();
  }

  static int asInt(dynamic value, {int fallback = 0}) {
    if (value == null) return fallback;
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse(value.toString().trim()) ?? fallback;
  }

  static int? asIntOrNull(dynamic value) {
    if (value == null) return null;
    if (value is int) return value;
    if (value is num) return value.toInt();
    final String text = value.toString().trim();
    if (text.isEmpty) return null;
    return int.tryParse(text);
  }

  /// Columns like `prompts.sub_prompts` and `blogs.faqs` hold JSON text, and
  /// whether it arrives parsed or as a string depends on the column type the
  /// migration happened to use.
  static List<dynamic> asJsonList(dynamic value) {
    if (value == null) return <dynamic>[];
    if (value is List) return value;
    if (value is String) {
      final String text = value.trim();
      if (text.isEmpty) return <dynamic>[];
      try {
        final dynamic decoded = jsonDecode(text);
        if (decoded is List) return decoded;
      } catch (_) {
        // Not JSON — a comma list is the other thing that lands in these
        // columns (wallpaper tags, for one).
        return text.split(',').map((String s) => s.trim()).where((String s) => s.isNotEmpty).toList();
      }
    }
    return <dynamic>[];
  }

  static List<Map<String, dynamic>> asMapList(dynamic value) {
    return asJsonList(value)
        .whereType<Map<dynamic, dynamic>>()
        .map((Map<dynamic, dynamic> e) => e.cast<String, dynamic>())
        .toList();
  }

  /// `''` and `null` mean the same thing to every one of these routes, and
  /// sending `''` into an INT or DATE column is what trips MySQL strict mode.
  static dynamic emptyToNull(String? value) {
    if (value == null) return null;
    final String trimmed = value.trim();
    return trimmed.isEmpty ? null : trimmed;
  }

  /// Turns `2026-09-23T00:00:00.000Z` into `23 Sep 2026` without pulling in
  /// intl for four lines of work.
  static String prettyDate(dynamic value) {
    if (value == null) return '';
    final DateTime? parsed = DateTime.tryParse(value.toString());
    if (parsed == null) return value.toString();
    const List<String> months = <String>[
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return '${parsed.day} ${months[parsed.month - 1]} ${parsed.year}';
  }

  /// 12400 reads better as 12.4K on a 360dp phone.
  static String compactNumber(dynamic value) {
    final int n = asInt(value);
    if (n < 1000) return '$n';
    if (n < 1000000) {
      final double k = n / 1000;
      return '${k.toStringAsFixed(k >= 100 ? 0 : 1)}K';
    }
    final double m = n / 1000000;
    return '${m.toStringAsFixed(m >= 100 ? 0 : 1)}M';
  }
}
