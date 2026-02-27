// ============================================
// Common models for Minutka Flutter app
// ============================================

class BannerModel {
  final String id;
  final String? title;
  final String? imageUrl;
  final String? linkUrl;

  BannerModel({
    required this.id,
    this.title,
    this.imageUrl,
    this.linkUrl,
  });

  factory BannerModel.fromJson(Map<String, dynamic> json) {
    return BannerModel(
      id: json['id']?.toString() ?? '',
      title: json['title'] as String?,
      imageUrl: json['image_url'] as String?,
      linkUrl: json['link_url'] as String?,
    );
  }
}

class StoreCategoryModel {
  final String id;
  final String name;
  final String? imageUrl;

  StoreCategoryModel({
    required this.id,
    required this.name,
    this.imageUrl,
  });

  factory StoreCategoryModel.fromJson(Map<String, dynamic> json) {
    return StoreCategoryModel(
      id: (json['id'] ?? json['name'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      imageUrl: json['image_url'] as String?,
    );
  }
}

class MenuItemModel {
  final String id;
  final String name;
  final String? description;
  final int price;
  final String? imageUrl;
  final bool isAvailable;
  final int? discountPercent;

  const MenuItemModel({
    required this.id,
    required this.name,
    this.description,
    required this.price,
    this.imageUrl,
    required this.isAvailable,
    this.discountPercent,
  });

  factory MenuItemModel.fromJson(Map<String, dynamic> json) {
    return MenuItemModel(
      id: json['id']?.toString() ?? '',
      name: (json['name'] ?? '').toString(),
      description: json['description'] as String?,
      price: (json['price'] as num?)?.toInt() ?? 0,
      imageUrl: json['image_url'] as String?,
      isAvailable: (json['is_available'] as bool?) ?? true,
      discountPercent: (json['discount_percent'] as num?)?.toInt(),
    );
  }

  int get effectivePrice {
    if (discountPercent != null && discountPercent! > 0) {
      return (price * (100 - discountPercent!) / 100).round();
    }
    return price;
  }
}



