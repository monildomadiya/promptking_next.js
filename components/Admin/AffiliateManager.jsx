"use client";
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '@/lib/api';
import {
  Plus, Edit, Trash, Copy, ExternalLink, Search, Activity, Settings, Tag, Crown, Eye,
  CheckCircle, AlertCircle, Zap, Save, Info,
} from '@/components/Common/Icons';
import AffiliateProductModal from '@/components/Admin/AffiliateProductModal';
import {
  STORES, buildAffiliateUrl, detectStore, discountPercent, formatPrice, storeInfo,
} from '@/lib/affiliateLinks';

const TABS = [
  { id: 'products', label: 'Products', Icon: Tag },
  { id: 'performance', label: 'Performance', Icon: Activity },
  { id: 'setup', label: 'Setup', Icon: Settings },
];

// Mirrors AFFILIATE_SETTING_DEFAULTS in lib/affiliate.js. Not imported: that
// module pulls in the database pool, and this one runs in the browser.
const SETTING_DEFAULTS = {
  affiliate_enabled: '0',
  amazon_tag: '',
  flipkart_affid: '',
  flipkart_subid: '',
  affiliate_page_title: 'Deals & Gear We Recommend',
  affiliate_page_subtitle: 'Hand-picked products from Amazon, Flipkart and more — the tools, gadgets and gear that go with your AI creations.',
  affiliate_disclosure: 'PromptKing is a participant in the Amazon Associates Programme and the Flipkart Affiliate Programme. When you buy through links on this page we may earn a small commission, at no extra cost to you.',
  affiliate_show_on_prompts: '1',
  affiliate_prompt_heading: 'Recommended for this prompt',
  affiliate_show_in_nav: '1',
};
const SETTING_KEYS = Object.keys(SETTING_DEFAULTS);

const siteOrigin = () => (typeof window !== 'undefined' ? window.location.origin : '');

const isExpired = (p) => p.deal_ends_at && new Date(p.deal_ends_at) <= new Date();

