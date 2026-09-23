import 'package:flutter/material.dart';

import '../core/api_client.dart';
import '../core/app_scope.dart';
import '../core/theme.dart';
import '../core/values.dart';
import '../services/admin_api.dart';
import '../widgets/common.dart';
import '../widgets/form_kit.dart';
import '../widgets/image_field.dart';

/// Site settings, in the four groups the web panel splits them into.
///
/// `site_settings` is a key/value table and `save_settings` upserts each key it
/// is given, so this sends only what changed. That matters here more than
/// anywhere else in the app: posting the whole map back would let a screen that
/// loaded a stale value quietly overwrite a key somebody edited on the web
/// panel in between.
class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> with SingleTickerProviderStateMixin {
  late final AdminApi _api;
  late final TabController _tabs;

  final Map<String, TextEditingController> _c = <String, TextEditingController>{};

  Map<String, dynamic> _loaded = <String, dynamic>{};
  final Map<String, String> _dirty = <String, String>{};

  String? _logoUrl;
  bool _adsEnabled = false;
  double _sliderPosition = 50;
  bool _loading = true;
  bool _saving = false;
  String? _error;

  static const List<String> _socialKeys = <String>[
    'youtube', 'instagram', 'facebook', 'pinterest',
  ];

  static const List<String> _adSlots = <String>[
    'header', 'sidebar', 'detail', 'footer', 'infeed', 'anchor', 'multiplex',
  ];

  static const List<String> _logoKeys = <String>[
    'logo_width_desktop', 'logo_height_desktop',
    'logo_width_mobile', 'logo_height_mobile',
  ];

  @override
  void initState() {
    super.initState();
    _api = AppScope.apiOf(context);
    _tabs = TabController(length: 4, vsync: this);
    _load();
  }

  @override
  void dispose() {
    _tabs.dispose();
    for (final TextEditingController controller in _c.values) {
      controller.dispose();
    }
    super.dispose();
  }

