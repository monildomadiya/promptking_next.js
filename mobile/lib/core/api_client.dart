import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

/// Anything the server refused, wrapped so the UI can show the server's own
/// wording instead of a stack trace. The admin routes all answer
/// `{"error": "..."}` on failure, and that string is usually the most useful
/// thing we can put in front of whoever is holding the phone.
class ApiException implements Exception {
  ApiException(this.statusCode, this.message);

  final int statusCode;
  final String message;

  bool get isUnauthorized => statusCode == 401;

  @override
  String toString() => message;
}

/// Transport plus credentials for the `/api/admin` routes.
///
/// The web admin keeps its JWT in localStorage and sends it as `x-admin-token`;
/// lib/auth.js accepts exactly that, so the phone can use the same door without
/// a single server change. The token is held in the platform keystore rather
/// than plain preferences — it is a full admin credential, and a phone is
/// easier to lose than a laptop.
class ApiClient extends ChangeNotifier {
  ApiClient();

  static const FlutterSecureStorage _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );
  static const String _tokenKey = 'pk_admin_token';
  static const String _baseUrlKey = 'pk_base_url';

  final http.Client _http = http.Client();

  String _baseUrl = 'https://promptking.in';
  String? _token;
  bool _restoring = true;

  String get baseUrl => _baseUrl;
  String? get token => _token;
  bool get isRestoring => _restoring;
  bool get isSignedIn => _token != null && _token!.isNotEmpty;

  /// Reads whatever the last session left behind. Called once at startup; until
  /// it finishes the app shows a splash rather than the login form, so a
  /// signed-in admin never sees a flash of the PIN screen on a cold start.
  Future<void> restore() async {
    try {
      _baseUrl = await _storage.read(key: _baseUrlKey) ?? _baseUrl;
      _token = await _storage.read(key: _tokenKey);
    } catch (_) {
      // A wiped or unreadable keystore just means "not signed in".
      _token = null;
    }
    _restoring = false;
    notifyListeners();
  }

  /// Trades the admin PIN for a JWT. [serverUrl] is stored too, so the same
  /// build can point at a laptop running `next dev` or at production.
  Future<void> login({required String serverUrl, required String password}) async {
    final String normalised = normaliseBaseUrl(serverUrl);
    final dynamic res = await _send(
      'POST',
      '/api/admin/login',
      baseUrlOverride: normalised,
      body: <String, dynamic>{'password': password},
      authenticated: false,
    );

    final String? token = res is Map ? res['token'] as String? : null;
    if (token == null || token.isEmpty) {
      throw ApiException(500, 'The server accepted the PIN but sent no token back.');
    }

    _baseUrl = normalised;
    _token = token;
    await _storage.write(key: _baseUrlKey, value: _baseUrl);
    await _storage.write(key: _tokenKey, value: _token);
    notifyListeners();
  }

  Future<void> logout() async {
    _token = null;
    await _storage.delete(key: _tokenKey);
    notifyListeners();
  }

  /// Trailing slashes and a missing scheme are the two things people actually
  /// type, and both produce a 404 that reads like a wrong password.
  static String normaliseBaseUrl(String input) {
    String value = input.trim();
    if (value.isEmpty) return value;
    if (!value.startsWith('http://') && !value.startsWith('https://')) {
      value = 'https://$value';
    }
    while (value.endsWith('/')) {
      value = value.substring(0, value.length - 1);
    }
    return value;
  }

  Future<dynamic> get(String path, {Map<String, String>? query}) {
    return _send('GET', path, query: query);
  }

  Future<dynamic> post(String path, [Object? body]) {
    return _send('POST', path, body: body ?? <String, dynamic>{});
  }

  Future<dynamic> delete(String path) {
    return _send('DELETE', path);
  }

  Future<dynamic> _send(
    String method,
    String path, {
    Object? body,
    Map<String, String>? query,
    String? baseUrlOverride,
    bool authenticated = true,
  }) async {
    final String base = baseUrlOverride ?? _baseUrl;
    if (base.isEmpty) {
      throw ApiException(0, 'No server address is configured.');
    }

    Uri uri = Uri.parse('$base$path');
    if (query != null && query.isNotEmpty) {
      uri = uri.replace(queryParameters: <String, String>{
        ...uri.queryParameters,
        ...query,
      });
    }

    final Map<String, String> headers = <String, String>{'Accept': 'application/json'};
    if (body != null) headers['Content-Type'] = 'application/json';
    if (authenticated && _token != null) headers['x-admin-token'] = _token!;

    http.Response res;
    try {
      final http.Request request = http.Request(method, uri)..headers.addAll(headers);
      if (body != null) request.body = jsonEncode(body);
      final http.StreamedResponse streamed =
          await _http.send(request).timeout(const Duration(seconds: 45));
      res = await http.Response.fromStream(streamed);
    } on SocketException {
      throw ApiException(0, 'Could not reach $base. Check the address and your connection.');
    } on HttpException {
      throw ApiException(0, 'The connection to $base broke mid-request.');
    } catch (e) {
      throw ApiException(0, 'Request failed: $e');
    }

    return _decode(res);
  }

  /// Uploads one image through `/api/admin/upload_image`, which answers with a
  /// Cloudinary URL. The multipart field is named `image` because that is what
  /// the route reads; `upload_logo` wants `logo` instead, hence [field].
  Future<String> uploadImage(
    File file, {
    String path = '/api/admin/upload_image',
    String field = 'image',
    String responseKey = 'imageUrl',
  }) async {
    final Uri uri = Uri.parse('$_baseUrl$path');
    final http.MultipartRequest request = http.MultipartRequest('POST', uri)
      ..headers['Accept'] = 'application/json'
      ..files.add(await http.MultipartFile.fromPath(field, file.path));
    if (_token != null) request.headers['x-admin-token'] = _token!;

    http.Response res;
    try {
      final http.StreamedResponse streamed =
          await request.send().timeout(const Duration(minutes: 3));
      res = await http.Response.fromStream(streamed);
    } on SocketException {
      throw ApiException(0, 'Could not reach the server to upload that image.');
    } catch (e) {
      throw ApiException(0, 'Upload failed: $e');
    }

    final dynamic data = _decode(res);
    final String? url = data is Map ? data[responseKey] as String? : null;
    if (url == null || url.isEmpty) {
      throw ApiException(500, 'The server took the file but returned no URL.');
    }
    return url;
  }

  /// Pulls an image in by URL instead of by file — the phone equivalent of the
  /// web admin's "paste a link" field, and far cheaper on mobile data than
  /// downloading a 6 MB wallpaper only to upload it again.
  Future<String> importImageUrl(String url) async {
    final dynamic data = await post('/api/admin/upload_image_url', <String, dynamic>{'url': url});
    final String? imageUrl = data is Map ? data['imageUrl'] as String? : null;
    if (imageUrl == null || imageUrl.isEmpty) {
      throw ApiException(500, 'The server could not import that URL.');
    }
    return imageUrl;
  }

  dynamic _decode(http.Response res) {
    dynamic data;
    if (res.body.isNotEmpty) {
      try {
        data = jsonDecode(res.body);
      } catch (_) {
        // A Next.js 404 page or an nginx error is HTML, and decoding it would
        // throw a FormatException that says nothing about the real status.
        data = null;
      }
    }

    if (res.statusCode >= 200 && res.statusCode < 300) return data;

    final String? message =
        data is Map ? (data['error'] ?? data['message'])?.toString() : null;

    if (res.statusCode == 401) {
      // The session outlived its 24h JWT, or the PIN changed. Drop the token so
      // the app returns to the login screen instead of failing every screen.
      _token = null;
      _storage.delete(key: _tokenKey);
      notifyListeners();
    }

    throw ApiException(
      res.statusCode,
      message ?? 'Request failed (HTTP ${res.statusCode}).',
    );
  }

  @override
  void dispose() {
    _http.close();
    super.dispose();
  }
}
