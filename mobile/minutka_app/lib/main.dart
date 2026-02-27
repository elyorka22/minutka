// ============================================
// Minutka Flutter App entry point
// ============================================

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'cart_provider.dart';
import 'cart_screen.dart';
import 'home_screen.dart';

void main() {
  runApp(const MinutkaApp());
}

class MinutkaApp extends StatelessWidget {
  const MinutkaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => CartProvider()),
      ],
      child: MaterialApp(
        title: 'Minutka Online Bozor',
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepOrange),
          useMaterial3: true,
        ),
        initialRoute: '/',
        routes: {
          '/': (_) => const HomeScreen(),
          '/cart': (_) => const CartScreen(),
        },
      ),
    );
  }
}



