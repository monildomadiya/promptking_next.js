import 'package:flutter/material.dart';

import '../core/api_client.dart';
import '../core/app_scope.dart';
import '../core/theme.dart';
import '../core/values.dart';
import '../services/admin_api.dart';
import '../widgets/common.dart';
import '../widgets/form_kit.dart';
import '../widgets/image_field.dart';

/// Create or edit one blog post.
///
/// The web panel has a rich-text editor for `content`; this one has a plain
/// HTML textarea and says so. Reimplementing that editor on a phone would be a
/// month of work to produce something nobody would choose to write a 2000-word
/// post in — whereas fixing a typo, swapping the hero image, changing the
/// author or flipping a post to draft are all things that genuinely come up
/// away from a desk, and those are what this screen is for.
class BlogEditor extends StatefulWidget {
  const BlogEditor({super.key, this.blog});

  final Map<String, dynamic>? blog;

  @override
  State<BlogEditor> createState() => _BlogEditorState();
}

class _BlogEditorState extends State<BlogEditor> {
  late final AdminApi _api;
  final Map<String, TextEditingController> _c = <String, TextEditingController>{};

  late Map<String, dynamic> _row;
  List<Map<String, dynamic>> _authors = <Map<String, dynamic>>[];
  List<Map<String, dynamic>> _faqs = <Map<String, dynamic>>[];

  String? _featuredImage;
  String? _ogImage;
  String? _twitterImage;
  String? _authorId;
  String _status = 'published';
  bool _toc = true;
  bool _saving = false;
  bool _loadingRefs = true;

  bool get _isNew => widget.blog == null;

  @override
  void initState() {
    super.initState();
    _api = AppScope.apiOf(context);
    _row = <String, dynamic>{...?widget.blog};

    for (final String field in <String>[
      'title', 'slug', 'category', 'excerpt', 'content', 'read_time', 'tags',
      'featured_image_alt', 'featured_image_caption',
      'meta_title', 'meta_description', 'focus_keyword', 'canonical_url',
      'og_title', 'og_description', 'twitter_title', 'twitter_description',
    ]) {
      _c[field] = TextEditingController(text: V.asString(_row[field]));
    }

    // `tags` is a JSON array in the column but a comma list is what anyone
    // would type into a single field.
    _c['tags']!.text = V.asJsonList(_row['tags']).join(', ');

    _featuredImage = _blankToNull(V.asString(_row['featured_image']));
    _ogImage = _blankToNull(V.asString(_row['og_image']));
    _twitterImage = _blankToNull(V.asString(_row['twitter_image']));
    _authorId = _blankToNull(V.asString(_row['author_id']));
    _status = V.asString(_row['status'], fallback: 'published');
    if (_status.isEmpty) _status = 'published';
    _toc = _isNew ? true : V.asBool(_row['enable_table_of_contents']);
    _faqs = V.asMapList(_row['faqs'])
        .map((Map<String, dynamic> e) => <String, dynamic>{...e})
        .toList();

    _loadAuthors();
  }

  static String? _blankToNull(String value) => value.trim().isEmpty ? null : value.trim();

  Future<void> _loadAuthors() async {
    try {
      final List<Map<String, dynamic>> authors = await _api.list('authors');
      if (!mounted) return;
      setState(() {
        _authors = authors;
        _loadingRefs = false;
      });
    } on ApiException {
      if (mounted) setState(() => _loadingRefs = false);
    }
  }

  @override
  void dispose() {
    for (final TextEditingController controller in _c.values) {
      controller.dispose();
    }
    super.dispose();
  }

  String _text(String field) => _c[field]!.text.trim();

  Future<void> _save() async {
    final String title = _text('title');
    if (title.isEmpty) {
      showToast(context, 'A title is required.', error: true);
      return;
    }

    setState(() => _saving = true);

    // The author's name and photo are denormalised onto the post, so picking an
    // author has to copy them across — leaving the old ones would show the
    // previous author's face under the new byline.
    Map<String, dynamic>? author;
    if (_authorId != null) {
      for (final Map<String, dynamic> candidate in _authors) {
        if (V.asString(candidate['id']) == _authorId) {
          author = candidate;
          break;
        }
      }
    }

    final List<String> tags = _text('tags')
        .split(',')
        .map((String s) => s.trim())
        .where((String s) => s.isNotEmpty)
        .toList();

    final Map<String, dynamic> body = <String, dynamic>{
      ..._row,
      'id': _row['id'],
      'title': title,
      'slug': _text('slug').isEmpty ? _slugify(title) : _text('slug'),
      'category': V.emptyToNull(_text('category')),
      'tags': tags,
      'excerpt': V.emptyToNull(_text('excerpt')),
      'content': _c['content']!.text,
      'read_time': V.emptyToNull(_text('read_time')),
      'status': _status,
      'enable_table_of_contents': _toc,
      'featured_image': _featuredImage,
      'featured_image_alt': V.emptyToNull(_text('featured_image_alt')),
      'featured_image_caption': V.emptyToNull(_text('featured_image_caption')),
      'meta_title': V.emptyToNull(_text('meta_title')),
      'meta_description': V.emptyToNull(_text('meta_description')),
      'focus_keyword': V.emptyToNull(_text('focus_keyword')),
      'canonical_url': V.emptyToNull(_text('canonical_url')),
      'og_title': V.emptyToNull(_text('og_title')),
      'og_description': V.emptyToNull(_text('og_description')),
      'og_image': _ogImage,
      'twitter_title': V.emptyToNull(_text('twitter_title')),
      'twitter_description': V.emptyToNull(_text('twitter_description')),
      'twitter_image': _twitterImage,
      'faqs': _faqs,
      'author_id': _authorId,
      'author_name': author != null ? V.asString(author['name']) : _row['author_name'],
      'author_image': author != null ? V.asString(author['image']) : _row['author_image'],
      'author_description':
          author != null ? V.asString(author['description']) : _row['author_description'],
    };

    try {
      await _api.saveBlog(body);
      if (!mounted) return;
      showToast(context, _isNew ? 'Post created' : 'Post saved');
      Navigator.of(context).pop(true);
    } on ApiException catch (e) {
      if (mounted) {
        showToast(context, e.message, error: true);
        setState(() => _saving = false);
      }
    }
  }