  /// Controllers are created on demand and seeded from the loaded settings.
  /// Deliberately no listener: reloading assigns `.text` directly, and a
  /// listener would read that as an edit and mark every key dirty.
  TextEditingController _controller(String key) {
    return _c.putIfAbsent(
      key,
      () => TextEditingController(text: V.asString(_loaded[key])),
    );
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final Map<String, dynamic> settings = await _api.settings();
      if (!mounted) return;
      setState(() {
        _loaded = settings;
        _dirty.clear();
        for (final MapEntry<String, TextEditingController> entry in _c.entries) {
          entry.value.text = V.asString(settings[entry.key]);
        }
        _logoUrl = V.asString(settings['logo_url']).isEmpty
            ? null
            : V.asString(settings['logo_url']);
        _adsEnabled = V.asString(settings['adsense_enabled']) == '1';
        _sliderPosition =
            (V.asIntOrNull(settings['slider_default_position']) ?? 50).toDouble().clamp(0, 100);
        _error = null;
        _loading = false;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.message;
        _loading = false;
      });
    }
  }

  /// Records an edit. Rebuilding only when the *count* changes keeps the save
  /// bar's label honest without a setState on every keystroke.
  void _mark(String key, String value) {
    final bool isNewKey = !_dirty.containsKey(key);
    _dirty[key] = value;
    if (isNewKey && mounted) setState(() {});
  }

  Future<void> _save() async {
    if (_dirty.isEmpty) {
      showToast(context, 'Nothing changed yet.');
      return;
    }

    setState(() => _saving = true);
    try {
      await _api.saveSettings(Map<String, dynamic>.from(_dirty));
      if (!mounted) return;
      _loaded = <String, dynamic>{..._loaded, ..._dirty};
      _dirty.clear();
      showToast(context, 'Settings saved');
      setState(() {});
    } on ApiException catch (e) {
      if (mounted) showToast(context, e.message, error: true);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const LoadingState();
    if (_error != null) return ErrorStateView(message: _error!, onRetry: _load);

    return Scaffold(
      body: Column(
        children: <Widget>[
          TabBar(
            controller: _tabs,
            isScrollable: true,
            tabAlignment: TabAlignment.start,
            labelColor: AppTheme.gold,
            unselectedLabelColor: AppTheme.textDim,
            indicatorColor: AppTheme.gold,
            dividerColor: AppTheme.border,
            labelStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
            tabs: const <Widget>[
              Tab(text: 'Branding'),
              Tab(text: 'Social'),
              Tab(text: 'Ads'),
              Tab(text: 'Interface'),
            ],
          ),
          Expanded(
            child: TabBarView(
              controller: _tabs,
              children: <Widget>[
                _brandingTab(),
                _socialTab(),
                _adsTab(),
                _interfaceTab(),
              ],
            ),
          ),
        ],
      ),
      bottomNavigationBar: SaveBar(
        onSave: _save,
        saving: _saving,
        // This screen lives inside the shell, which already owns the bottom
        // inset for its navigation bar.
        includeSafeArea: false,
        label: _dirty.isEmpty ? 'Nothing to save' : 'Save ${_dirty.length} change'
            '${_dirty.length == 1 ? '' : 's'}',
      ),
    );
  }

  Widget _brandingTab() {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
      children: <Widget>[
        FormSection(
          title: 'Logo',
          icon: Icons.image_outlined,
          children: <Widget>[
            ImageField(
              label: 'Logo file',
              value: _logoUrl,
              height: 120,
              // The logo has its own route and its own response key.
              uploadPath: '/api/admin/upload_logo',
              uploadField: 'logo',
              responseKey: 'logoUrl',
              onChanged: (String? url) {
                setState(() => _logoUrl = url);
                _mark('logo_url', url ?? '');
              },
            ),
          ],
        ),
        FormSection(
          title: 'Size',
          icon: Icons.aspect_ratio_rounded,
          subtitle: 'In pixels, as the header renders it',
          children: <Widget>[
            for (final String key in _logoKeys)
              FormTextField(
                label: key
                    .replaceAll('logo_', '')
                    .replaceAll('_', ' on ')
                    .replaceFirstMapped(RegExp(r'^\w'), (Match m) => m[0]!.toUpperCase()),
                controller: _controller(key),
                keyboardType: TextInputType.number,
                onChanged: (String value) => _mark(key, value),
              ),
          ],
        ),
      ],
    );
  }

  Widget _socialTab() {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
      children: <Widget>[
        for (final String key in _socialKeys)
          FormSection(
            title: '${key[0].toUpperCase()}${key.substring(1)}',
            icon: Icons.share_outlined,
            children: <Widget>[
              FormTextField(
                label: 'Display title',
                controller: _controller('${key}_title'),
                hint: 'Subscribe on ${key[0].toUpperCase()}${key.substring(1)}',
                onChanged: (String value) => _mark('${key}_title', value),
              ),
              FormTextField(
                label: 'URL',
                controller: _controller('${key}_url'),
                keyboardType: TextInputType.url,
                textCapitalization: TextCapitalization.none,
                onChanged: (String value) => _mark('${key}_url', value),
              ),
            ],
          ),
      ],
    );
  }

  Widget _adsTab() {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
      children: <Widget>[
        FormSection(
          title: 'AdSense',
          icon: Icons.campaign_outlined,
          children: <Widget>[
            FormSwitchField(
              label: 'Ads enabled',
              value: _adsEnabled,
              icon: Icons.toggle_on_outlined,
              description: 'Turns every slot below on or off at once.',
              onChanged: (bool value) {
                setState(() => _adsEnabled = value);
                _mark('adsense_enabled', value ? '1' : '0');
              },
            ),
            FormTextField(
              label: 'Client ID',
              controller: _controller('adsense_client_id'),
              hint: 'ca-pub-…',
              textCapitalization: TextCapitalization.none,
              onChanged: (String value) => _mark('adsense_client_id', value),
            ),
          ],
        ),
        FormSection(
          title: 'Slots',
          icon: Icons.dashboard_customize_outlined,
          subtitle: 'One AdSense slot ID per placement',
          children: <Widget>[
            for (final String slot in _adSlots)
              FormTextField(
                label: '${slot[0].toUpperCase()}${slot.substring(1)}',
                controller: _controller('adsense_slot_$slot'),
                keyboardType: TextInputType.number,
                onChanged: (String value) => _mark('adsense_slot_$slot', value),
              ),
          ],
        ),
      ],
    );
  }

  Widget _interfaceTab() {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
      children: <Widget>[
        FormSection(
          title: 'Before / after slider',
          icon: Icons.compare_rounded,
          children: <Widget>[
            Row(
              children: <Widget>[
                const Expanded(
                  child: FieldLabel('Default handle position'),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                  decoration: BoxDecoration(
                    color: AppTheme.gold.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(7),
                  ),
                  child: Text(
                    '${_sliderPosition.round()}%',
                    style: const TextStyle(
                      color: AppTheme.gold,
                      fontWeight: FontWeight.w800,
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),
            Slider(
              value: _sliderPosition,
              min: 0,
              max: 100,
              divisions: 100,
              activeColor: AppTheme.gold,
              onChanged: (double value) {
                setState(() => _sliderPosition = value);
                _mark('slider_default_position', value.round().toString());
              },
            ),
            const Text(
              'Where every comparison slider starts on the site. 50% is the default.',
              style: TextStyle(color: AppTheme.textDim, fontSize: 12, height: 1.4),
            ),
          ],
        ),
      ],
    );
  }
}
