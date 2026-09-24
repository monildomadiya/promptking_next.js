import 'package:flutter/material.dart';

import '../core/app_scope.dart';
import '../core/theme.dart';
import '../core/values.dart';
import '../widgets/common.dart';
import 'blog_editor.dart';
import 'collection_screen.dart';
import 'dashboard_screen.dart';
import 'prompts_screen.dart';
import 'settings_screen.dart';
import 'simple_editors.dart';
import 'users_screen.dart';
import 'wallpapers_screen.dart';

/// Every section of the panel.
enum Section {
  dashboard,
  prompts,
  listicles,
  wallpapers,
  wallpaperCategories,
  blogs,
  authors,
  faqs,
  categories,
  websiteCategories,
  users,
  settings,
}

/// The frame: a bottom bar for the four sections anyone opens daily, and a
/// drawer for the rest.
///
/// The web panel has a sidebar with fourteen entries, which on a phone would
/// be a full screen of menu before any work starts. The split is by how often
/// a thing is actually touched from a phone — prompts and wallpapers get a
/// thumb-reachable tab; website categories do not.
class ShellScreen extends StatefulWidget {
  const ShellScreen({super.key});

  @override
  State<ShellScreen> createState() => _ShellScreenState();
}

class _ShellScreenState extends State<ShellScreen> {
  Section _section = Section.dashboard;

  static const List<Section> _bottomBar = <Section>[
    Section.dashboard,
    Section.prompts,
    Section.wallpapers,
    Section.blogs,
  ];

  void _go(Section section) {
    if (_section != section) setState(() => _section = section);
  }

  Future<void> _logout() async {
    final bool ok = await confirmDialog(
      context,
      title: 'Sign out?',
      message: 'You will need the admin PIN to get back in.',
      confirmLabel: 'Sign out',
      destructive: false,
    );
    if (!ok) return;
    if (!mounted) return;
    await AppScope.clientOf(context).logout();
  }

  @override
  Widget build(BuildContext context) {
    final _SectionInfo info = _info(_section);
    final int bottomIndex = _bottomBar.indexOf(_section);

    return Scaffold(
      appBar: AppBar(
        title: Text(info.label),
        actions: <Widget>[
          IconButton(
            tooltip: 'Sign out',
            onPressed: _logout,
            icon: const Icon(Icons.logout_rounded, size: 20),
          ),
        ],
      ),
      drawer: _buildDrawer(),
      // A key per section so switching sections tears the old screen down and
      // lets the new one run its own initState load, rather than reusing state
      // from a screen that was listing something else.
      body: KeyedSubtree(key: ValueKey<Section>(_section), child: _buildBody(_section)),
      bottomNavigationBar: NavigationBar(
        selectedIndex: bottomIndex < 0 ? 0 : bottomIndex,
        onDestinationSelected: (int index) => _go(_bottomBar[index]),
        destinations: _bottomBar.map((Section section) {
          final _SectionInfo item = _info(section);
          return NavigationDestination(
            icon: Icon(item.icon),
            selectedIcon: Icon(item.icon, color: AppTheme.gold),
            label: item.short,
          );
        }).toList(),
      ),
    );
  }