  static String _slugify(String value) {
    return value
        .toLowerCase()
        .replaceAll('&', ' and ')
        .replaceAll(RegExp(r'[^a-z0-9]+'), '-')
        .replaceAll(RegExp(r'^-+|-+$'), '');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(_isNew ? 'New post' : 'Edit post')),
      body: _loadingRefs
          ? const LoadingState()
          : ListView(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
              children: <Widget>[
                FormSection(
                  title: 'Basics',
                  icon: Icons.article_outlined,
                  children: <Widget>[
                    FormTextField(
                      label: 'Title',
                      controller: _c['title']!,
                      required: true,
                      maxLines: 2,
                      minLines: 1,
                    ),
                    FormTextField(
                      label: 'Slug',
                      controller: _c['slug']!,
                      textCapitalization: TextCapitalization.none,
                      helper: 'Left empty, it is generated from the title.',
                    ),
                    FormTextField(label: 'Category', controller: _c['category']!),
                    FormTextField(
                      label: 'Tags',
                      controller: _c['tags']!,
                      helper: 'Comma separated.',
                    ),
                    FormTextField(
                      label: 'Excerpt',
                      controller: _c['excerpt']!,
                      maxLines: 4,
                      minLines: 2,
                    ),
                    FormTextField(
                      label: 'Read time',
                      controller: _c['read_time']!,
                      hint: '6 min read',
                    ),
                    FormDropdownField<String>(
                      label: 'Status',
                      value: _status,
                      onChanged: (String? value) =>
                          setState(() => _status = value ?? 'published'),
                      items: const <DropdownMenuItem<String>>[
                        DropdownMenuItem<String>(value: 'published', child: Text('Published')),
                        DropdownMenuItem<String>(value: 'draft', child: Text('Draft')),
                      ],
                    ),
                    FormDropdownField<String>(
                      label: 'Author',
                      value: _authorId,
                      onChanged: (String? value) => setState(() => _authorId = value),
                      items: _authors
                          .map((Map<String, dynamic> author) => DropdownMenuItem<String>(
                                value: V.asString(author['id']),
                                child: Text(V.asString(author['name'])),
                              ))
                          .toList(),
                      helper: 'The name and photo are copied onto the post when you save.',
                    ),
                  ],
                ),

                FormSection(
                  title: 'Content',
                  icon: Icons.code_rounded,
                  subtitle: 'Raw HTML, the same markup the web editor produces',
                  children: <Widget>[
                    FormTextField(
                      label: 'Body',
                      controller: _c['content']!,
                      maxLines: 22,
                      minLines: 10,
                      textCapitalization: TextCapitalization.none,
                      hint: '<p>…</p>',
                      helper: 'This field is the post exactly as it renders. Long-form '
                          'writing is easier on the web panel; this is here for fixes.',
                    ),
                    FormSwitchField(
                      label: 'Table of contents',
                      value: _toc,
                      icon: Icons.toc_rounded,
                      description: 'Builds the jump list from the headings in the body.',
                      onChanged: (bool value) => setState(() => _toc = value),
                    ),
                  ],
                ),

                FormSection(
                  title: 'Featured image',
                  icon: Icons.image_outlined,
                  children: <Widget>[
                    ImageField(
                      label: 'Image',
                      value: _featuredImage,
                      onChanged: (String? url) => setState(() => _featuredImage = url),
                    ),
                    FormTextField(
                      label: 'Alt text',
                      controller: _c['featured_image_alt']!,
                      helper: 'Describes the image for screen readers and image search.',
                    ),
                    FormTextField(
                      label: 'Caption',
                      controller: _c['featured_image_caption']!,
                    ),
                  ],
                ),

                FormSection(
                  title: 'SEO',
                  icon: Icons.travel_explore_rounded,
                  collapsible: true,
                  initiallyExpanded: false,
                  children: <Widget>[
                    FormTextField(label: 'Meta title', controller: _c['meta_title']!),
                    FormTextField(
                      label: 'Meta description',
                      controller: _c['meta_description']!,
                      maxLines: 4,
                      minLines: 2,
                    ),
                    FormTextField(label: 'Focus keyword', controller: _c['focus_keyword']!),
                    FormTextField(
                      label: 'Canonical URL',
                      controller: _c['canonical_url']!,
                      keyboardType: TextInputType.url,
                      textCapitalization: TextCapitalization.none,
                    ),
                  ],
                ),

                FormSection(
                  title: 'Social cards',
                  icon: Icons.share_outlined,
                  collapsible: true,
                  initiallyExpanded: false,
                  children: <Widget>[
                    FormTextField(label: 'OG title', controller: _c['og_title']!),
                    FormTextField(
                      label: 'OG description',
                      controller: _c['og_description']!,
                      maxLines: 3,
                      minLines: 2,
                    ),
                    ImageField(
                      label: 'OG image',
                      value: _ogImage,
                      height: 120,
                      onChanged: (String? url) => setState(() => _ogImage = url),
                    ),
                    FormTextField(label: 'Twitter title', controller: _c['twitter_title']!),
                    FormTextField(
                      label: 'Twitter description',
                      controller: _c['twitter_description']!,
                      maxLines: 3,
                      minLines: 2,
                    ),
                    ImageField(
                      label: 'Twitter image',
                      value: _twitterImage,
                      height: 120,
                      onChanged: (String? url) => setState(() => _twitterImage = url),
                    ),
                  ],
                ),

                _BlogFaqSection(
                  items: _faqs,
                  onChanged: (List<Map<String, dynamic>> items) => setState(() => _faqs = items),
                ),
              ],
            ),
      bottomNavigationBar: _loadingRefs
          ? null
          : SaveBar(
              onSave: _save,
              saving: _saving,
              label: _isNew ? 'Create post' : 'Save changes',
            ),
    );
  }
}

