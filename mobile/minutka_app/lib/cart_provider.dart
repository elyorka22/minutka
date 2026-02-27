// ============================================
// Simple cart provider using ChangeNotifier
// ============================================

import 'package:flutter/foundation.dart';

import 'models.dart';

class CartItem {
  final MenuItemModel item;
  int quantity;

  CartItem({required this.item, this.quantity = 1});
}

class CartProvider extends ChangeNotifier {
  final Map<String, CartItem> _items = {};

  List<CartItem> get items => _items.values.toList();

  int get totalItems => _items.values.fold(0, (sum, e) => sum + e.quantity);

  int get totalPrice =>
      _items.values.fold(0, (sum, e) => sum + e.quantity * e.item.effectivePrice);

  void addItem(MenuItemModel item) {
    final existing = _items[item.id];
    if (existing != null) {
      existing.quantity += 1;
    } else {
      _items[item.id] = CartItem(item: item, quantity: 1);
    }
    notifyListeners();
  }

  void updateQuantity(String id, int quantity) {
    final existing = _items[id];
    if (existing == null) return;
    if (quantity <= 0) {
      _items.remove(id);
    } else {
      existing.quantity = quantity;
    }
    notifyListeners();
  }

  void remove(String id) {
    _items.remove(id);
    notifyListeners();
  }

  void clear() {
    _items.clear();
    notifyListeners();
  }
}



