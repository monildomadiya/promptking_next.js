import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'core/api_client.dart';
import 'core/app_scope.dart';
import 'core/theme.dart';
import 'screens/login_screen.dart';
import 'screens/shell_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.light,
    systemNavigationBarColor: AppTheme.surface,
    systemNavigationBarIconBrightness: Brightness.light,
  ));

  final ApiClient client = ApiClient();
  // Restoring reads the keystore, which is async. The gate below shows a
  // splash until it lands rather than blocking main().
  client.restore();

  runApp(PromptKingAdminApp(client: client));
}

class PromptKingAdminApp extends StatelessWidget {
  const PromptKingAdminApp({super.key, required this.client});

  final ApiClient client;

  @override
  Widget build(BuildContext context) {
    return AppScope(
      client: client,
      child: MaterialApp(
        title: 'PromptKing Admin',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.build(),
        home: const _AuthGate(),
      ),
    );
  }
}

/// Splash while the token is read, then either the login form or the panel.
///
/// This also catches the other direction: when a request comes back 401 the
/// client drops the token and notifies, and every screen stacked above here is
/// torn down in favour of the login form. Without that, an expired session
/// leaves the admin tapping Save on a form that will never save.
class _AuthGate extends StatefulWidget {
  const _AuthGate();

  @override
  State<_AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends State<_AuthGate> {
  late final ApiClient _client;

  @override
  void initState() {
    super.initState();
    // AppScope holds a final client and registers no dependency, so reading it
    // here rather than in didChangeDependencies is safe and runs once.
    _client = AppScope.clientOf(context);
    _client.addListener(_onAuthChanged);
  }

  void _onAuthChanged() {
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    _client.removeListener(_onAuthChanged);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_client.isRestoring) {
      return const Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: <Widget>[
              Icon(Icons.workspace_premium_rounded, size: 52, color: AppTheme.gold),
              SizedBox(height: 20),
              SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(strokeWidth: 2.2),
              ),
            ],
          ),
        ),
      );
    }

    return _client.isSignedIn ? const ShellScreen() : const LoginScreen();
  }
}
