import 'package:flutter/material.dart';

import '../core/api_client.dart';
import '../core/app_scope.dart';
import '../core/theme.dart';
import '../core/values.dart';
import '../services/admin_api.dart';
import '../widgets/common.dart';

/// The numbers, and the last month of traffic under them.
///
/// `/api/admin/analytics` answers with one row per day of views, copies and
/// unlocks. Recharts draws that on the web; here it is a hand-drawn sparkline,
/// because a charting package for three series on a 360dp screen is a lot of
/// dependency for one screen.
class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  late final AdminApi _api;

  Map<String, dynamic> _stats = <String, dynamic>{};
  List<Map<String, dynamic>> _series = <Map<String, dynamic>>[];
  String _range = '30';
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _api = AppScope.apiOf(context);
    _load();
  }

  Future<void> _load({bool silent = false}) async {
    if (!silent) setState(() => _loading = true);
    try {
      // The chart failing should not take the stat cards down with it — the
      // analytics table is created lazily and is empty on a fresh install.
      final Map<String, dynamic> stats = await _api.dashboard();
      List<Map<String, dynamic>> series;
      try {
        series = await _api.analytics(days: _range);
      } on ApiException {
        series = <Map<String, dynamic>>[];
      }

      if (!mounted) return;
      setState(() {
        _stats = stats;
        _series = series;
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

  Future<void> _changeRange(String range) async {
    setState(() => _range = range);
    try {
      final List<Map<String, dynamic>> series = await _api.analytics(days: range);
      if (mounted) setState(() => _series = series);
    } on ApiException catch (e) {
      if (mounted) showToast(context, e.message, error: true);
    }
  }

  Future<void> _resetAnalytics() async {
    final bool ok = await confirmDialog(
      context,
      title: 'Clear the traffic history?',
      message: 'Every recorded day of views, copies and unlocks is deleted. '
          'The totals on the cards above come from the prompt rows and are '
          'not affected. This cannot be undone.',
      confirmLabel: 'Clear history',
    );
    if (!ok) return;

    try {
      await _api.resetAnalytics();
      if (!mounted) return;
      showToast(context, 'Traffic history cleared');
      _load(silent: true);
    } on ApiException catch (e) {
      if (mounted) showToast(context, e.message, error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const LoadingState(label: 'Loading stats…');
    if (_error != null) return ErrorStateView(message: _error!, onRetry: _load);

    return RefreshIndicator(
      onRefresh: () => _load(silent: true),
      color: AppTheme.gold,
      backgroundColor: AppTheme.surface,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
        physics: const AlwaysScrollableScrollPhysics(),
        children: <Widget>[
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 1.55,
            children: <Widget>[
              _StatCard(
                label: 'Prompts',
                value: V.compactNumber(_stats['prompts']),
                icon: Icons.bolt_rounded,
                color: AppTheme.gold,
              ),
              _StatCard(
                label: 'Blogs',
                value: V.compactNumber(_stats['blogs']),
                icon: Icons.article_outlined,
                color: AppTheme.info,
              ),
              _StatCard(
                label: 'Views',
                value: V.compactNumber(_stats['views']),
                icon: Icons.visibility_outlined,
                color: const Color(0xFF8B5CF6),
              ),
              _StatCard(
                label: 'Copies',
                value: V.compactNumber(_stats['copies']),
                icon: Icons.copy_rounded,
                color: AppTheme.success,
              ),
              _StatCard(
                label: 'Unlocks',
                value: V.compactNumber(_stats['unlocks']),
                icon: Icons.lock_open_rounded,
                color: const Color(0xFFF97316),
              ),
              _StatCard(
                label: 'Likes',
                value: V.compactNumber(_stats['likes']),
                icon: Icons.favorite_outline_rounded,
                color: const Color(0xFFEC4899),
              ),
            ],
          ),
          const SizedBox(height: 20),
          _TrafficCard(
            series: _series,
            range: _range,
            onRangeChanged: _changeRange,
            onReset: _resetAnalytics,
          ),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
  });

  final String label;
  final String value;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: <Widget>[
            Container(
              padding: const EdgeInsets.all(7),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.14),
                borderRadius: BorderRadius.circular(9),
              ),
              child: Icon(icon, size: 16, color: color),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  value,
                  style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800, height: 1.1),
                ),
                const SizedBox(height: 2),
                Text(
                  label,
                  style: const TextStyle(fontSize: 12, color: AppTheme.textDim),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _TrafficCard extends StatelessWidget {
  const _TrafficCard({
    required this.series,
    required this.range,
    required this.onRangeChanged,
    required this.onReset,
  });

  final List<Map<String, dynamic>> series;
  final String range;
  final ValueChanged<String> onRangeChanged;
  final VoidCallback onReset;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Row(
              children: <Widget>[
                const Expanded(
                  child: Text(
                    'Traffic',
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
                  ),
                ),
                _RangeChip(label: '7d', value: '7', selected: range == '7', onTap: onRangeChanged),
                const SizedBox(width: 6),
                _RangeChip(label: '30d', value: '30', selected: range == '30', onTap: onRangeChanged),
                const SizedBox(width: 6),
                _RangeChip(label: 'All', value: 'all', selected: range == 'all', onTap: onRangeChanged),
                if (series.isNotEmpty)
                  IconButton(
                    tooltip: 'Clear history',
                    onPressed: onReset,
                    visualDensity: VisualDensity.compact,
                    icon: const Icon(Icons.restart_alt_rounded,
                        size: 18, color: AppTheme.textDim),
                  ),
              ],
            ),
            const SizedBox(height: 16),
            if (series.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 28),
                child: Center(
                  child: Text(
                    'No analytics recorded yet.',
                    style: TextStyle(color: AppTheme.textDim, fontSize: 13),
                  ),
                ),
              )
            else ...<Widget>[
              SizedBox(
                height: 150,
                child: CustomPaint(
                  painter: _SparklinePainter(series),
                  size: Size.infinite,
                ),
              ),
              const SizedBox(height: 14),
              Row(
                children: <Widget>[
                  _Legend(color: const Color(0xFF8B5CF6), label: 'Views', series: series, field: 'view'),
                  const SizedBox(width: 16),
                  _Legend(color: AppTheme.success, label: 'Copies', series: series, field: 'copy'),
                  const SizedBox(width: 16),
                  _Legend(color: const Color(0xFFF97316), label: 'Unlocks', series: series, field: 'unlock'),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: <Widget>[
                  Text(
                    V.asString(series.first['date']),
                    style: const TextStyle(color: AppTheme.textDim, fontSize: 11),
                  ),
                  Text(
                    V.asString(series.last['date']),
                    style: const TextStyle(color: AppTheme.textDim, fontSize: 11),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _RangeChip extends StatelessWidget {
  const _RangeChip({
    required this.label,
    required this.value,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final String value;
  final bool selected;
  final ValueChanged<String> onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => onTap(value),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: selected ? AppTheme.gold.withValues(alpha: 0.16) : AppTheme.surfaceHigh,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: selected ? AppTheme.gold : AppTheme.border),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11.5,
            fontWeight: FontWeight.w700,
            color: selected ? AppTheme.gold : AppTheme.textDim,
          ),
        ),
      ),
    );
  }
}

class _Legend extends StatelessWidget {
  const _Legend({
    required this.color,
    required this.label,
    required this.series,
    required this.field,
  });

  final Color color;
  final String label;
  final List<Map<String, dynamic>> series;
  final String field;

  @override
  Widget build(BuildContext context) {
    int total = 0;
    for (final Map<String, dynamic> point in series) {
      total += V.asInt(point[field]);
    }

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: <Widget>[
        Container(
          width: 9,
          height: 9,
          decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(3)),
        ),
        const SizedBox(width: 6),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text(label, style: const TextStyle(fontSize: 10.5, color: AppTheme.textDim)),
            Text(
              V.compactNumber(total),
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
            ),
          ],
        ),
      ],
    );
  }
}

/// Three overlaid lines on a shared scale, with a faint fill under views.
///
/// A shared scale rather than one per series on purpose: unlocks are always a
/// fraction of views, and normalising each line to its own maximum would draw
/// three lines of the same height and imply they are comparable quantities.
class _SparklinePainter extends CustomPainter {
  _SparklinePainter(this.series);

  final List<Map<String, dynamic>> series;

  @override
  void paint(Canvas canvas, Size size) {
    if (series.isEmpty) return;

    int maxValue = 1;
    for (final Map<String, dynamic> point in series) {
      maxValue = <int>[
        maxValue,
        V.asInt(point['view']),
        V.asInt(point['copy']),
        V.asInt(point['unlock']),
      ].reduce((int a, int b) => a > b ? a : b);
    }

    // Four gridlines, drawn first so the series sit on top of them.
    final Paint grid = Paint()
      ..color = AppTheme.border
      ..strokeWidth = 1;
    for (int i = 0; i <= 3; i++) {
      final double y = size.height * i / 3;
      canvas.drawLine(Offset(0, y), Offset(size.width, y), grid);
    }

    _drawSeries(canvas, size, 'view', const Color(0xFF8B5CF6), maxValue, fill: true);
    _drawSeries(canvas, size, 'copy', AppTheme.success, maxValue);
    _drawSeries(canvas, size, 'unlock', const Color(0xFFF97316), maxValue);
  }

  void _drawSeries(
    Canvas canvas,
    Size size,
    String field,
    Color color,
    int maxValue, {
    bool fill = false,
  }) {
    final Path path = Path();
    final int count = series.length;
    // A single day has no line to draw between two points; give it the full
    // width so it renders as a flat mark rather than collapsing onto x = 0.
    final double step = count > 1 ? size.width / (count - 1) : size.width;

    for (int i = 0; i < count; i++) {
      final int value = V.asInt(series[i][field]);
      final double x = count > 1 ? step * i : size.width / 2;
      final double y = size.height - (value / maxValue) * size.height;
      if (i == 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
    }

    if (fill) {
      final Path area = Path.from(path)
        ..lineTo(count > 1 ? size.width : size.width / 2, size.height)
        ..lineTo(count > 1 ? 0 : size.width / 2, size.height)
        ..close();
      canvas.drawPath(
        area,
        Paint()..color = color.withValues(alpha: 0.14),
      );
    }

    canvas.drawPath(
      path,
      Paint()
        ..color = color
        ..strokeWidth = 2
        ..style = PaintingStyle.stroke
        ..strokeJoin = StrokeJoin.round
        ..strokeCap = StrokeCap.round,
    );
  }

  @override
  bool shouldRepaint(covariant _SparklinePainter oldDelegate) {
    return oldDelegate.series != series;
  }
}