  Widget _buildDrawer() {
    return Drawer(
      backgroundColor: AppTheme.surface,
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(vertical: 12),
          children: <Widget>[
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 18),
              child: Row(
                children: <Widget>[
                  Container(
                    width: 38,
                    height: 38,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: AppTheme.gold.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(11),
                    ),
                    child: const Icon(Icons.workspace_premium_rounded,
                        size: 20, color: AppTheme.gold),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: <Widget>[
                        const Text(
                          'PromptKing',
                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
                        ),
                        Text(
                          Uri.parse(AppScope.clientOf(context).baseUrl).host,
                          style: const TextStyle(fontSize: 11.5, color: AppTheme.textDim),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const Divider(height: 1),
            _drawerGroup('Content'),
            for (final Section section in <Section>[
              Section.dashboard,
              Section.prompts,
              Section.listicles,
              Section.blogs,
            ])
              _drawerItem(section),
            _drawerGroup('Wallpapers'),
            for (final Section section in <Section>[
              Section.wallpapers,
              Section.wallpaperCategories,
            ])
              _drawerItem(section),
            _drawerGroup('Taxonomy & people'),
            for (final Section section in <Section>[
              Section.categories,
              Section.websiteCategories,
              Section.authors,
              Section.faqs,
              Section.users,
            ])
              _drawerItem(section),
            _drawerGroup('Site'),
            _drawerItem(Section.settings),
            const Divider(height: 24),
            ListTile(
              leading: const Icon(Icons.logout_rounded, color: AppTheme.danger),
              title: const Text('Sign out', style: TextStyle(color: AppTheme.danger)),
              onTap: () {
                Navigator.of(context).pop();
                _logout();
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _drawerGroup(String label) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 6),
      child: Text(
        label.toUpperCase(),
        style: const TextStyle(
          fontSize: 10.5,
          fontWeight: FontWeight.w800,
          color: AppTheme.textDim,
          letterSpacing: 0.8,
        ),
      ),
    );
  }

  Widget _drawerItem(Section section) {
    final _SectionInfo info = _info(section);
    final bool selected = _section == section;

    return ListTile(
      dense: true,
      selected: selected,
      selectedTileColor: AppTheme.gold.withValues(alpha: 0.08),
      leading: Icon(info.icon, size: 20, color: selected ? AppTheme.gold : AppTheme.textDim),
      title: Text(
        info.label,
        style: TextStyle(
          fontSize: 14,
          fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
          color: selected ? AppTheme.gold : AppTheme.textMain,
        ),
      ),
      onTap: () {
        Navigator.of(context).pop();
        _go(section);
      },
    );
  }

  Widget _buildBody(Section section) {
    switch (section) {
      case Section.dashboard:
        return const DashboardScreen();

      case Section.prompts:
        return const PromptsScreen();

      case Section.listicles:
        return const PromptsScreen(listicles: true);

      case Section.wallpapers:
        return const WallpapersScreen();

      case Section.users:
        return const UsersScreen();

      case Section.settings:
        return const SettingsScreen();

      case Section.blogs:
        return CollectionScreen(
          spec: CollectionSpec(
            title: 'Blogs',
            endpoint: 'blogs',
            deleteType: 'blog',
            icon: Icons.article_outlined,
            createLabel: 'New post',
            searchFields: const <String>['title', 'slug', 'category', 'excerpt'],
            titleOf: (Map<String, dynamic> row) =>
                V.asString(row['title'], fallback: 'Untitled'),
            subtitleOf: (Map<String, dynamic> row) {
              final String author = V.asString(row['author_name']);
              final String date = V.prettyDate(row['created_at'] ?? row['publish_date']);
              return <String>[author, date].where((String s) => s.isNotEmpty).join(' · ');
            },
            thumbOf: (Map<String, dynamic> row) => V.asString(row['featured_image']),
            pillsOf: (Map<String, dynamic> row) {
              final String status = V.asString(row['status'], fallback: 'published');
              return <Widget>[
                if (status != 'published')
                  StatusPill(status.toUpperCase(), color: AppTheme.textDim),
                if (V.asString(row['category']).isNotEmpty)
                  StatusPill(V.asString(row['category']).toUpperCase(), color: AppTheme.info),
              ];
            },
            openEditor: (BuildContext context, Map<String, dynamic>? row) {
              return Navigator.of(context).push<bool>(
                MaterialPageRoute<bool>(builder: (_) => BlogEditor(blog: row)),
              );
            },
          ),
        );

      case Section.wallpaperCategories:
        return CollectionScreen(
          spec: CollectionSpec(
            title: 'Wallpaper categories',
            endpoint: 'wallpaper_categories',
            deleteType: 'wallpaper_category',
            icon: Icons.collections_outlined,
            createLabel: 'New category',
            searchFields: const <String>['name', 'slug'],
            titleOf: (Map<String, dynamic> row) => V.asString(row['name']),
            subtitleOf: (Map<String, dynamic> row) => V.asString(row['description']),
            pillsOf: (Map<String, dynamic> row) => <Widget>[
              StatusPill('${V.asInt(row['wallpaper_count'])} WALLPAPERS',
                  color: AppTheme.textDim),
            ],
            openEditor: (BuildContext context, Map<String, dynamic>? row) {
              return Navigator.of(context).push<bool>(
                MaterialPageRoute<bool>(builder: (_) => WallpaperCategoryEditor(category: row)),
              );
            },
          ),
        );

      case Section.authors:
        return CollectionScreen(
          spec: CollectionSpec(
            title: 'Authors',
            endpoint: 'authors',
            deleteType: 'author',
            icon: Icons.person_outline_rounded,
            createLabel: 'New author',
            fallbackIcon: Icons.person_outline_rounded,
            searchFields: const <String>['name'],
            titleOf: (Map<String, dynamic> row) => V.asString(row['name']),
            subtitleOf: (Map<String, dynamic> row) => V.asString(row['description']),
            thumbOf: (Map<String, dynamic> row) => V.asString(row['image']),
            openEditor: (BuildContext context, Map<String, dynamic>? row) {
              return Navigator.of(context).push<bool>(
                MaterialPageRoute<bool>(builder: (_) => AuthorEditor(author: row)),
              );
            },
          ),
        );

      case Section.faqs:
        return CollectionScreen(
          spec: CollectionSpec(
            title: 'FAQs',
            endpoint: 'faqs',
            deleteType: 'faq',
            icon: Icons.help_outline_rounded,
            createLabel: 'New FAQ',
            searchFields: const <String>['question', 'answer'],
            titleOf: (Map<String, dynamic> row) => V.asString(row['question']),
            subtitleOf: (Map<String, dynamic> row) => V.asString(row['answer']),
            pillsOf: (Map<String, dynamic> row) => <Widget>[
              if (!V.asBool(row['is_active']))
                const StatusPill('INACTIVE', color: AppTheme.textDim),
            ],
            openEditor: (BuildContext context, Map<String, dynamic>? row) {
              return Navigator.of(context).push<bool>(
                MaterialPageRoute<bool>(builder: (_) => FaqEditor(faq: row)),
              );
            },
          ),
        );

      case Section.categories:
        return CollectionScreen(
          spec: CollectionSpec(
            title: 'Categories',
            endpoint: 'categories',
            deleteType: 'category',
            icon: Icons.category_outlined,
            createLabel: 'New category',
            searchFields: const <String>['name', 'slug'],
            titleOf: (Map<String, dynamic> row) => V.asString(row['name']),
            subtitleOf: (Map<String, dynamic> row) => V.asString(row['slug']),
            thumbOf: (Map<String, dynamic> row) => V.asString(row['image']),
            openEditor: (BuildContext context, Map<String, dynamic>? row) {
              return Navigator.of(context).push<bool>(
                MaterialPageRoute<bool>(builder: (_) => CategoryEditor(category: row)),
              );
            },
          ),
        );

      case Section.websiteCategories:
        return CollectionScreen(
          spec: CollectionSpec(
            title: 'Website categories',
            endpoint: 'website_categories',
            deleteType: 'website_category',
            icon: Icons.layers_outlined,
            createLabel: 'New category',
            searchFields: const <String>['name', 'slug', 'tag'],
            titleOf: (Map<String, dynamic> row) => V.asString(row['name']),
            subtitleOf: (Map<String, dynamic> row) => V.asString(row['description']),
            thumbOf: (Map<String, dynamic> row) => V.asString(row['image_url']),
            pillsOf: (Map<String, dynamic> row) => <Widget>[
              if (V.asString(row['tag']).isNotEmpty)
                StatusPill(V.asString(row['tag']).toUpperCase(), color: AppTheme.info),
            ],
            openEditor: (BuildContext context, Map<String, dynamic>? row) {
              return Navigator.of(context).push<bool>(
                MaterialPageRoute<bool>(builder: (_) => WebsiteCategoryEditor(category: row)),
              );
            },
          ),
        );
    }
  }

  static _SectionInfo _info(Section section) {
    switch (section) {
      case Section.dashboard:
        return const _SectionInfo('Dashboard', 'Home', Icons.dashboard_outlined);
      case Section.prompts:
        return const _SectionInfo('Prompts', 'Prompts', Icons.bolt_rounded);
      case Section.listicles:
        return const _SectionInfo('Listicles', 'Lists', Icons.format_list_numbered_rounded);
      case Section.wallpapers:
        return const _SectionInfo('Wallpapers', 'Walls', Icons.wallpaper_rounded);
      case Section.wallpaperCategories:
        return const _SectionInfo('Wallpaper categories', 'Sets', Icons.collections_outlined);
      case Section.blogs:
        return const _SectionInfo('Blogs', 'Blogs', Icons.article_outlined);
      case Section.authors:
        return const _SectionInfo('Authors', 'Authors', Icons.person_outline_rounded);
      case Section.faqs:
        return const _SectionInfo('FAQs', 'FAQs', Icons.help_outline_rounded);
      case Section.categories:
        return const _SectionInfo('Categories', 'Cats', Icons.category_outlined);
      case Section.websiteCategories:
        return const _SectionInfo('Website categories', 'Web', Icons.layers_outlined);
      case Section.users:
        return const _SectionInfo('Users', 'Users', Icons.people_outline_rounded);
      case Section.settings:
        return const _SectionInfo('Settings', 'Settings', Icons.settings_outlined);
    }
  }
}

class _SectionInfo {
  const _SectionInfo(this.label, this.short, this.icon);

  final String label;
  final String short;
  final IconData icon;
}
