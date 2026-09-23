import 'package:flutter/material.dart';

import '../core/api_client.dart';
import '../core/app_scope.dart';
import '../core/theme.dart';
import '../widgets/form_kit.dart';

/// PIN entry, plus the server address behind a disclosure.
///
/// The address is hidden by default because it is right the first time and
/// wrong to touch afterwards — but it has to be editable, since the same build
/// gets pointed at a laptop running `next dev` as often as at production.
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final TextEditingController _pin = TextEditingController();
  late final TextEditingController _server;

  bool _busy = false;
  bool _showServer = false;
  bool _obscure = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _server = TextEditingController(text: AppScope.clientOf(context).baseUrl);
  }

  @override
  void dispose() {
    _pin.dispose();
    _server.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final String password = _pin.text.trim();
    if (password.isEmpty) {
      setState(() => _error = 'Enter the admin PIN.');
      return;
    }

    setState(() {
      _busy = true;
      _error = null;
    });

    try {
      await AppScope.clientOf(context).login(
        serverUrl: _server.text,
        password: password,
      );
      // The gate in main.dart is listening and swaps in the panel; there is
      // nothing to navigate to from here.
    } on ApiException catch (e) {
      setState(() {
        // A 401 from this route means one thing only, and "Invalid PIN" reads
        // better than the raw body.
        _error = e.isUnauthorized ? 'That PIN was not accepted.' : e.message;
      });
    } catch (e) {
      setState(() => _error = 'Could not sign in: $e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: <Widget>[
                  Container(
                    width: 64,
                    height: 64,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: AppTheme.gold.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: AppTheme.gold.withValues(alpha: 0.3)),
                    ),
                    child: const Icon(Icons.workspace_premium_rounded,
                        size: 32, color: AppTheme.gold),
                  ),
                  const SizedBox(height: 24),
                  const Text(
                    'PromptKing Admin',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Sign in with the admin PIN to manage the site.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: AppTheme.textDim, height: 1.4),
                  ),
                  const SizedBox(height: 32),

                  TextField(
                    controller: _pin,
                    obscureText: _obscure,
                    autofocus: true,
                    textInputAction: TextInputAction.go,
                    onSubmitted: (_) => _submit(),
                    textCapitalization: TextCapitalization.none,
                    decoration: InputDecoration(
                      hintText: 'Admin PIN',
                      prefixIcon: const Icon(Icons.lock_outline_rounded,
                          size: 20, color: AppTheme.textDim),
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                          size: 20,
                          color: AppTheme.textDim,
                        ),
                        onPressed: () => setState(() => _obscure = !_obscure),
                      ),
                    ),
                  ),

                  if (_error != null) ...<Widget>[
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppTheme.danger.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: AppTheme.danger.withValues(alpha: 0.35)),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: <Widget>[
                          const Icon(Icons.error_outline_rounded,
                              size: 18, color: AppTheme.danger),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              _error!,
                              style: const TextStyle(
                                  color: AppTheme.danger, fontSize: 13, height: 1.4),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],

                  const SizedBox(height: 20),
                  FilledButton(
                    onPressed: _busy ? null : _submit,
                    child: _busy
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                                strokeWidth: 2.2, color: Color(0xFF1A1206)),
                          )
                        : const Text('Sign in'),
                  ),

                  const SizedBox(height: 16),
                  TextButton.icon(
                    onPressed: () => setState(() => _showServer = !_showServer),
                    icon: Icon(
                      _showServer ? Icons.expand_less_rounded : Icons.dns_outlined,
                      size: 18,
                    ),
                    label: Text(_showServer ? 'Hide server address' : 'Change server address'),
                  ),

                  if (_showServer) ...<Widget>[
                    const SizedBox(height: 8),
                    FormTextField(
                      label: 'Server',
                      controller: _server,
                      hint: 'https://promptking.in',
                      keyboardType: TextInputType.url,
                      textCapitalization: TextCapitalization.none,
                      helper: 'Production is https://promptking.in. For a laptop running '
                          'next dev, use its LAN address — http://192.168.x.x:3000 — not '
                          'localhost, which on a phone means the phone itself.',
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