class _BlogFaqSection extends StatelessWidget {
  const _BlogFaqSection({required this.items, required this.onChanged});

  final List<Map<String, dynamic>> items;
  final ValueChanged<List<Map<String, dynamic>>> onChanged;

  @override
  Widget build(BuildContext context) {
    return FormSection(
      title: 'FAQs',
      icon: Icons.help_outline_rounded,
      collapsible: true,
      initiallyExpanded: items.isNotEmpty,
      subtitle: items.isEmpty ? 'None' : '${items.length} added',
      children: <Widget>[
        for (int i = 0; i < items.length; i++)
          Container(
            // Keyed on the item so removing one does not leave the element
            // below it reusing the deleted row's seeded controllers.
            key: ObjectKey(items[i]),
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppTheme.bg,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppTheme.border),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: <Widget>[
                Row(
                  children: <Widget>[
                    Text(
                      '#${i + 1}',
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.textDim,
                      ),
                    ),
                    const Spacer(),
                    GestureDetector(
                      onTap: () {
                        final List<Map<String, dynamic>> next =
                            List<Map<String, dynamic>>.from(items)..removeAt(i);
                        onChanged(next);
                      },
                      child: const Icon(Icons.delete_outline_rounded,
                          size: 18, color: AppTheme.danger),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                _FaqInput(
                  label: 'Question',
                  initial: V.asString(items[i]['question']),
                  onChanged: (String value) {
                    items[i]['question'] = value;
                    onChanged(items);
                  },
                ),
                const SizedBox(height: 10),
                _FaqInput(
                  label: 'Answer',
                  initial: V.asString(items[i]['answer']),
                  maxLines: 5,
                  onChanged: (String value) {
                    items[i]['answer'] = value;
                    onChanged(items);
                  },
                ),
              ],
            ),
          ),
        OutlinedButton.icon(
          onPressed: () {
            final List<Map<String, dynamic>> next = List<Map<String, dynamic>>.from(items)
              ..add(<String, dynamic>{'question': '', 'answer': ''});
            onChanged(next);
          },
          icon: const Icon(Icons.add_rounded, size: 18),
          label: const Text('Add an FAQ'),
        ),
      ],
    );
  }
}

class _FaqInput extends StatefulWidget {
  const _FaqInput({
    required this.label,
    required this.initial,
    required this.onChanged,
    this.maxLines = 1,
  });

  final String label;
  final String initial;
  final ValueChanged<String> onChanged;
  final int maxLines;

  @override
  State<_FaqInput> createState() => _FaqInputState();
}

class _FaqInputState extends State<_FaqInput> {
  late final TextEditingController _controller =
      TextEditingController(text: widget.initial);

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        FieldLabel(widget.label),
        const SizedBox(height: 6),
        TextField(
          controller: _controller,
          onChanged: widget.onChanged,
          maxLines: widget.maxLines,
          minLines: widget.maxLines > 1 ? 2 : 1,
          style: const TextStyle(fontSize: 14, height: 1.4),
          decoration: const InputDecoration(isDense: true),
        ),
      ],
    );
  }
}
