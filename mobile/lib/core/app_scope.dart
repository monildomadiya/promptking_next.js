import 'package:flutter/widgets.dart';

import '../services/admin_api.dart';
import 'api_client.dart';

/// Hands the API down the tree.
///
/// One client and one API object for the whole app, reachable as
/// `AppScope.apiOf(context)`. A state-management package would buy nothing
/// here: there is exactly one long-lived object, every screen loads its own
/// rows, and the only thing worth rebuilding on is whether the token is still
/// good — which the root handles by listening to the client directly.
///
/// Both objects are final and never swapped, so lookups deliberately do not
/// register a dependency. That is what makes them safe to call from
/// `initState`, which is where screens kick off their first load.
class AppScope extends InheritedWidget {
  AppScope({
    super.key,
    required this.client,
    required super.child,
  }) : api = AdminApi(client);

  final ApiClient client;
  final AdminApi api;

  static AppScope _of(BuildContext context) {
    final AppScope? scope = context.getInheritedWidgetOfExactType<AppScope>();
    assert(scope != null, 'AppScope is missing above this widget.');
    return scope!;
  }

  /// The API surface — use this from screens.
  static AdminApi apiOf(BuildContext context) => _of(context).api;

  /// The transport, for the auth state and the upload helpers.
  static ApiClient clientOf(BuildContext context) => _of(context).client;

  @override
  bool updateShouldNotify(AppScope oldWidget) => oldWidget.client != client;
}
