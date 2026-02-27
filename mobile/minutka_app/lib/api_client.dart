// ============================================
// Simple HTTP API client for Minutka backend
// ============================================

import 'dart:convert';

import 'package:http/http.dart' as http;

import 'models.dart';

/// Base URL of your existing backend (Railway)
/// 
/// To set a custom URL when building:
/// flutter build apk --dart-define=API_BASE_URL=https://your-backend.railway.app
/// 
/// Or change the default value below to your actual backend URL
const String apiBaseUrl =
    String.fromEnvironment('API_BASE_URL', defaultValue: 'https://minutka-production.up.railway.app');

class ApiClient {
  final http.Client _client;

  ApiClient({http.Client? client}) : _client = client ?? http.Client();

  Uri _buildUri(String path, [Map<String, String>? query]) {
    return Uri.parse(apiBaseUrl).replace(
      path: path,
      queryParameters: query,
    );
  }

  Future<List<BannerModel>> fetchHomeBanners() async {
    final uri = _buildUri('/api/banners', {'position': 'homepage'});
    final resp = await _client.get(uri);
    if (resp.statusCode != 200) {
      throw Exception('Failed to load banners: ${resp.statusCode}');
    }
    final body = jsonDecode(resp.body) as Map<String, dynamic>;
    final list = (body['data'] as List<dynamic>? ?? const []);
    return list.map((e) => BannerModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  /// Store categories used on main page (same as web main page categories).
  Future<List<StoreCategoryModel>> fetchStoreCategories() async {
    final uri = _buildUri('/api/store-categories', {'all': 'true'});
    final resp = await _client.get(uri);
    if (resp.statusCode != 200) {
      throw Exception('Failed to load categories: ${resp.statusCode}');
    }
    final body = jsonDecode(resp.body) as Map<String, dynamic>;
    final list = (body['data'] as List<dynamic>? ?? const []);
    return list
        .map((e) => StoreCategoryModel.fromJson(e as Map<String, dynamic>))
        .toList()
        .where((c) => c.name.isNotEmpty)
        .toList();
  }

  /// Main page items (is_main_page = true), like on web home page.
  Future<List<MenuItemModel>> fetchMainPageItems() async {
    final uri = _buildUri('/api/menu', {'main_page': 'true'});
    final resp = await _client.get(uri);
    if (resp.statusCode != 200) {
      throw Exception('Failed to load main page items: ${resp.statusCode}');
    }
    final body = jsonDecode(resp.body) as Map<String, dynamic>;
    final list = (body['data'] as List<dynamic>? ?? const []);
    return list.map((e) => MenuItemModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  /// Create order in backend (same endpoint as web app).
  ///
  /// For main page items we always send `restaurant_id: null` and `user_id: null`.
  Future<void> createOrder({
    String? restaurantId,
    required String orderText,
    String? address,
  }) async {
    final uri = _buildUri('/api/orders');
    final payload = <String, dynamic>{
      'restaurant_id': restaurantId, // null for main page
      'user_id': null,
      'order_text': orderText,
      if (address != null && address.isNotEmpty) 'address': address,
    };

    final resp = await _client.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(payload),
    );

    if (resp.statusCode != 200 && resp.statusCode != 201) {
      // Try to parse error body
      try {
        final body = jsonDecode(resp.body) as Map<String, dynamic>;
        final msg = body['error'] ?? body['message'] ?? 'Failed to create order';
        throw Exception('$msg (HTTP ${resp.statusCode})');
      } catch (_) {
        throw Exception('Failed to create order (HTTP ${resp.statusCode})');
      }
    }
  }
}


