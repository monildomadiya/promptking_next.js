import 'package:flutter/material.dart';

/// The panel's look: a dark surface with the PromptKing gold on top of it.
///
/// Dark by default rather than by system preference — this is a tool that gets
/// opened at odd hours on a phone, and a white full-screen form at 1am is its
/// own kind of bug.
class AppTheme {
  const AppTheme._();

  static const Color gold = Color(0xFFE8B14C);
  static const Color goldDim = Color(0xFF8A6A2A);
  static const Color bg = Color(0xFF0E1015);
  static const Color surface = Color(0xFF171A21);
  static const Color surfaceHigh = Color(0xFF1F232C);
  static const Color border = Color(0xFF2A2F3A);
  static const Color textMain = Color(0xFFE9ECF2);
  static const Color textDim = Color(0xFF9AA3B2);
  static const Color danger = Color(0xFFE5484D);
  static const Color success = Color(0xFF30A46C);
  static const Color info = Color(0xFF3B82F6);

  static ThemeData build() {
    const ColorScheme scheme = ColorScheme.dark(
      primary: gold,
      onPrimary: Color(0xFF1A1206),
      secondary: info,
      surface: surface,
      onSurface: textMain,
      error: danger,
    );

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: scheme,
      scaffoldBackgroundColor: bg,
      canvasColor: bg,
      dividerColor: border,
      appBarTheme: const AppBarTheme(
        backgroundColor: bg,
        foregroundColor: textMain,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          color: textMain,
          fontSize: 19,
          fontWeight: FontWeight.w700,
        ),
      ),
      cardTheme: CardThemeData(
        color: surface,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: border),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surfaceHigh,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        hintStyle: const TextStyle(color: Color(0xFF6B7484)),
        labelStyle: const TextStyle(color: textDim),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: gold, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: danger),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: danger, width: 1.5),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: gold,
          foregroundColor: const Color(0xFF1A1206),
          minimumSize: const Size(0, 50),
          textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: textMain,
          minimumSize: const Size(0, 48),
          side: const BorderSide(color: border),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(foregroundColor: gold),
      ),
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: gold,
        foregroundColor: Color(0xFF1A1206),
      ),
      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith<Color>((Set<WidgetState> states) {
          return states.contains(WidgetState.selected) ? gold : const Color(0xFF6B7484);
        }),
        trackColor: WidgetStateProperty.resolveWith<Color>((Set<WidgetState> states) {
          return states.contains(WidgetState.selected) ? goldDim : surfaceHigh;
        }),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: surfaceHigh,
        side: const BorderSide(color: border),
        labelStyle: const TextStyle(color: textDim, fontSize: 12),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: surfaceHigh,
        contentTextStyle: const TextStyle(color: textMain),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
      ),
      listTileTheme: const ListTileThemeData(
        iconColor: textDim,
        textColor: textMain,
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: surface,
        indicatorColor: goldDim.withValues(alpha: 0.35),
        labelTextStyle: WidgetStateProperty.all(
          const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
        ),
      ),
      progressIndicatorTheme: const ProgressIndicatorThemeData(color: gold),
    );
  }
}
