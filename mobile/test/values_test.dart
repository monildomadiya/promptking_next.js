import 'package:flutter_test/flutter_test.dart';
import 'package:promptking_admin/core/values.dart';

/// Tests for the coercion layer.
///
/// This is the one piece of the app with logic worth pinning down. Everything
/// else is screens over HTTP, but `V` exists because the same column reaches
/// the phone in four different shapes depending on which route served it, and
/// getting that wrong shows up as a flag that reads false on one screen and
/// true on the next.
void main() {
  group('V.asBool', () {
    test('reads the shapes a tinyint(1) actually arrives in', () {
      // /api/admin/prompts normalises through parseDbBool, so these come as
      // real booleans...
      expect(V.asBool(true), isTrue);
      expect(V.asBool(false), isFalse);

      // ...but /api/admin/blogs hands back SELECT * untouched, so the same
      // flag arrives as a number or a string instead.
      expect(V.asBool(1), isTrue);
      expect(V.asBool(0), isFalse);
      expect(V.asBool('1'), isTrue);
      expect(V.asBool('0'), isFalse);
      expect(V.asBool('true'), isTrue);
      expect(V.asBool('TRUE'), isTrue);

      // MariaDB can send tinyint(1) as a one-element byte buffer.
      expect(V.asBool(<int>[1]), isTrue);
      expect(V.asBool(<int>[0]), isFalse);
    });

    test('a missing column is not true', () {
      expect(V.asBool(null), isFalse);
      expect(V.asBool(''), isFalse);
      expect(V.asBool('nonsense'), isFalse);
    });
  });

  group('V.asJsonList', () {
    test('handles a JSON column whether or not the driver parsed it', () {
      expect(V.asJsonList(<dynamic>['a', 'b']), <dynamic>['a', 'b']);
      expect(V.asJsonList('["a","b"]'), <dynamic>['a', 'b']);
    });

    test('falls back to a comma list, which is how wallpaper tags are stored', () {
      expect(V.asJsonList('sunset, beach, 4k'), <dynamic>['sunset', 'beach', '4k']);
    });

    test('empty and null are an empty list, not a crash', () {
      expect(V.asJsonList(null), isEmpty);
      expect(V.asJsonList(''), isEmpty);
      expect(V.asJsonList('   '), isEmpty);
    });
  });

  group('V.asMapList', () {
    test('reads faqs whether stored as JSON text or already decoded', () {
      const String raw = '[{"question":"Why?","answer":"Because."}]';
      final List<Map<String, dynamic>> parsed = V.asMapList(raw);
      expect(parsed, hasLength(1));
      expect(parsed.first['question'], 'Why?');

      final List<Map<String, dynamic>> passthrough = V.asMapList(<dynamic>[
        <String, dynamic>{'question': 'Q', 'answer': 'A'},
      ]);
      expect(passthrough.first['answer'], 'A');
    });

    test('drops entries that are not objects rather than throwing', () {
      expect(V.asMapList('["just a string"]'), isEmpty);
    });
  });

  group('V.emptyToNull', () {
    test('blank becomes null, because MySQL strict mode rejects empty in INT and DATE', () {
      expect(V.emptyToNull(''), isNull);
      expect(V.emptyToNull('   '), isNull);
      expect(V.emptyToNull(null), isNull);
      expect(V.emptyToNull(' PK001 '), 'PK001');
    });
  });

  group('V.asInt / asIntOrNull', () {
    test('coerces the numeric shapes and keeps the fallback honest', () {
      expect(V.asInt('42'), 42);
      expect(V.asInt(42), 42);
      expect(V.asInt(42.9), 42);
      expect(V.asInt(null), 0);
      expect(V.asInt('not a number', fallback: 7), 7);
    });

    test('asIntOrNull separates "zero" from "not set"', () {
      // sort_order 0 is a real value; an empty width field is not.
      expect(V.asIntOrNull('0'), 0);
      expect(V.asIntOrNull(''), isNull);
      expect(V.asIntOrNull(null), isNull);
    });
  });

  group('V.compactNumber', () {
    test('shortens counts for a narrow screen', () {
      expect(V.compactNumber(0), '0');
      expect(V.compactNumber(999), '999');
      expect(V.compactNumber(1000), '1.0K');
      expect(V.compactNumber(12400), '12.4K');
      expect(V.compactNumber(150000), '150K');
      expect(V.compactNumber(2500000), '2.5M');
    });
  });

  group('V.prettyDate', () {
    test('formats an ISO timestamp', () {
      expect(V.prettyDate('2026-09-23T00:00:00.000Z'), '23 Sep 2026');
      expect(V.prettyDate('2026-01-05'), '5 Jan 2026');
    });

    test('passes through anything it cannot parse instead of losing it', () {
      expect(V.prettyDate(null), '');
      expect(V.prettyDate('not a date'), 'not a date');
    });
  });
}
