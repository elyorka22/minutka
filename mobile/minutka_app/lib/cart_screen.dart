// ============================================
// Simple cart screen (summary only, no order sending yet)
// ============================================

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import 'api_client.dart';
import 'cart_provider.dart';

final _currencyFormatter = NumberFormat.decimalPattern('uz_UZ');

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();
  final _notesController = TextEditingController();

  String _deliveryType = 'standard'; // 'standard' or 'express'
  bool _submitting = false;

  final _api = const ApiClient();

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _submitOrder(BuildContext context) async {
    final cart = context.read<CartProvider>();
    if (cart.items.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Savatcha bo\'sh')),
      );
      return;
    }
    if (!_formKey.currentState!.validate()) return;

    setState(() => _submitting = true);
    try {
      final name = _nameController.text.trim();
      final phone = _phoneController.text.trim();
      final address = _addressController.text.trim();
      final notes = _notesController.text.trim();

      // Формируем текст заказа так же, как на вебе
      final buf = StringBuffer()
        ..writeln('🍽️ Minutka mobil ilovadan buyurtma')
        ..writeln();

      for (final cartItem in cart.items) {
        final item = cartItem.item;
        final price = item.effectivePrice;
        buf.writeln(
            '${item.name} x${cartItem.quantity} - ${_currencyFormatter.format(price * cartItem.quantity)} so\'m');
      }

      buf.writeln();
      buf.writeln('💰 Jami: ${_currencyFormatter.format(cart.totalPrice)} so\'m');

      if (name.isNotEmpty) {
        buf.writeln();
        buf.writeln('👤 Ism: $name');
      }
      if (phone.isNotEmpty) {
        buf.writeln('📞 Telefon: $phone');
      }
      if (address.isNotEmpty) {
        buf.writeln('📍 Manzil: $address');
      }

      if (_deliveryType == 'express') {
        buf.writeln('\n🚚 Yetkazib berish turi: EKSPRESS (pullik)');
      } else {
        buf.writeln('\n🚚 Yetkazib berish turi: Oddiy (bepul)');
      }

      if (notes.isNotEmpty) {
        buf.writeln('\n📝 Izoh: $notes');
      }

      await _api.createOrder(
        restaurantId: null, // main page items
        orderText: buf.toString(),
        address: address.isEmpty ? null : address,
      );

      cart.clear();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Buyurtma muvaffaqiyatli yuborildi!')),
        );
        Navigator.of(context).pop(); // back to home
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Xatolik: $e')),
      );
    } finally {
      if (mounted) {
        setState(() => _submitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final cart = context.watch<CartProvider>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Savatcha'),
      ),
      body: cart.items.isEmpty
          ? const Center(child: Text('Savatcha bo\'sh'))
          : Column(
              children: [
                Expanded(
                  child: ListView.separated(
                    padding: const EdgeInsets.all(12),
                    itemCount: cart.items.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (context, index) {
                      final cartItem = cart.items[index];
                      final item = cartItem.item;
                      return Card(
                        child: ListTile(
                          leading: item.imageUrl != null
                              ? ClipRRect(
                                  borderRadius: BorderRadius.circular(8),
                                  child: Image.network(
                                    item.imageUrl!,
                                    width: 56,
                                    height: 56,
                                    fit: BoxFit.cover,
                                  ),
                                )
                              : const Icon(Icons.image_not_supported),
                          title: Text(item.name),
                          subtitle: Text(
                            '${cartItem.quantity} × ${_currencyFormatter.format(item.effectivePrice)} so\'m',
                          ),
                          trailing: Text(
                            '${_currencyFormatter.format(item.effectivePrice * cartItem.quantity)} so\'m',
                          ),
                        ),
                      );
                    },
                  ),
                ),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.surface,
                    boxShadow: const [
                      BoxShadow(
                        blurRadius: 6,
                        color: Colors.black12,
                      ),
                    ],
                  ),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Jami:',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Text(
                              '${_currencyFormatter.format(cart.totalPrice)} so\'m',
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: Colors.deepOrange,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: _nameController,
                          decoration: const InputDecoration(
                            labelText: 'Ism (ixtiyoriy)',
                          ),
                        ),
                        const SizedBox(height: 8),
                        TextFormField(
                          controller: _phoneController,
                          keyboardType: TextInputType.phone,
                          decoration: const InputDecoration(
                            labelText: 'Telefon (+998...)',
                          ),
                          validator: (value) {
                            final v = value?.replaceAll(RegExp(r'[^0-9]'), '') ?? '';
                            if (v.length < 9) {
                              return 'Telefon raqamini to\'liq kiriting';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 8),
                        TextFormField(
                          controller: _addressController,
                          decoration: const InputDecoration(
                            labelText: 'Manzil',
                          ),
                          maxLines: 2,
                          validator: (value) {
                            if (value == null || value.trim().isEmpty) {
                              return 'Manzilni kiriting';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 8),
                        TextFormField(
                          controller: _notesController,
                          decoration: const InputDecoration(
                            labelText: 'Izoh (ixtiyoriy)',
                          ),
                          maxLines: 2,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Yetkazib berish turi',
                          style: Theme.of(context)
                              .textTheme
                              .bodySmall
                              ?.copyWith(fontWeight: FontWeight.w600),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Expanded(
                              child: OutlinedButton(
                                onPressed: () => setState(() {
                                  _deliveryType = 'standard';
                                }),
                                style: OutlinedButton.styleFrom(
                                  backgroundColor: _deliveryType == 'standard'
                                      ? Colors.green.shade500
                                      : null,
                                  foregroundColor: _deliveryType == 'standard'
                                      ? Colors.white
                                      : null,
                                ),
                                child: const Text('Oddiy (bepul)'),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: OutlinedButton(
                                onPressed: () => setState(() {
                                  _deliveryType = 'express';
                                }),
                                style: OutlinedButton.styleFrom(
                                  backgroundColor: _deliveryType == 'express'
                                      ? Colors.orange.shade500
                                      : null,
                                  foregroundColor: _deliveryType == 'express'
                                      ? Colors.white
                                      : null,
                                ),
                                child: const Text('Ekspress (pullik)'),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        ElevatedButton(
                          onPressed: _submitting ? null : () => _submitOrder(context),
                          child: _submitting
                              ? const SizedBox(
                                  height: 20,
                                  width: 20,
                                  child: CircularProgressIndicator(strokeWidth: 2),
                                )
                              : const Text('Buyurtma berish'),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
    );
  }
}


