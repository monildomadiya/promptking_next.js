"use client";
import toast from 'react-hot-toast';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import api from '@/lib/api';
import { X, Save, Zap, ExternalLink, Check, AlertCircle, Copy } from '../Common/Icons';
import AffiliateProductCard, { productCardStyles } from '@/components/Affiliate/ProductCard';
import {
  STORES,
  STORE_IDS,
  buildAffiliateUrl,
  cleanProductUrl,
  detectStore,
  discountPercent,
  extractProductId,
  isShortLink,
  parseUrl,
} from '@/lib/affiliateLinks';

const BADGES = ['Best Seller', 'Deal of the Day', "Editor's Choice", 'Budget Pick', 'Premium Pick', 'Limited Time', 'New Launch'];

const EMPTY = {
  title: '', slug: '', description: '', store: 'amazon', product_url: '', affiliate_url: '',
  external_id: '', image_url: '', price: '', mrp: '', currency: 'INR', rating: '', review_count: '',
  badge: '', category: '', tags: '', is_active: true, is_featured: false, sort_order: 0, deal_ends_at: '',
};

/** MySQL DATETIME → the value a datetime-local input wants, in local time. */
const toLocalInput = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const AffiliateProductModal = ({ product, initialUrl = '', settings = {}, categories = [], onClose, onSave }) => {
  const [form, setForm] = useState(EMPTY);
  const [isSaving, setIsSaving] = useState(false);
  const [lookup, setLookup] = useState({ state: 'idle', note: null });
  const [priceChecked, setPriceChecked] = useState(false);
  const lastLookedUp = useRef('');

  useEffect(() => {
    if (!product) return;
    setForm({
      ...EMPTY,
      ...product,
      price: product.price ?? '',
      mrp: product.mrp ?? '',
      rating: product.rating ?? '',
      review_count: product.review_count ?? '',
      affiliate_url: product.affiliate_url || '',
      description: product.description || '',
      tags: product.tags || '',
      badge: product.badge || '',
      category: product.category || '',
      image_url: product.image_url || '',
      deal_ends_at: toLocalInput(product.deal_ends_at),
    });
    lastLookedUp.current = product.product_url || '';
  }, [product]);

  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  // Opened from the Quick add box: the link is already known, so fetch at once.
  useEffect(() => {
    if (product || !initialUrl || !parseUrl(initialUrl)) return;
    setForm((prev) => ({ ...prev, product_url: initialUrl, store: detectStore(initialUrl) }));
    runLookup(initialUrl);
    // Once, on open — runLookup is recreated every render.
  }, []);

  // Escape closes, like every other admin modal.
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const detected = useMemo(() => {
    const url = parseUrl(form.product_url);
    if (!url) return null;
    const store = detectStore(url.href);
    return { store, id: extractProductId(url.href, store), short: isShortLink(url.href) };
  }, [form.product_url]);

  const finalLink = useMemo(
    () => buildAffiliateUrl({ store: form.store, product_url: form.product_url, affiliate_url: form.affiliate_url }, settings),
    [form.store, form.product_url, form.affiliate_url, settings]
  );

  const tagMissing = !form.affiliate_url && !detected?.short && (
    (form.store === 'amazon' && !settings.amazon_tag) || (form.store === 'flipkart' && !settings.flipkart_affid)
  );

  /**
   * Paste a link, get a filled form. Only empty fields are filled on a new
   * product; on an existing one the admin asked for fresh numbers, so price,
   * MRP and rating are refreshed and everything they typed is left alone.
   */
  const runLookup = async (rawUrl = form.product_url) => {
    if (!parseUrl(rawUrl)) return toast.error('Paste a product link first.');
    setLookup({ state: 'loading', note: null });
    lastLookedUp.current = rawUrl;
    try {
      const { data } = await api.post('/admin/affiliate_lookup', { url: rawUrl });
      setForm((prev) => {
        const next = { ...prev, store: data.store || prev.store, product_url: data.product_url || prev.product_url };
        if (data.external_id) next.external_id = data.external_id;
        const fillEmpty = ['title', 'image_url', 'description'];
        for (const key of fillEmpty) if (!prev[key] && data[key]) next[key] = key === 'description' ? String(data[key]).slice(0, 300) : data[key];
        for (const key of ['price', 'mrp', 'rating', 'review_count']) {
          if (data[key] && (!prev[key] || product)) next[key] = data[key];
        }
        if (data.currency) next.currency = data.currency;
        return next;
      });
      if (data.price) setPriceChecked(true);
      setLookup({ state: data.fetched ? 'done' : 'partial', note: data.note });
    } catch (e) {
      setLookup({ state: 'error', note: e.message });
    }
  };

  const onLinkPaste = (e) => {
    const text = e.clipboardData?.getData('text')?.trim();
    if (!text || !parseUrl(text)) return;
    // Let the paste land in the input, then fetch. New products only — on an
    // edit a paste is usually a correction, and the Fetch button is right there.
    setTimeout(() => {
      const store = detectStore(text);
      set({ store });
      if (!product && text !== lastLookedUp.current) runLookup(text);
    }, 0);
  };

  const onLinkBlur = () => {
    const url = parseUrl(form.product_url);
    if (!url) return;
    const store = detectStore(url.href);
    set({ store: store === 'other' && form.store !== 'other' && STORES[form.store] ? form.store : store, product_url: cleanProductUrl(url.href) });
  };

  const handleSave = async () => {
    if (!form.title?.trim()) return toast.error('Title is required.');
    if (!parseUrl(form.product_url)) return toast.error('A valid product link is required.');
    setIsSaving(true);
    try {
      const payload = {
        ...form,
        price_checked: priceChecked,
        deal_ends_at: form.deal_ends_at ? new Date(form.deal_ends_at).toISOString() : null,
      };
      const res = await api.post('/admin/save_affiliate_product', payload);
      if (res.data?.success) {
        toast.success(product ? 'Product updated' : 'Product added');
        onSave();
      } else {
        toast.error(res.data?.error || 'Save failed');
      }
    } catch (e) {
      toast.error('Save failed: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Mirrors shapeProduct in lib/affiliate.js: Amazon cards never show these.
  const isAmazon = form.store === 'amazon';
  const discount = isAmazon ? 0 : discountPercent(form.price, form.mrp);
  const preview = {
    id: 0,
    slug: form.slug || 'preview',
    title: form.title || 'Product title appears here',
    store: form.store,
    image: form.image_url || null,
    price: isAmazon ? null : Number(form.price) || null,
    mrp: isAmazon ? null : Number(form.mrp) || null,
    currency: form.currency || 'INR',
    discount,
    rating: isAmazon ? null : Number(form.rating) || null,
    reviewCount: isAmazon ? null : Number(form.review_count) || null,
    badge: form.badge || null,
    dealEndsAt: form.deal_ends_at ? new Date(form.deal_ends_at).toISOString() : null,
    tags: [],
  };

  const copy = (text) => {
    navigator.clipboard?.writeText(text).then(() => toast.success('Copied'), () => toast.error('Copy failed'));
  };

  return (
    <div className="pk-apm-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <style>{productCardStyles + styles}</style>
      <div className="pk-apm" role="dialog" aria-modal="true" aria-label={product ? 'Edit product' : 'Add product'}>
        <header className="pk-apm-head">
          <div>
            <h2>{product ? 'Edit affiliate product' : 'Add affiliate product'}</h2>
            <p>Paste an Amazon or Flipkart link — the store, product ID and your affiliate tag are set for you.</p>
          </div>
          <button type="button" className="pk-apm-x" onClick={onClose} aria-label="Close"><X size={22} /></button>
        </header>

        <div className="pk-apm-body">
          <div className="pk-apm-form">
            {/* ── Step 1: the link ─────────────────────────────────────── */}
            <section className="pk-apm-link">
              <label className="pk-apm-label">Product link</label>
              <div className="pk-apm-linkrow">
                <input
                  className="pk-apm-input"
                  type="url"
                  value={form.product_url}
                  placeholder="https://www.amazon.in/dp/B0... or https://www.flipkart.com/...?pid=..."
                  onChange={(e) => set({ product_url: e.target.value })}
                  onPaste={onLinkPaste}
                  onBlur={onLinkBlur}
                  autoFocus={!product}
                />
                <button type="button" className="pk-apm-fetch" onClick={() => runLookup()} disabled={lookup.state === 'loading'}>
                  <Zap size={15} /> {lookup.state === 'loading' ? 'Checking…' : 'Check link'}
                </button>
              </div>

              {detected && (
                <div className="pk-apm-detect">
                  <span className="pk-apm-storechip" style={{ background: STORES[detected.store]?.color, color: STORES[detected.store]?.ink }}>
                    {STORES[detected.store]?.label || 'Store'}
                  </span>
                  {detected.id && <span className="pk-apm-mono">{detected.store === 'amazon' ? 'ASIN' : 'PID'}: {detected.id}</span>}
                  {detected.short && <span className="pk-apm-muted">Short link — used as-is</span>}
                </div>
              )}

              {lookup.note && (
                <div className={`pk-apm-note ${lookup.state === 'error' ? 'is-error' : ''}`}>
                  <AlertCircle size={14} /> <span>{lookup.note}</span>
                </div>
              )}

              {finalLink && (
                <div className="pk-apm-final">
                  <div className="pk-apm-final-top">
                    <span>Visitors are sent to</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button type="button" onClick={() => copy(finalLink)} title="Copy"><Copy size={13} /></button>
                      <a href={finalLink} target="_blank" rel="noopener noreferrer" title="Open"><ExternalLink size={13} /></a>
                    </div>
                  </div>
                  <code>{finalLink}</code>
                  {tagMissing ? (
                    <small className="is-warn"><AlertCircle size={12} /> No {STORES[form.store].label} affiliate ID in Setup yet — this link earns nothing until you add one.</small>
                  ) : (
                    <small className="is-ok"><Check size={12} /> {form.affiliate_url ? 'Using your custom link' : detected?.short ? 'Short link kept as-is' : 'Affiliate tag applied automatically'}</small>
                  )}
                </div>
              )}
            </section>

            {/* ── Step 2: what the card shows ──────────────────────────── */}
            <section className="pk-apm-grid">
              <div className="pk-apm-span2">
                <label className="pk-apm-label">Title</label>
                <input className="pk-apm-input" value={form.title} onChange={(e) => set({ title: e.target.value })} placeholder="boAt Rockerz 450 Bluetooth Headphones" />
              </div>

              <div className="pk-apm-span2">
                <label className="pk-apm-label">Image URL</label>
                <div className="pk-apm-imgrow">
                  {form.image_url ? <img key={form.image_url} src={form.image_url} alt="" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} /> : <span className="pk-apm-imgph" />}
                  <input className="pk-apm-input" value={form.image_url} onChange={(e) => set({ image_url: e.target.value })} placeholder="https://m.media-amazon.com/images/I/....jpg" />
                </div>
              </div>

              {isAmazon ? (
                <div className="pk-apm-span2 pk-apm-policy">
                  <AlertCircle size={15} />
                  <span>
                    <b>Amazon rule:</b> prices, discounts and star ratings may only come live from Amazon&apos;s
                    Product Advertising API, so the site shows <i>“See price on Amazon”</i> instead. Use the
                    image link from Amazon&apos;s <b>SiteStripe</b> bar (Get Link → Image).
                  </span>
                </div>
              ) : (<>
              <div>
                <label className="pk-apm-label">Price (₹)</label>
                <input className="pk-apm-input" inputMode="decimal" value={form.price} onChange={(e) => { set({ price: e.target.value }); setPriceChecked(true); }} placeholder="1499" />
              </div>
              <div>
                <label className="pk-apm-label">MRP (₹) {discount > 0 && <em className="pk-apm-off">{discount}% off</em>}</label>
                <input className="pk-apm-input" inputMode="decimal" value={form.mrp} onChange={(e) => { set({ mrp: e.target.value }); setPriceChecked(true); }} placeholder="3990" />
              </div>

              <div>
                <label className="pk-apm-label">Rating (0–5)</label>
                <input className="pk-apm-input" inputMode="decimal" value={form.rating} onChange={(e) => set({ rating: e.target.value })} placeholder="4.2" />
              </div>
              <div>
                <label className="pk-apm-label">Ratings count</label>
                <input className="pk-apm-input" inputMode="numeric" value={form.review_count} onChange={(e) => set({ review_count: e.target.value })} placeholder="12840" />
              </div>
              </>)}

              <div>
                <label className="pk-apm-label">Store</label>
                <select className="pk-apm-input" value={form.store} onChange={(e) => set({ store: e.target.value })}>
                  {STORE_IDS.map((id) => <option key={id} value={id}>{id === 'other' ? 'Other store' : STORES[id].label}</option>)}
                </select>
              </div>
              <div>
                <label className="pk-apm-label">Category</label>
                <input className="pk-apm-input" list="pk-apm-cats" value={form.category} onChange={(e) => set({ category: e.target.value })} placeholder="Headphones" />
                <datalist id="pk-apm-cats">{categories.map((c) => <option key={c} value={c} />)}</datalist>
              </div>

              <div>
                <label className="pk-apm-label">Badge</label>
                <input className="pk-apm-input" list="pk-apm-badges" value={form.badge} onChange={(e) => set({ badge: e.target.value })} placeholder="Best Seller" />
                <datalist id="pk-apm-badges">{BADGES.map((b) => <option key={b} value={b} />)}</datalist>
              </div>
              <div>
                <label className="pk-apm-label">Deal ends (optional)</label>
                <input className="pk-apm-input" type="datetime-local" value={form.deal_ends_at} onChange={(e) => set({ deal_ends_at: e.target.value })} />
              </div>

              <div className="pk-apm-span2">
                <label className="pk-apm-label">Match tags</label>
                <input className="pk-apm-input" value={form.tags} onChange={(e) => set({ tags: e.target.value })} placeholder="photography, portrait, youtube, midjourney" />
                <small className="pk-apm-hint">Comma separated. Prompt pages with these tags (or words in their title) show this product in “Recommended for this prompt”.</small>
              </div>

              <div className="pk-apm-span2">
                <label className="pk-apm-label">Short note (optional)</label>
                <textarea className="pk-apm-input" rows={2} value={form.description} onChange={(e) => set({ description: e.target.value })} placeholder="Why you recommend it — shown to you in the admin and in structured data." />
              </div>

              <details className="pk-apm-span2 pk-apm-adv">
                <summary>Advanced</summary>
                <div className="pk-apm-grid" style={{ marginTop: 12 }}>
                  <div className="pk-apm-span2">
                    <label className="pk-apm-label">Custom affiliate link (overrides auto-tagging)</label>
                    <input className="pk-apm-input" value={form.affiliate_url} onChange={(e) => set({ affiliate_url: e.target.value })} placeholder="https://amzn.to/xxxx  ·  EarnKaro / Cuelinks / fkrt.it link" />
                  </div>
                  <div>
                    <label className="pk-apm-label">URL slug</label>
                    <input className="pk-apm-input" value={form.slug} onChange={(e) => set({ slug: e.target.value })} placeholder="auto from title" />
                    <small className="pk-apm-hint">Button links to /go/{form.slug || 'your-slug'}</small>
                  </div>
                  <div>
                    <label className="pk-apm-label">Sort order</label>
                    <input className="pk-apm-input" type="number" value={form.sort_order ?? 0} onChange={(e) => set({ sort_order: e.target.value })} />
                    <small className="pk-apm-hint">Lower shows first (after featured).</small>
                  </div>
                </div>
              </details>
            </section>
          </div>

          {/* ── Live preview ─────────────────────────────────────────── */}
          <aside className="pk-apm-side">
            <div className="pk-apm-label">Live preview</div>
            <div className="pk-apm-preview" onClickCapture={(e) => e.preventDefault()}>
              <AffiliateProductCard product={preview} />
            </div>

            <label className="pk-apm-switch">
              <input type="checkbox" checked={!!form.is_active} onChange={(e) => set({ is_active: e.target.checked })} />
              <span><strong>Live on site</strong><small>Off hides it everywhere and /go/ redirects to /deals</small></span>
            </label>
            <label className="pk-apm-switch">
              <input type="checkbox" checked={!!form.is_featured} onChange={(e) => set({ is_featured: e.target.checked })} />
              <span><strong>Featured</strong><small>Shown first, and on prompt pages with no better match</small></span>
            </label>
          </aside>
        </div>

        <footer className="pk-apm-foot">
          <button type="button" className="pk-apm-cancel" onClick={onClose}>Cancel</button>
          <button type="button" className="pk-apm-save" onClick={handleSave} disabled={isSaving}>
            <Save size={16} /> {isSaving ? 'Saving…' : product ? 'Save changes' : 'Add product'}
          </button>
        </footer>
      </div>
    </div>
  );
};

const styles = `
.pk-apm-overlay {
  position: fixed; inset: 0; z-index: 9999; background: rgba(15,23,42,0.55); backdrop-filter: blur(6px);
  display: flex; align-items: flex-start; justify-content: center; padding: 28px 16px; overflow-y: auto;
}
.pk-apm {
  width: 100%; max-width: 1040px; background: var(--surface-0); color: var(--text-main);
  border: 1px solid var(--border-color); border-radius: 24px; box-shadow: 0 30px 80px rgba(15,23,42,0.25);
  display: flex; flex-direction: column;
}
.pk-apm-head { display: flex; justify-content: space-between; gap: 16px; padding: 24px 28px 18px; border-bottom: 1px solid var(--border-color); }
.pk-apm-head h2 { margin: 0 0 4px; font-size: 1.2rem; font-weight: 900; }
.pk-apm-head p { margin: 0; font-size: 0.82rem; color: var(--text-dim); }
.pk-apm-x { background: none; border: none; color: var(--text-dim); cursor: pointer; align-self: flex-start; }
.pk-apm-body { display: grid; grid-template-columns: minmax(0, 1fr) 280px; gap: 26px; padding: 22px 28px; }
.pk-apm-form { display: flex; flex-direction: column; gap: 22px; min-width: 0; }
.pk-apm-label { display: flex; align-items: center; gap: 8px; margin-bottom: 7px; font-size: 0.7rem; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; color: var(--text-secondary); }
.pk-apm-input {
  width: 100%; padding: 11px 14px; border-radius: 12px; font-size: 0.88rem; font-family: inherit;
  color: var(--text-main); background: var(--surface-1); border: 1px solid var(--border-color); outline: none;
  transition: border-color 0.2s ease, background 0.2s ease;
}
.pk-apm-input:focus { border-color: var(--accent-main); background: var(--surface-0); }
textarea.pk-apm-input { resize: vertical; }
.pk-apm-hint { display: block; margin-top: 6px; font-size: 0.7rem; color: var(--text-muted); }

.pk-apm-link { padding: 18px; border-radius: 18px; background: linear-gradient(135deg, rgba(255,153,0,0.07), rgba(40,116,240,0.07)); border: 1px solid var(--border-color); }
.pk-apm-linkrow { display: flex; gap: 10px; }
.pk-apm-fetch {
  display: inline-flex; align-items: center; gap: 7px; flex-shrink: 0; padding: 0 18px; border-radius: 12px; border: none;
  background: var(--text-main); color: var(--surface-0); font-weight: 800; font-size: 0.82rem; cursor: pointer;
}
.pk-apm-fetch:disabled { opacity: 0.6; cursor: wait; }
.pk-apm-detect { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 10px; }
.pk-apm-storechip { padding: 4px 10px; border-radius: 20px; font-size: 0.68rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.4px; }
.pk-apm-mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.75rem; color: var(--text-secondary); background: var(--surface-0); padding: 3px 8px; border-radius: 6px; border: 1px solid var(--border-color); }
.pk-apm-muted { font-size: 0.74rem; color: var(--text-dim); }
.pk-apm-note { display: flex; gap: 8px; align-items: flex-start; margin-top: 10px; font-size: 0.76rem; line-height: 1.5; color: #92400e; background: rgba(245,158,11,0.1); padding: 9px 12px; border-radius: 10px; }
.pk-apm-note.is-error { color: #b91c1c; background: rgba(239,68,68,0.08); }
.pk-apm-final { margin-top: 12px; padding: 12px; border-radius: 12px; background: var(--surface-0); border: 1px solid var(--border-color); }
.pk-apm-final-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-size: 0.68rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.4px; color: var(--text-dim); }
.pk-apm-final-top button, .pk-apm-final-top a {
  display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 7px;
  border: 1px solid var(--border-color); background: var(--surface-1); color: var(--text-secondary); cursor: pointer;
}
.pk-apm-final code { display: block; font-size: 0.74rem; word-break: break-all; color: var(--text-main); line-height: 1.5; }
.pk-apm-final small { display: flex; align-items: center; gap: 5px; margin-top: 8px; font-size: 0.72rem; font-weight: 700; }
.pk-apm-final small.is-ok { color: #0f9d58; }
.pk-apm-final small.is-warn { color: #b45309; }

.pk-apm-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.pk-apm-span2 { grid-column: 1 / -1; }
.pk-apm-imgrow { display: flex; gap: 10px; align-items: center; }
.pk-apm-imgrow img, .pk-apm-imgph { width: 44px; height: 44px; flex-shrink: 0; border-radius: 10px; object-fit: contain; background: #fff; border: 1px solid var(--border-color); }
.pk-apm-off { font-style: normal; color: #0f9d58; text-transform: none; letter-spacing: 0; }
.pk-apm-policy {
  display: flex; gap: 10px; align-items: flex-start; padding: 12px 14px; border-radius: 12px;
  background: rgba(255,153,0,0.09); border: 1px solid rgba(255,153,0,0.3);
  font-size: 0.78rem; line-height: 1.55; color: #7c4a03;
}
.pk-apm-policy svg { flex-shrink: 0; margin-top: 2px; }
.pk-apm-adv summary { cursor: pointer; font-size: 0.78rem; font-weight: 800; color: var(--text-secondary); }

.pk-apm-side { display: flex; flex-direction: column; gap: 14px; }
.pk-apm-preview { pointer-events: auto; }
.pk-apm-preview .pk-aff-card { cursor: default; }
.pk-apm-switch {
  display: flex; gap: 12px; align-items: flex-start; padding: 12px 14px; border-radius: 14px; cursor: pointer;
  background: var(--surface-1); border: 1px solid var(--border-color);
}
.pk-apm-switch input { width: 18px; height: 18px; margin-top: 2px; accent-color: var(--accent-main); flex-shrink: 0; }
.pk-apm-switch strong { display: block; font-size: 0.84rem; }
.pk-apm-switch small { display: block; font-size: 0.7rem; color: var(--text-dim); margin-top: 2px; }

.pk-apm-foot { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 28px 22px; border-top: 1px solid var(--border-color); }
.pk-apm-cancel { padding: 12px 20px; border-radius: 12px; background: var(--surface-1); color: var(--text-secondary); border: 1px solid var(--border-color); font-weight: 700; cursor: pointer; }
.pk-apm-save { display: inline-flex; align-items: center; gap: 8px; padding: 12px 22px; border-radius: 12px; background: var(--accent-main); color: #fff; border: none; font-weight: 800; cursor: pointer; }
.pk-apm-save:disabled { opacity: 0.7; }

@media (max-width: 860px) {
  .pk-apm-body { grid-template-columns: 1fr; padding: 18px; }
  .pk-apm-side { order: -1; display: grid; grid-template-columns: 170px 1fr; align-items: start; }
  .pk-apm-side > .pk-apm-label { grid-column: 1 / -1; }
  .pk-apm-preview { grid-row: span 2; }
  .pk-apm-head, .pk-apm-foot { padding-left: 18px; padding-right: 18px; }
}
@media (max-width: 520px) {
  .pk-apm-grid { grid-template-columns: 1fr; }
  .pk-apm-linkrow { flex-direction: column; }
  .pk-apm-fetch { padding: 11px; justify-content: center; }
  .pk-apm-side { grid-template-columns: 1fr; }
  .pk-apm-preview { max-width: 220px; }
}
`;

export default AffiliateProductModal;