export default function AffiliateManager({ isMobile }) {
  const [tab, setTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(SETTING_DEFAULTS);
  const [savedSettings, setSavedSettings] = useState(SETTING_DEFAULTS);
  const [modal, setModal] = useState({ open: false, product: null, initialUrl: '' });

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/affiliate_products');
      setProducts(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error('Could not load products: ' + e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/settings');
      const merged = { ...SETTING_DEFAULTS };
      for (const key of SETTING_KEYS) {
        if (data?.[key] !== undefined && data[key] !== null && data[key] !== '') merged[key] = String(data[key]);
      }
      setSettings(merged);
      setSavedSettings(merged);
    } catch { /* the panel works on defaults */ }
  }, []);

  useEffect(() => { loadProducts(); loadSettings(); }, [loadProducts, loadSettings]);

  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category).filter(Boolean))].sort(),
    [products]
  );

  const openNew = (initialUrl = '') => setModal({ open: true, product: null, initialUrl });
  const openEdit = (product) => setModal({ open: true, product, initialUrl: '' });
  const closeModal = () => setModal({ open: false, product: null, initialUrl: '' });

  const enabled = savedSettings.affiliate_enabled === '1';
  const missingIds = [
    products.some((p) => p.store === 'amazon') && !savedSettings.amazon_tag && 'Amazon tracking ID',
    products.some((p) => p.store === 'flipkart') && !savedSettings.flipkart_affid && 'Flipkart affiliate ID',
  ].filter(Boolean);

  return (
    <div className="pk-am">
      <style>{styles}</style>

      {/* Status strip: the two things that silently cost money — the shop
          being switched off, and products linking out with no tag on them. */}
      {(!enabled || missingIds.length > 0) && (
        <div className={`pk-am-alert ${!enabled ? 'is-off' : ''}`}>
          <AlertCircle size={18} />
          <div>
            {!enabled
              ? <><strong>The affiliate store is switched off.</strong> Products, the /deals page and prompt-page picks are hidden from visitors.</>
              : <><strong>Missing {missingIds.join(' and ')}.</strong> Those clicks are not being credited to you.</>}
          </div>
          <button type="button" onClick={() => setTab('setup')}>Open setup</button>
        </div>
      )}

      <div className="pk-am-top">
        <div className="pk-am-tabs" role="tablist">
          {TABS.map(({ id, label, Icon }) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? 'is-on' : ''} onClick={() => setTab(id)}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>
        <div className="pk-am-topactions">
          {enabled && (
            <a className="pk-am-ghost" href="/deals" target="_blank" rel="noopener noreferrer"><Eye size={15} /> View /deals</a>
          )}
          <button type="button" className="pk-am-primary" onClick={() => openNew()}><Plus size={16} /> Add product</button>
        </div>
      </div>

      {tab === 'products' && (
        <ProductsTab
          products={products}
          loading={loading}
          settings={savedSettings}
          isMobile={isMobile}
          onEdit={openEdit}
          onNew={openNew}
          onChanged={loadProducts}
          setProducts={setProducts}
        />
      )}
      {tab === 'performance' && <PerformanceTab />}
      {tab === 'setup' && (
        <SetupTab
          settings={settings}
          setSettings={setSettings}
          dirty={SETTING_KEYS.some((k) => settings[k] !== savedSettings[k])}
          onSaved={(next) => setSavedSettings(next)}
        />
      )}

      {modal.open && (
        <AffiliateProductModal
          product={modal.product}
          initialUrl={modal.initialUrl}
          settings={savedSettings}
          categories={categories}
          onClose={closeModal}
          onSave={() => { closeModal(); loadProducts(); }}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────── Products ─────────────────────────────── */

function ProductsTab({ products, loading, settings, isMobile, onEdit, onNew, onChanged, setProducts }) {
  const [query, setQuery] = useState('');
  const [store, setStore] = useState('all');
  const [status, setStatus] = useState('all');
  const [quickUrl, setQuickUrl] = useState('');

  const counts = useMemo(() => {
    const c = { all: products.length };
    products.forEach((p) => { c[p.store] = (c[p.store] || 0) + 1; });
    return c;
  }, [products]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (store !== 'all' && p.store !== store) return false;
      if (status === 'live' && (!p.is_active || isExpired(p))) return false;
      if (status === 'hidden' && p.is_active && !isExpired(p)) return false;
      if (status === 'featured' && !p.is_featured) return false;
      if (!q) return true;
      return [p.title, p.category, p.tags, p.external_id, p.slug].some((v) => String(v || '').toLowerCase().includes(q));
    });
  }, [products, query, store, status]);

  const toggle = async (p, field) => {
    const value = !p[field];
    setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, [field]: value } : x)));
    try {
      await api.post('/admin/affiliate_product_toggle', { id: p.id, field, value });
    } catch {
      setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, [field]: !value } : x)));
      toast.error('Update failed');
    }
  };

  const remove = async (p) => {
    if (!window.confirm(`Delete "${p.title}"? Its click history goes with it.`)) return;
    try {
      await api.delete(`/admin/delete_affiliate_product/${p.id}`);
      toast.success('Product deleted');
      onChanged();
    } catch (e) {
      toast.error('Delete failed: ' + e.message);
    }
  };

  const copyLink = (p) => {
    const link = `${siteOrigin()}/go/${p.slug}`;
    navigator.clipboard?.writeText(link).then(() => toast.success('Tracked link copied'), () => toast.error('Copy failed'));
  };

  // "Quick add": paste a link here and the modal opens already fetching it.
  const quickAdd = (e) => {
    e.preventDefault();
    onNew(quickUrl.trim());
    setQuickUrl('');
  };

  return (
    <div className="pk-am-panel">
      <form className="pk-am-quick" onSubmit={quickAdd}>
        <Zap size={18} />
        <input
          value={quickUrl}
          onChange={(e) => setQuickUrl(e.target.value)}
          placeholder="Quick add — paste an Amazon / Flipkart product link and press Enter"
          aria-label="Quick add product link"
        />
        <button type="submit">Add</button>
      </form>

      <div className="pk-am-filters">
        <div className="pk-am-chips">
          {['all', ...Object.keys(STORES).filter((id) => counts[id])].map((id) => (
            <button key={id} type="button" className={store === id ? 'is-on' : ''} onClick={() => setStore(id)}>
              {id !== 'all' && <i style={{ background: storeInfo(id).color }} />}
              {id === 'all' ? 'All stores' : storeInfo(id).label} <span>{counts[id] || 0}</span>
            </button>
          ))}
        </div>
        <div className="pk-am-filtertools">
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status filter">
            <option value="all">Any status</option>
            <option value="live">Live</option>
            <option value="hidden">Hidden / expired</option>
            <option value="featured">Featured</option>
          </select>
          <label className="pk-am-search">
            <Search size={14} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products" />
          </label>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 20, display: 'grid', gap: 10 }}>
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 76, borderRadius: 14, opacity: 1 - i * 0.15 }} />)}
        </div>
      ) : products.length === 0 ? (
        <div className="pk-am-empty">
          <Tag size={40} color="var(--text-muted)" />
          <h3>No affiliate products yet</h3>
          <p>Paste an Amazon or Flipkart link above. Title, image, price and your affiliate tag are filled in automatically.</p>
          <button type="button" className="pk-am-primary" onClick={() => onNew()}><Plus size={16} /> Add your first product</button>
        </div>
      ) : shown.length === 0 ? (
        <div className="pk-am-empty"><p>No products match these filters.</p></div>
      ) : (
        <div className="pk-am-list">
          {!isMobile && (
            <div className="pk-am-row pk-am-head">
              <span>Product</span><span>Price</span><span>Clicks</span><span>Status</span><span style={{ textAlign: 'right' }}>Actions</span>
            </div>
          )}
          {shown.map((p) => {
            const info = storeInfo(p.store);
            const off = discountPercent(p.price, p.mrp);
            const expired = isExpired(p);
            const untagged = !p.affiliate_url && (
              (p.store === 'amazon' && !settings.amazon_tag) || (p.store === 'flipkart' && !settings.flipkart_affid)
            );
            const dest = buildAffiliateUrl(p, settings);
            return (
              <div key={p.id} className={`pk-am-row ${!p.is_active || expired ? 'is-dim' : ''}`}>
                <div className="pk-am-prod">
                  <span className="pk-am-thumb">
                    {p.image_url && <img src={p.image_url} alt="" referrerPolicy="no-referrer" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
                    <b style={{ color: info.color }}>{info.label[0]}</b>
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div className="pk-am-title" title={p.title}>{p.title}</div>
                    <div className="pk-am-meta">
                      <span className="pk-am-store" style={{ background: info.color, color: info.ink }}>{info.label}</span>
                      {p.category && <span>{p.category}</span>}
                      {p.badge && <span className="pk-am-badge">{p.badge}</span>}
                      {untagged && <span className="pk-am-warn" title="No affiliate ID set for this store"><AlertCircle size={11} /> untagged</span>}
                    </div>
                  </div>
                </div>

                <div className="pk-am-price">
                  {p.price ? <strong>{formatPrice(p.price, p.currency)}</strong> : <span className="pk-am-muted">—</span>}
                  {off > 0 && <small><s>{formatPrice(p.mrp, p.currency)}</s> <em>{off}% off</em></small>}
                </div>

                <div className="pk-am-clicks">
                  <strong>{p.click_count.toLocaleString('en-IN')}</strong>
                  <small>{p.clicks_7d} this week</small>
                </div>

                <div className="pk-am-status">
                  <button type="button" className={`pk-am-switch ${p.is_active && !expired ? 'is-on' : ''}`} onClick={() => toggle(p, 'is_active')} title={p.is_active ? 'Live — click to hide' : 'Hidden — click to publish'}>
                    <i />{expired ? 'Expired' : p.is_active ? 'Live' : 'Hidden'}
                  </button>
                  <button type="button" className={`pk-am-star ${p.is_featured ? 'is-on' : ''}`} onClick={() => toggle(p, 'is_featured')} title={p.is_featured ? 'Unfeature' : 'Feature'}>
                    <Crown size={14} fill={p.is_featured ? '#f59e0b' : 'none'} color={p.is_featured ? '#f59e0b' : 'currentColor'} />
                  </button>
                </div>

                <div className="pk-am-actions">
                  <button type="button" onClick={() => copyLink(p)} title="Copy tracked link (/go/…) — share it anywhere and clicks are still counted"><Copy size={14} /></button>
                  {dest && <a href={dest} target="_blank" rel="noopener noreferrer" title="Open the tagged store link"><ExternalLink size={14} /></a>}
                  <button type="button" onClick={() => onEdit(p)} title="Edit"><Edit size={14} /></button>
                  <button type="button" className="is-danger" onClick={() => remove(p)} title="Delete"><Trash size={14} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ───────────────────────────── Performance ────────────────────────────── */

function PerformanceTab() {
  const [days, setDays] = useState(30);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    setStats(null);
    setError(null);
    api.get(`/admin/affiliate_stats?days=${days}`)
      .then(({ data }) => { if (alive) setStats(data); })
      .catch((e) => { if (alive) setError(e.message); });
    return () => { alive = false; };
  }, [days]);

  if (error) return <div className="pk-am-panel pk-am-empty"><p>Could not load stats: {error}</p></div>;
  if (!stats) {
    return (
      <div className="pk-am-panel" style={{ padding: 20, display: 'grid', gap: 12 }}>
        <div className="skeleton" style={{ height: 90, borderRadius: 16 }} />
        <div className="skeleton" style={{ height: 300, borderRadius: 16 }} />
      </div>
    );
  }

  const storesInSeries = stats.stores.map((s) => s.store);
  const maxStore = Math.max(1, ...stats.stores.map((s) => s.clicks));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="pk-am-stats">
        <Stat label="Live products" value={stats.totals.live} sub={`${stats.totals.products} total`} color="#10b981" />
        <Stat label={`Clicks · ${days} days`} value={stats.totals.clicksPeriod} sub="sent to stores" color="#3b82f6" />
        <Stat label="All-time clicks" value={stats.totals.clicksAllTime} sub="since tracking began" color="#f59e0b" />
        <Stat label="Featured" value={stats.totals.featured} sub="shown first" color="#e50914" />
      </div>

      <div className="pk-am-panel pk-am-pad">
        <div className="pk-am-sechead">
          <h3>Clicks by day</h3>
          <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>Last 12 months</option>
          </select>
        </div>
        <div style={{ width: '100%', height: 300 }}>
          {stats.totals.clicksPeriod === 0 ? (
            <div className="pk-am-empty" style={{ height: '100%', justifyContent: 'center' }}>
              <Activity size={34} color="var(--text-muted)" />
              <p>No clicks in this period yet. Clicks appear here as visitors use the Buy buttons.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.series} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  {storesInSeries.map((s) => (
                    <linearGradient key={s} id={`pk-am-g-${s}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={storeInfo(s).color} stopOpacity={0.55} />
                      <stop offset="95%" stopColor={storeInfo(s).color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.08)" />
                <XAxis dataKey="date" stroke="rgba(15,23,42,0.25)" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} minTickGap={16} />
                <YAxis allowDecimals={false} stroke="rgba(15,23,42,0.25)" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid rgba(15,23,42,0.12)', borderRadius: 12 }} />
                {storesInSeries.map((s) => (
                  <Area key={s} type="monotone" dataKey={s} name={storeInfo(s).label} stackId="1" stroke={storeInfo(s).color} strokeWidth={2} fill={`url(#pk-am-g-${s})`} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="pk-am-two">
        <div className="pk-am-panel pk-am-pad">
          <div className="pk-am-sechead"><h3>By store</h3></div>
          {stats.stores.length === 0 ? <p className="pk-am-muted">No clicks yet.</p> : stats.stores.map((s) => (
            <div key={s.store} className="pk-am-bar">
              <span>{storeInfo(s.store).label}</span>
              <div><i style={{ width: `${(s.clicks / maxStore) * 100}%`, background: storeInfo(s.store).color }} /></div>
              <strong>{s.clicks}</strong>
            </div>
          ))}
        </div>
        <div className="pk-am-panel pk-am-pad">
          <div className="pk-am-sechead"><h3>Top products</h3></div>
          {stats.top.length === 0 ? <p className="pk-am-muted">No clicks yet.</p> : stats.top.map((t, i) => (
            <div key={t.id} className="pk-am-top-item">
              <span className="pk-am-rank">{i + 1}</span>
              <span className="pk-am-thumb sm">{t.image_url ? <img src={t.image_url} alt="" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.style.display = 'none'; }} /> : null}</span>
              <span className="pk-am-top-title" title={t.title}>{t.title}</span>
              <span className="pk-am-store" style={{ background: storeInfo(t.store).color, color: storeInfo(t.store).ink }}>{storeInfo(t.store).label}</span>
              <strong>{t.clicks}</strong>
            </div>
          ))}
        </div>
      </div>

      <p className="pk-am-muted" style={{ fontSize: '0.74rem', display: 'flex', gap: 6 }}>
        <Info size={13} /> These are clicks on Buy buttons, counted on this site (bots and link previews excluded). Orders and commission are reported in your Amazon Associates and Flipkart Affiliate dashboards.
      </p>
    </div>
  );
}

const Stat = ({ label, value, sub, color }) => (
  <div className="pk-am-stat">
    <span className="pk-am-stat-dot" style={{ background: color }} />
    <div className="pk-am-stat-label">{label}</div>
    <div className="pk-am-stat-value">{Number(value || 0).toLocaleString('en-IN')}</div>
    <div className="pk-am-stat-sub">{sub}</div>
  </div>
);

/* ──────────────────────────────── Setup ───────────────────────────────── */

function SetupTab({ settings, setSettings, dirty, onSaved }) {
  const [saving, setSaving] = useState(false);
  const [testUrl, setTestUrl] = useState('');
  const set = (key) => (e) => setSettings((prev) => ({ ...prev, [key]: e.target.type === 'checkbox' ? (e.target.checked ? '1' : '0') : e.target.value }));

  const save = async () => {
    setSaving(true);
    try {
      const payload = {};
      for (const key of SETTING_KEYS) payload[key] = String(settings[key] ?? '').trim();
      await api.post('/admin/save_settings', payload);
      onSaved(payload);
      setSettings(payload);
      // Same signal the other settings panels send, so the header's Deals link
      // appears without a reload.
      try { localStorage.removeItem('siteSettings_ts'); } catch { /* storage off */ }
      window.dispatchEvent(new CustomEvent('settingsUpdated'));
      toast.success('Affiliate settings saved');
    } catch (e) {
      toast.error('Save failed: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const tested = testUrl.trim() ? buildAffiliateUrl({ product_url: testUrl }, settings) : null;
  const testStore = testUrl.trim() ? detectStore(testUrl) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="pk-am-panel pk-am-pad pk-am-savebar">
        <label className="pk-am-bigswitch">
          <input type="checkbox" checked={settings.affiliate_enabled === '1'} onChange={set('affiliate_enabled')} />
          <span>
            <strong>Affiliate store {settings.affiliate_enabled === '1' ? 'ON' : 'OFF'}</strong>
            <small>Turns on the /deals page, prompt-page picks and the Buy links.</small>
          </span>
        </label>
        <button type="button" className="pk-am-primary" onClick={save} disabled={saving || !dirty}>
          <Save size={16} /> {saving ? 'Saving…' : dirty ? 'Save settings' : 'Saved'}
        </button>
      </div>

      <div className="pk-am-two">
        <div className="pk-am-panel pk-am-pad pk-am-fields">
          <div className="pk-am-sechead"><h3>Affiliate IDs</h3></div>

          <Field label="Amazon Associates tracking ID" hint="Looks like yourname-21. Added as ?tag= to every Amazon link automatically.">
            <input value={settings.amazon_tag} onChange={set('amazon_tag')} placeholder="promptking-21" />
          </Field>
          <Field label="Flipkart affiliate ID (affid)" hint="From Flipkart Affiliate → Profile. Added as ?affid= to every Flipkart link.">
            <input value={settings.flipkart_affid} onChange={set('flipkart_affid')} placeholder="yourflipkartid" />
          </Field>
          <Field label="Flipkart sub-ID (optional)" hint="Sent as affExtParam1 — handy to tell this site's sales apart from your other channels.">
            <input value={settings.flipkart_subid} onChange={set('flipkart_subid')} placeholder="promptking" />
          </Field>

          <div className="pk-am-tester">
            <div className="pk-am-label">Link tester</div>
            <input value={testUrl} onChange={(e) => setTestUrl(e.target.value)} placeholder="Paste any Amazon / Flipkart link to see the tagged version" />
            {tested && (
              <div className="pk-am-tested">
                <span className="pk-am-store" style={{ background: storeInfo(testStore).color, color: storeInfo(testStore).ink }}>{storeInfo(testStore).label}</span>
                <code>{tested}</code>
              </div>
            )}
          </div>
        </div>

        <div className="pk-am-panel pk-am-pad pk-am-fields">
          <div className="pk-am-sechead"><h3>Where products appear</h3></div>
          <Toggle checked={settings.affiliate_show_in_nav === '1'} onChange={set('affiliate_show_in_nav')} title="Show “Deals” in the header menu and footer" />
          <Toggle checked={settings.affiliate_show_on_prompts === '1'} onChange={set('affiliate_show_on_prompts')} title="Show matching products on prompt pages" sub="Matched by each product’s tags; featured products fill the gaps." />
          <Field label="Prompt-page heading">
            <input value={settings.affiliate_prompt_heading} onChange={set('affiliate_prompt_heading')} />
          </Field>
          <Field label="/deals page title">
            <input value={settings.affiliate_page_title} onChange={set('affiliate_page_title')} />
          </Field>
          <Field label="/deals page subtitle">
            <textarea rows={2} value={settings.affiliate_page_subtitle} onChange={set('affiliate_page_subtitle')} />
          </Field>
          <Field label="Affiliate disclosure" hint="Required by Amazon Associates and Flipkart Affiliate terms (and ASCI in India). Shown on /deals and under every product shelf.">
            <textarea rows={3} value={settings.affiliate_disclosure} onChange={set('affiliate_disclosure')} />
          </Field>
        </div>
      </div>

      <div className="pk-am-panel pk-am-pad">
        <div className="pk-am-sechead"><h3>How it works</h3></div>
        <ol className="pk-am-steps">
          <li><CheckCircle size={16} /> <span><b>Add your IDs</b> above once. Every product link is tagged at the moment of the click, so changing an ID here re-tags every product instantly.</span></li>
          <li><CheckCircle size={16} /> <span><b>Paste a product link</b> in Products → Add. Store, ASIN / PID, title, image, price, MRP and rating are fetched automatically where the store allows it.</span></li>
          <li><CheckCircle size={16} /> <span><b>Already have a short link</b> (amzn.to, fkrt.it, EarnKaro, Cuelinks)? Put it in the product’s “Custom affiliate link” and it is used exactly as-is.</span></li>
          <li><CheckCircle size={16} /> <span><b>Every Buy button</b> goes through <code>/go/&lt;slug&gt;</code>: clicks are counted, links carry <code>rel=&quot;sponsored&quot;</code>, and a hidden or expired product sends visitors to /deals instead of a dead page.</span></li>
          <li><CheckCircle size={16} /> <span><b>Keep prices fresh.</b> Amazon asks that shown prices carry a date — the page prints “prices as of …”. Open a product and press Fetch details to refresh it.</span></li>
        </ol>
      </div>
    </div>
  );
}

const Field = ({ label, hint, children }) => (
  <div className="pk-am-field">
    <div className="pk-am-label">{label}</div>
    {children}
    {hint && <small>{hint}</small>}
  </div>
);

const Toggle = ({ checked, onChange, title, sub }) => (
  <label className="pk-am-toggle">
    <input type="checkbox" checked={checked} onChange={onChange} />
    <span><strong>{title}</strong>{sub && <small>{sub}</small>}</span>
  </label>
);

const styles = `
.pk-am { display: flex; flex-direction: column; gap: 20px; color: var(--text-main); }
.pk-am-alert {
  display: flex; align-items: center; gap: 12px; padding: 14px 18px; border-radius: 16px;
  background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.3); color: #92400e; font-size: 0.86rem;
}
.pk-am-alert.is-off { background: rgba(59,130,246,0.08); border-color: rgba(59,130,246,0.25); color: #1e3a8a; }
.pk-am-alert > div { flex: 1; }
.pk-am-alert button { flex-shrink: 0; padding: 8px 14px; border-radius: 10px; border: none; background: #0f172a; color: #fff; font-weight: 700; font-size: 0.78rem; cursor: pointer; }

.pk-am-top { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
.pk-am-tabs { display: inline-flex; gap: 4px; padding: 4px; border-radius: 14px; background: var(--surface-2); border: 1px solid var(--border-color); }
.pk-am-tabs button {
  display: inline-flex; align-items: center; gap: 7px; padding: 9px 16px; border-radius: 10px; border: 1px solid transparent;
  background: transparent; color: var(--text-secondary); font-weight: 700; font-size: 0.84rem; cursor: pointer;
}
.pk-am-tabs button.is-on { background: var(--surface-0); color: var(--text-main); border-color: var(--border-color); box-shadow: 0 1px 3px rgba(15,23,42,0.06); }
.pk-am-topactions { display: flex; gap: 10px; }
.pk-am-primary {
  display: inline-flex; align-items: center; gap: 8px; padding: 10px 18px; border-radius: 12px; border: none;
  background: var(--accent-main); color: #fff; font-weight: 800; font-size: 0.85rem; cursor: pointer;
}
.pk-am-primary:disabled { opacity: 0.55; cursor: default; }
.pk-am-ghost {
  display: inline-flex; align-items: center; gap: 7px; padding: 10px 16px; border-radius: 12px; text-decoration: none;
  background: var(--surface-1); border: 1px solid var(--border-color); color: var(--text-main); font-weight: 700; font-size: 0.84rem;
}

.pk-am-panel { background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: 22px; overflow: hidden; }
.pk-am-pad { padding: 22px 24px; }
.pk-am-sechead { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 14px; }
.pk-am-sechead h3 { margin: 0; font-size: 0.78rem; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase; color: var(--accent-main); }
.pk-am-sechead select, .pk-am-filtertools select {
  padding: 8px 12px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--surface-1); color: var(--text-main); font-size: 0.8rem; cursor: pointer;
}
.pk-am-muted { color: var(--text-dim); font-size: 0.82rem; }

.pk-am-quick {
  display: flex; align-items: center; gap: 10px; margin: 18px 18px 0; padding: 6px 6px 6px 16px; border-radius: 16px;
  background: linear-gradient(135deg, rgba(255,153,0,0.08), rgba(40,116,240,0.08)); border: 1px dashed rgba(15,23,42,0.18); color: #f59e0b;
}
.pk-am-quick input { flex: 1; min-width: 0; border: none; outline: none; background: transparent; padding: 10px 0; font-size: 0.88rem; color: var(--text-main); }
.pk-am-quick button { padding: 10px 18px; border-radius: 12px; border: none; background: var(--text-main); color: var(--surface-0); font-weight: 800; cursor: pointer; }

.pk-am-filters { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; padding: 16px 18px; }
.pk-am-chips { display: flex; gap: 6px; flex-wrap: wrap; }
.pk-am-chips button {
  display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; border-radius: 20px; cursor: pointer;
  border: 1px solid var(--border-color); background: var(--surface-0); color: var(--text-secondary); font-size: 0.78rem; font-weight: 700;
}
.pk-am-chips button i { width: 8px; height: 8px; border-radius: 50%; }
.pk-am-chips button span { color: var(--text-dim); font-size: 0.7rem; }
.pk-am-chips button.is-on { background: var(--text-main); color: var(--surface-0); border-color: var(--text-main); }
.pk-am-chips button.is-on span { color: inherit; opacity: 0.7; }
.pk-am-filtertools { display: flex; gap: 8px; }
.pk-am-search { display: inline-flex; align-items: center; gap: 7px; padding: 0 12px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--surface-1); color: var(--text-dim); }
.pk-am-search input { border: none; outline: none; background: transparent; padding: 8px 0; font-size: 0.8rem; color: var(--text-main); width: 160px; }

.pk-am-list { border-top: 1px solid var(--border-color); }
.pk-am-row {
  display: grid; grid-template-columns: minmax(0, 2.6fr) 1fr 0.8fr 1.1fr auto; gap: 16px; align-items: center;
  padding: 14px 20px; border-bottom: 1px solid var(--border-color);
}
.pk-am-row:last-child { border-bottom: none; }
.pk-am-row.is-dim .pk-am-prod, .pk-am-row.is-dim .pk-am-price { opacity: 0.55; }
.pk-am-head { padding-top: 12px; padding-bottom: 12px; background: var(--surface-2); font-size: 0.68rem; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; color: var(--text-dim); }
.pk-am-prod { display: flex; gap: 14px; align-items: center; min-width: 0; }
.pk-am-thumb {
  position: relative;
  width: 58px; height: 58px; flex-shrink: 0; border-radius: 12px; overflow: hidden; background: #fff; border: 1px solid var(--border-color);
  display: flex; align-items: center; justify-content: center; font-size: 1.3rem;
}
.pk-am-thumb.sm { width: 34px; height: 34px; border-radius: 8px; }
.pk-am-thumb img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; padding: 4px; background: #fff; }
.pk-am-title { font-weight: 700; font-size: 0.88rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 5px; }
.pk-am-meta { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; font-size: 0.72rem; color: var(--text-dim); }
.pk-am-store { padding: 2px 8px; border-radius: 20px; font-size: 0.62rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.3px; white-space: nowrap; }
.pk-am-badge { padding: 2px 7px; border-radius: 6px; background: rgba(229,9,20,0.08); color: var(--accent-main); font-weight: 700; }
.pk-am-warn { display: inline-flex; align-items: center; gap: 3px; color: #b45309; font-weight: 700; }
.pk-am-price { display: flex; flex-direction: column; gap: 2px; }
.pk-am-price strong { font-size: 0.95rem; }
.pk-am-price small { font-size: 0.72rem; color: var(--text-dim); }
.pk-am-price em { font-style: normal; color: #0f9d58; font-weight: 700; }
.pk-am-clicks { display: flex; flex-direction: column; gap: 2px; }
.pk-am-clicks strong { font-size: 0.95rem; }
.pk-am-clicks small { font-size: 0.7rem; color: var(--text-dim); }
.pk-am-status { display: flex; gap: 8px; align-items: center; }
.pk-am-switch {
  display: inline-flex; align-items: center; gap: 7px; padding: 6px 11px 6px 7px; border-radius: 20px; cursor: pointer;
  border: 1px solid var(--border-color); background: var(--surface-1); font-size: 0.74rem; font-weight: 700; color: var(--text-secondary);
}
.pk-am-switch i { width: 22px; height: 13px; border-radius: 10px; background: var(--surface-3); position: relative; transition: background 0.2s; }
.pk-am-switch i::after { content: ''; position: absolute; top: 2px; left: 2px; width: 9px; height: 9px; border-radius: 50%; background: #fff; transition: transform 0.2s; }
.pk-am-switch.is-on { color: #0f9d58; border-color: rgba(15,157,88,0.3); background: rgba(15,157,88,0.07); }
.pk-am-switch.is-on i { background: #0f9d58; }
.pk-am-switch.is-on i::after { transform: translateX(9px); }
.pk-am-star { width: 32px; height: 32px; border-radius: 9px; border: 1px solid var(--border-color); background: var(--surface-1); color: var(--text-dim); display: inline-flex; align-items: center; justify-content: center; cursor: pointer; }
.pk-am-star.is-on { background: rgba(245,158,11,0.12); border-color: rgba(245,158,11,0.4); }
.pk-am-actions { display: flex; gap: 6px; justify-content: flex-end; }
.pk-am-actions button, .pk-am-actions a {
  width: 32px; height: 32px; border-radius: 9px; border: 1px solid var(--border-color); background: var(--surface-1);
  color: var(--text-secondary); display: inline-flex; align-items: center; justify-content: center; cursor: pointer;
}
.pk-am-actions .is-danger { color: var(--accent-main); background: rgba(229,9,20,0.06); border-color: rgba(229,9,20,0.15); }

.pk-am-empty { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 48px 20px; text-align: center; color: var(--text-secondary); }
.pk-am-empty h3 { margin: 6px 0 0; font-size: 1.1rem; color: var(--text-main); }
.pk-am-empty p { margin: 0 0 8px; max-width: 420px; font-size: 0.86rem; line-height: 1.6; }

.pk-am-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; }
.pk-am-stat { position: relative; padding: 18px 20px; border-radius: 18px; background: var(--surface-1); border: 1px solid var(--border-color); }
.pk-am-stat-dot { position: absolute; top: 20px; right: 20px; width: 10px; height: 10px; border-radius: 50%; }
.pk-am-stat-label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-dim); }
.pk-am-stat-value { font-size: 1.7rem; font-weight: 900; margin: 6px 0 2px; }
.pk-am-stat-sub { font-size: 0.74rem; color: var(--text-dim); }
.pk-am-two { display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 20px; }
.pk-am-bar { display: grid; grid-template-columns: 80px 1fr 50px; gap: 12px; align-items: center; padding: 8px 0; font-size: 0.84rem; font-weight: 600; }
.pk-am-bar div { height: 10px; border-radius: 10px; background: var(--surface-2); overflow: hidden; }
.pk-am-bar i { display: block; height: 100%; border-radius: 10px; }
.pk-am-bar strong { text-align: right; }
.pk-am-top-item { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid var(--border-color); font-size: 0.84rem; }
.pk-am-top-item:last-child { border-bottom: none; }
.pk-am-rank { width: 22px; height: 22px; border-radius: 50%; background: var(--surface-2); display: inline-flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 800; flex-shrink: 0; }
.pk-am-top-title { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 600; }

.pk-am-savebar { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }
.pk-am-bigswitch, .pk-am-toggle { display: flex; gap: 12px; align-items: flex-start; cursor: pointer; }
.pk-am-bigswitch input, .pk-am-toggle input { width: 20px; height: 20px; margin-top: 2px; accent-color: var(--accent-main); flex-shrink: 0; }
.pk-am-bigswitch strong { display: block; font-size: 1rem; }
.pk-am-bigswitch small, .pk-am-toggle small { display: block; font-size: 0.74rem; color: var(--text-dim); margin-top: 2px; }
.pk-am-toggle { padding: 12px 14px; border-radius: 14px; background: var(--surface-1); border: 1px solid var(--border-color); }
.pk-am-toggle strong { font-size: 0.86rem; }
.pk-am-fields { display: flex; flex-direction: column; gap: 16px; }
.pk-am-label { margin-bottom: 7px; font-size: 0.7rem; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; color: var(--text-secondary); }
.pk-am-field input, .pk-am-field textarea, .pk-am-tester input {
  width: 100%; padding: 11px 14px; border-radius: 12px; font-size: 0.88rem; font-family: inherit; color: var(--text-main);
  background: var(--surface-1); border: 1px solid var(--border-color); outline: none; resize: vertical;
}
.pk-am-field input:focus, .pk-am-field textarea:focus, .pk-am-tester input:focus { border-color: var(--accent-main); background: var(--surface-0); }
.pk-am-field small { display: block; margin-top: 6px; font-size: 0.7rem; color: var(--text-muted); line-height: 1.5; }
.pk-am-tester { padding: 14px; border-radius: 14px; background: var(--surface-2); border: 1px dashed var(--border-color); }
.pk-am-tested { display: flex; gap: 8px; align-items: flex-start; margin-top: 10px; }
.pk-am-tested code { font-size: 0.74rem; word-break: break-all; line-height: 1.5; }
.pk-am-steps { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
.pk-am-steps li { display: flex; gap: 10px; align-items: flex-start; font-size: 0.86rem; line-height: 1.6; color: var(--text-secondary); }
.pk-am-steps li > svg { color: #0f9d58; margin-top: 3px; }
.pk-am-steps b { color: var(--text-main); }
.pk-am-steps code { font-size: 0.8rem; background: var(--surface-2); padding: 1px 5px; border-radius: 5px; }

@media (max-width: 1100px) {
  .pk-am-row { grid-template-columns: minmax(0, 1fr) auto; grid-template-areas: 'prod actions' 'price status' 'clicks status'; gap: 10px 14px; padding: 14px 16px; }
  .pk-am-prod { grid-area: prod; }
  .pk-am-price { grid-area: price; flex-direction: row; align-items: baseline; gap: 8px; }
  .pk-am-clicks { grid-area: clicks; flex-direction: row; align-items: baseline; gap: 6px; }
  .pk-am-status { grid-area: status; justify-content: flex-end; align-self: center; }
  .pk-am-actions { grid-area: actions; align-self: start; }
  .pk-am-thumb { width: 48px; height: 48px; }
}
@media (max-width: 640px) {
  .pk-am-top { flex-direction: column; align-items: stretch; }
  .pk-am-tabs { width: 100%; }
  .pk-am-tabs button { flex: 1; justify-content: center; padding: 9px 8px; }
  .pk-am-topactions > * { flex: 1; justify-content: center; }
  .pk-am-filtertools { width: 100%; }
  .pk-am-search { flex: 1; }
  .pk-am-search input { width: 100%; }
  .pk-am-row { grid-template-areas: 'prod prod' 'price status' 'clicks actions'; }
  .pk-am-actions { align-self: center; }
  .pk-am-two { grid-template-columns: 1fr; }
  .pk-am-alert { flex-wrap: wrap; }
  .pk-am-quick { margin: 14px 14px 0; }
}
`;
