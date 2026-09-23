import 'package:flutter/material.dart';

import '../core/api_client.dart';
import '../core/app_scope.dart';
import '../core/theme.dart';
import '../core/values.dart';
import '../services/admin_api.dart';
import '../widgets/common.dart';

/// The users table, read-only.
///
/// There is no `save_user` or `delete_user` route, and inventing one from a
/// phone app is not the place to start — so this shows what the table holds
/// and nothing more. Rows render from whatever columns come back rather than a
/// fixed set, because the schema here has changed more than once.
class UsersScreen extends StatefulWidget {
  const UsersScreen({super.key});

  @override
  State<UsersScreen> createState() => _UsersScreenState();
}

class _UsersScreenState extends State<UsersScreen> {
  late final AdminApi _api;

  List<Map<String, dynamic>> _rows = <Map<String, dynamic>>[];
  String _query = '';
  bool _loading = true;
  String? _error;

  /// The first of these that a row actually has becomes its headline.
  static const List<String> _nameFields = <String>['name', 'email', 'username', 'full_name'];

  @override
  void initState() {
    super.initState();
    _api = AppScope.apiOf(context);
    _load();
  }

  Future<void> _load({bool silent = false}) async {
    if (!silent) setState(() => _loading = true);
    try {
      final List<Map<String, dynamic>> rows = await _api.list('users');
      if (!mounted) return;
      setState(() {
        _rows = rows;
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

  static String _initial(String name) {
    final String trimmed = name.trim();
    return trimmed.isEmpty ? '?' : trimmed.substring(0, 1).toUpperCase();
  }

  static String _headline(Map<String, dynamic> row) {
    for (final String field in _nameFields) {
      final String value = V.asString(row[field]);
      if (value.isNotEmpty) return value;
    }
    return 'User ${V.asString(row['id'])}';
  }

  List<Map<String, dynamic>> get _visible {
    final String needle = _query.toLowerCase().trim();
    if (needle.isEmpty) return _rows;
    return _rows.where((Map<String, dynamic> row) {
      return row.values.any(
        (dynamic value) => V.asString(value).toLowerCase().contains(needle),
      );
    }).toList();
  }

  void _showRow(Map<String, dynamic> row) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (BuildContext ctx) => DraggableScrollableSheet(
        expand: false,
        initialChildSize: 0.6,
        maxChildSize: 0.9,
        builder: (BuildContext ctx, ScrollController controller) => ListView(
          controller: controller,
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
          children: <Widget>[
            Text(
              _headline(row),
              style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 16),
            for (final MapEntry<String, dynamic> entry in row.entries)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text(
                      entry.key,
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.textDim,
                      ),
                    ),
                    const SizedBox(height: 2),
                    SelectableText(
                      V.asString(entry.value, fallback: '—'),
                      style: const TextStyle(fontSize: 13.5, height: 1.4),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: <Widget>[
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
          child: SearchBarField(
            hint: 'Search users',
            onChanged: (String value) => setState(() => _query = value),
          ),
        ),
        Expanded(child: _buildBody()),
      ],
    );
  }

  Widget _buildBody() {
    if (_loading) return const LoadingState();
    if (_error != null) return ErrorStateView(message: _error!, onRetry: _load);
    if (_rows.isEmpty) {
      return const EmptyState(
        icon: Icons.people_outline_rounded,
        title: 'No users',
        message: 'The users table is empty.',
      );
    }

    final List<Map<String, dynamic>> rows = _visible;
    if (rows.isEmpty) {
      return const EmptyState(
        icon: Icons.search_off_rounded,
        title: 'No matches',
        message: 'No user matches that search.',
      );
    }

    return RefreshIndicator(
      onRefresh: () => _load(silent: true),
      color: AppTheme.gold,
      backgroundColor: AppTheme.surface,
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 32),
        physics: const AlwaysScrollableScrollPhysics(),
        itemCount: rows.length,
        separatorBuilder: (_, __) => const SizedBox(height: 10),
        itemBuilder: (BuildContext context, int index) {
          final Map<String, dynamic> row = rows[index];
          final String created = V.prettyDate(row['created_at'] ?? row['createdAt']);
          return Card(
            child: ListTile(
              onTap: () => _showRow(row),
              leading: CircleAvatar(
                backgroundColor: AppTheme.surfaceHigh,
                child: Text(
                  _initial(_headline(row)),
                  style: const TextStyle(
                    color: AppTheme.gold,
                    fontWeight: FontWeight.w800,
                    fontSize: 15,
                  ),
                ),
              ),
              title: Text(
                _headline(row),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
              ),
              subtitle: created.isEmpty
                  ? null
                  : Text(
                      'Joined $created',
                      style: const TextStyle(fontSize: 11.5, color: AppTheme.textDim),
                    ),
              trailing: const Icon(Icons.chevron_right_rounded, color: AppTheme.textDim),
            ),
          );
        },
      ),
    );
  }
}
