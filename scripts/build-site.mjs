#!/usr/bin/env node
// サンプルサイトを組み立てる。依存パッケージなし。
//   node scripts/build-site.mjs [出力先]   … 既定の出力先は _site/（公開は scripts/publish-site.sh）
// 文面は docs/ と README.md・CHANGELOG.md の Markdown をそのまま HTML にする。
// デモや見本の HTML は site/ に置き、ここで各ページに差し込む。
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, posix, resolve as resolvePath, relative, isAbsolute } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolvePath(root, process.argv[2] || '_site');
// 出力先は書き出す前に消すので、リポジトリそのものやその親を指していたら止める
{
  const rel = relative(out, root);
  if (rel === '' || (!rel.startsWith('..') && !isAbsolute(rel))) {
    console.error(`出力先がリポジトリかその親になっている: ${out}`);
    process.exit(1);
  }
  // リポジトリの中なら _site だけに書き出す（docs/ などを消さないため）
  const inner = relative(root, out);
  if (!inner.startsWith('..') && !isAbsolute(inner) && inner.split(/[\\/]/)[0] !== '_site') {
    console.error(`リポジトリの中では _site/ にだけ書き出せる: ${out}`);
    process.exit(1);
  }
}
const read = (p) => readFileSync(join(root, p), 'utf8');
const pkg = JSON.parse(read('package.json'));
const tokens = JSON.parse(read('tokens/tokens.json'));
const REPO = 'https://github.com/aki-kii/muse-design-system';

// ---------------------------------------------------------------- Markdown

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// GitHub と同じ見出しのアンカー
const slugify = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\p{M}\s_-]/gu, '')
    .replace(/\s/g, '-');
const plain = (s) => s.replace(/`([^`]*)`/g, '$1').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/\*\*/g, '');

// 元の Markdown のパス（リポジトリ内）→ サイトのパス
function outPathOf(repoPath) {
  if (repoPath === 'README.md') return 'index.html';
  if (repoPath === 'CHANGELOG.md') return 'changelog.html';
  if (repoPath.startsWith('docs/') && repoPath.endsWith('.md')) {
    const p = repoPath.slice(5);
    return p.endsWith('README.md') ? p.replace(/README\.md$/, 'index.html') : p.replace(/\.md$/, '.html');
  }
  return null;
}

function makeLinker(srcRepoPath, pageOut) {
  return (url) => {
    if (/^[a-z]+:/i.test(url)) return { href: url, external: true };
    const [p, hash] = url.split('#');
    if (!p) return { href: '#' + (hash || '') };
    const repoPath = posix.normalize(posix.join(posix.dirname(srcRepoPath), p));
    const target = outPathOf(repoPath);
    let href;
    if (target) {
      href = posix.relative(posix.dirname(pageOut), target) || posix.basename(target);
    } else {
      href = `${REPO}/blob/main/${repoPath}`;
    }
    return { href: href + (hash ? '#' + hash : ''), external: !target };
  };
}

function inline(s, link) {
  const codes = [];
  s = s.replace(/`([^`]+)`/g, (_, c) => `\u0000${codes.push(c) - 1}\u0000`);
  s = esc(s);
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, text, url) => {
    const { href, external } = link(url.replace(/&amp;/g, '&'));
    return `<a href="${esc(href)}"${external ? ' rel="noopener"' : ''}>${text}</a>`;
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${esc(codes[+i])}</code>`);
  return s;
}

function markdown(src, { link, skipH1 = false }) {
  const lines = src.replace(/<!--[\s\S]*?-->/g, '').split('\n');
  const html = [];
  const seen = new Map();
  let title = '';
  let i = 0;
  const cells = (l) => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    let m;
    if ((m = line.match(/^```(\w*)/))) {
      const body = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) body.push(lines[i++]);
      i++;
      html.push(`<pre class="code"><code${m[1] ? ` data-lang="${m[1]}"` : ''}>${esc(body.join('\n'))}</code></pre>`);
      continue;
    }
    if ((m = line.match(/^(#{1,6})\s+(.*)$/))) {
      const level = m[1].length;
      const text = m[2].trim();
      if (level === 1) {
        title = plain(text);
        i++;
        if (skipH1) continue;
      }
      let id = slugify(plain(text));
      const n = seen.get(id) || 0;
      seen.set(id, n + 1);
      if (n) id = `${id}-${n}`;
      html.push(`<h${level} id="${esc(id)}">${inline(text, link)}${level > 1 ? `<a class="anchor" href="#${esc(id)}" aria-label="この見出しへのリンク">#</a>` : ''}</h${level}>`);
      i++;
      continue;
    }
    if (line.trim().startsWith('|') && lines[i + 1] && /^\s*\|?\s*:?-{3,}/.test(lines[i + 1])) {
      const head = cells(line);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) rows.push(cells(lines[i++]));
      html.push(
        `<div class="table-wrap"><table><thead><tr>${head.map((c) => `<th scope="col">${inline(c, link)}</th>`).join('')}</tr></thead><tbody>` +
          rows.map((r) => `<tr>${r.map((c) => `<td>${inline(c, link)}</td>`).join('')}</tr>`).join('') +
          '</tbody></table></div>'
      );
      continue;
    }
    if (/^\s*([-*]|\d+\.)\s+/.test(line)) {
      const ordered = /^\s*\d+\./.test(line);
      const items = [];
      while (i < lines.length && /^\s*([-*]|\d+\.)\s+/.test(lines[i])) {
        let item = lines[i++].replace(/^\s*([-*]|\d+\.)\s+/, '');
        while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !/^\s*([-*]|\d+\.)\s+/.test(lines[i])) item += '\n' + lines[i++].trim();
        items.push(item);
      }
      const tag = ordered ? 'ol' : 'ul';
      html.push(`<${tag}>${items.map((t) => `<li>${inline(t, link)}</li>`).join('')}</${tag}>`);
      continue;
    }
    const para = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,6}\s|```|\s*\||\s*([-*]|\d+\.)\s+)/.test(lines[i])) para.push(lines[i++]);
    if (!para.length) { html.push(`<p>${inline(lines[i++], link)}</p>`); continue; }
    html.push(`<p>${inline(para.join('\n'), link)}</p>`);
  }
  return { title, html: html.join('\n') };
}

// 見出し（id）の節の終わり（次の同じか上の階層の見出しの前）に HTML を差し込む
function insertAtSectionEnd(html, id, fragment) {
  const start = html.indexOf(`id="${id}"`);
  if (start < 0) throw new Error(`見出しが見つからない: #${id}`);
  const level = html.lastIndexOf('<h', start);
  const lv = +html[level + 2];
  const re = new RegExp(`<h[1-${lv}][ >]`, 'g');
  re.lastIndex = start;
  const next = re.exec(html);
  const at = next ? next.index : html.length;
  return html.slice(0, at) + fragment + '\n' + html.slice(at);
}
// 見出しの直後（最初の段落の後ではなく、見出しのすぐ後）に差し込む
function insertAfterHeading(html, id, fragment) {
  const start = html.indexOf(`id="${id}"`);
  if (start < 0) throw new Error(`見出しが見つからない: #${id}`);
  const end = html.indexOf('</h', start);
  const close = html.indexOf('>', end) + 1;
  return html.slice(0, close) + '\n' + fragment + html.slice(close);
}

// ---------------------------------------------------------------- トークン

const getTok = (path) => path.split('.').reduce((o, k) => o?.[k], tokens);
const resolve = (v) => {
  const m = typeof v === 'string' && v.match(/^\{(.+)\}$/);
  return m ? resolve(getTok(m[1]).$value) : v;
};
const semColors = Object.entries(tokens.semantic.color)
  .filter(([k]) => !k.startsWith('$'))
  .map(([k, t]) => ({
    name: `--${k}`,
    light: resolve(t.$value),
    dark: resolve(t.$extensions?.['com.muse.modes']?.dark ?? t.$value),
    hasDark: !!t.$extensions?.['com.muse.modes']?.dark,
    desc: t.$description || '',
  }));

// ---------------------------------------------------------------- ページの一覧

// 一覧の表（| [名前](slug.md) | 一言 | … |）を読む。### の見出しごとにまとまりを分ける。
// section を渡すと、その ## の節の中だけを読む（components/README.md の「一覧」）。
function parseCatalog(src, section) {
  const groups = [];
  let group = { title: '', items: [] };
  groups.push(group);
  let inSection = !section;
  for (const line of src.split('\n')) {
    const h2 = line.match(/^##\s+(.*)/);
    if (h2) { if (inSection && section) break; inSection = h2[1].trim() === section; continue; }
    if (!inSection) continue;
    const h = line.match(/^###\s+(.*)/);
    if (h) { group = { title: h[1].trim(), items: [] }; groups.push(group); continue; }
    const r = line.match(/^\|\s*\[([^\]]+)\]\(([\w-]+)\.md\)\s*\|\s*(.*?)\s*\|/);
    if (r) group.items.push({ name: r[1], slug: r[2], summary: r[3] });
  }
  return groups.filter((g) => g.items.length);
}
const compGroups = parseCatalog(read('docs/components/README.md'), '一覧');
const components = compGroups.flatMap((g) => g.items);
for (const c of components) c.dir = 'components';
// アプリ固有の複合体（docs/patterns/<アプリ>/README.md の表）
const APPS = [
  { id: 'learning-note', title: '学習ノートの複合体' },
  { id: 'slide-editor', title: 'スライドエディタの複合体' },
];
for (const a of APPS) {
  a.items = parseCatalog(read(`docs/patterns/${a.id}/README.md`)).flatMap((g) => g.items);
  for (const c of a.items) c.dir = `patterns/${a.id}`;
}
const composites = APPS.flatMap((a) => a.items);
// コンポーネントから移した部品（元の URL に転送のページを残す）
const moved = [...read('docs/components/README.md').matchAll(/^\|\s*\[([^\]]+)\]\(\.\.\/patterns\/([\w-]+)\/([\w-]+)\.md\)/gm)]
  .map(([, name, app, slug]) => ({ name, app, slug }));

const pages = [];
const page = (o) => (pages.push(o), o);
page({ out: 'index.html', title: 'Muse Design System', nav: '概要', section: 'start', kind: 'home' });
page({ out: 'getting-started.html', src: 'README.md', title: '使い方', section: 'start', kind: 'readme' });
page({ out: 'principles.html', src: 'docs/principles.md', section: 'start' });
page({ out: 'foundations/index.html', src: 'docs/foundations/README.md', section: 'foundations', nav: 'ファウンデーションの考え方' });
for (const f of ['color', 'typography', 'spacing-radius-elevation', 'icons', 'accessibility'])
  page({ out: `foundations/${f}.html`, src: `docs/foundations/${f}.md`, section: 'foundations' });
page({ out: 'components/index.html', src: 'docs/components/README.md', section: 'components', nav: 'コンポーネント一覧', kind: 'catalog' });
for (const c of components)
  page({ out: `components/${c.slug}.html`, src: `docs/components/${c.slug}.md`, section: 'components', comp: c, list: components });
page({ out: 'components/_template.html', src: 'docs/components/_template.md', section: 'components', hidden: true });
for (const m of moved)
  page({ out: `components/${m.slug}.html`, src: `docs/components/${m.slug}.md`, section: 'components', hidden: true, kind: 'moved', to: `patterns/${m.app}/${m.slug}.html` });
page({ out: 'patterns.html', src: 'docs/patterns.md', section: 'patterns', nav: 'パターン一覧' });
for (const a of APPS) {
  a.page = page({ out: `patterns/${a.id}/index.html`, src: `docs/patterns/${a.id}/README.md`, section: 'patterns', nav: '一覧', kind: 'catalog', app: a });
  for (const c of a.items)
    page({ out: `patterns/${a.id}/${c.slug}.html`, src: `docs/patterns/${a.id}/${c.slug}.md`, section: 'patterns', comp: c, list: a.items, app: a });
}
page({ out: 'decisions/index.html', src: 'docs/decisions/README.md', section: 'records' });
for (const f of readdirSync(join(root, 'docs/decisions')).filter((f) => /^\d{4}-.*\.md$/.test(f)).sort())
  page({ out: `decisions/${f.replace(/\.md$/, '.html')}`, src: `docs/decisions/${f}`, section: 'records', hidden: true });
page({ out: 'open-questions.html', src: 'docs/open-questions.md', section: 'records' });
page({ out: 'versioning.html', src: 'docs/versioning.md', section: 'records' });
page({ out: 'changelog.html', src: 'CHANGELOG.md', section: 'records', title: '変更履歴' });

const sections = [
  { id: 'start', title: 'はじめに', top: 'index.html' },
  { id: 'foundations', title: 'ファウンデーション', top: 'foundations/index.html' },
  { id: 'components', title: 'コンポーネント', top: 'components/index.html' },
  { id: 'patterns', title: 'パターン', top: 'patterns.html' },
  { id: 'records', title: '記録', top: 'decisions/index.html' },
];

// 先にタイトルを決める
for (const p of pages) {
  if (p.src && !p.title) p.title = markdown(read(p.src), { link: () => ({ href: '#' }) }).title;
}

// ---------------------------------------------------------------- 差し込む HTML

const site = (p) => read(posix.join('site', p));
// 線のアイコン（24 の枠、端は丸）。デモの HTML では {{i:名前}} と書く。
const ICONS = {
  chat: '<path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5 8.6 8.6 0 0 1-3.8-.9L3 21l1.9-5.7A8.4 8.4 0 0 1 12.5 3 8.4 8.4 0 0 1 21 11.5Z"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-2.6-6.4L21 8"/><path d="M21 3v5h-5"/>',
  back: '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>',
  trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  filePlus: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z"/><path d="M14 3v6h6"/><path d="M12 12v6"/><path d="M9 15h6"/>',
  fileMinus: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z"/><path d="M14 3v6h6"/><path d="M9 15h6"/>',
  msgPlus: '<path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5 8.6 8.6 0 0 1-3.8-.9L3 21l1.9-5.7A8.4 8.4 0 0 1 12.5 3 8.4 8.4 0 0 1 21 11.5Z"/><path d="M12.5 8v7"/><path d="M9 11.5h7"/>',
  sendAll: '<path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4Z"/>',
  up: '<path d="M12 19V5"/><path d="m5 12 7-7 7 7"/>',
  mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/><path d="M12 18v4"/>',
  reply: '<path d="M9 17 4 12l5-5"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>',
  select: '<path d="M5 4h14"/><path d="M5 20h14"/><path d="M12 4v16"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5Z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  network: '<rect x="9" y="2" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="16" y="16" width="6" height="6" rx="1"/><path d="M5 16v-4h14v4"/><path d="M12 12V8"/>',
  database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5"/><path d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/>',
  code: '<path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/>',
  box: '<path d="M21 8 12 3 3 8v8l9 5 9-5Z"/><path d="m3 8 9 5 9-5"/><path d="M12 13v8"/>',
};
const icon = (name) => `<svg class="m-icon" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] ?? ''}</svg>`;
const slideTypes = () => site('slides.html');
const slide = (type) => {
  const m = slideTypes().match(new RegExp(`<template data-type="${type}">([\\s\\S]*?)</template>`));
  if (!m) throw new Error(`スライドの型がない: ${type}`);
  return m[1];
};
const withIcons = (html) => html
  .replace(/\{\{slide:(\w+)\}\}/g, (_, t) => slide(t))
  .replace(/\{\{i:(\w+)\}\}/g, (_, n) => {
    if (!ICONS[n]) throw new Error(`アイコンがない: ${n}`);
    return icon(n);
  });
const demo = (slug) => (existsSync(join(root, 'site/demos', `${slug}.html`)) ? withIcons(site(`demos/${slug}.html`)) : '');

function swatches() {
  const row = (c) => `
    <li class="swatch">
      <div class="swatch-chips" aria-hidden="true">
        <span class="swatch-chip" style="background:${c.light}"></span>
        <span class="swatch-chip" style="background:${c.dark}"></span>
      </div>
      <div class="swatch-body">
        <code class="swatch-name">${c.name}</code>
        <span class="swatch-desc">${esc(c.desc)}</span>
        <span class="swatch-values"><span>ライト <code>${c.light}</code></span><span>ダーク <code>${c.dark}</code>${c.hasDark ? '' : '（同じ）'}</span></span>
      </div>
    </li>`;
  const ui = semColors.filter((c) => !c.name.startsWith('--cal-'));
  const cal = semColors.filter((c) => c.name.startsWith('--cal-'));
  const modeVars = (mode) =>
    ['color', 'shadow']
      .flatMap((g) => Object.entries(tokens.semantic[g]).filter(([k]) => !k.startsWith('$')).map(([k, t]) => {
        const v = resolve(mode === 'dark' ? t.$extensions?.['com.muse.modes']?.dark ?? t.$value : t.$value);
        return `--${g === 'shadow' ? 'shadow-' : ''}${k}:${v}`;
      }))
      .join(';');
  const pane = (mode, label) => `
    <div class="mode-pane" style="${modeVars(mode)};color-scheme:${mode}">
      <p class="mode-label">${label}</p>
      <div class="mode-sample">
        <div class="mode-card">
          <p class="mode-title">セクションカード</p>
          <p class="mode-text">本文は <code>--text</code>、補足は <span class="dim">--dim</span>、注記は <span class="faint">--faint</span>。</p>
          <p class="mode-actions"><span class="mode-btn primary">続ける</span><span class="mode-btn secondary">あとで</span><span class="mode-link">詳しく見る</span></p>
        </div>
      </div>
    </div>`;
  return `
<div class="sample" data-sample="swatches">
  <p class="sample-label">見本: tokens.json の値（左の丸がライト、右の丸がダーク）</p>
  <ul class="swatches">${ui.map(row).join('')}</ul>
  <p class="sample-label">中身側の色</p>
  <ul class="swatches">${cal.map(row).join('')}</ul>
  <p class="sample-label">同じトークンをライトとダークで並べたもの</p>
  <div class="mode-panes">${pane('light', 'ライト')}${pane('dark', 'ダーク')}</div>
</div>`;
}

function typeSpecimen() {
  const size = tokens.primitive.font.size;
  const keys = Object.keys(size).filter((k) => !k.startsWith('$'));
  return `
<div class="sample">
  <p class="sample-label">見本: 段</p>
  <div class="type-tiers">
    <div class="type-tier"><span class="type-meta">Display 800 / 30・36px</span><p class="t-display">今日のブリーフ</p></div>
    <div class="type-tier"><span class="type-meta">Heading 700 / 18・20・24px</span><p class="t-heading">今日の予定</p></div>
    <div class="type-tier"><span class="type-meta">Body 400 / 16px・行の高さ 24px</span><p class="t-body">色・書体・角丸・余白は Muse アプリの文法に揃える。画面の形は中身の性質で決める。</p></div>
    <div class="type-tier"><span class="type-meta">Small 400–600 / 12・14px</span><p class="t-small">更新 7:02 ・ 家族カレンダー</p></div>
    <div class="type-tier"><span class="type-meta">Micro 600–800 / 11px</span><p class="t-micro">今ここ</p></div>
  </div>
  <p class="sample-label">見本: 文字サイズのスケール</p>
  <ul class="type-scale">${keys
    .map((k) => `<li><code>--text-${k}</code><span class="type-scale-meta">${size[k].$value} / ${tokens.primitive.font['line-height'][k].$value}</span><span class="type-scale-sample" style="font-size:var(--text-${k});line-height:var(--text-${k}--line-height)">Muse 見本 0123</span></li>`)
    .join('')}</ul>
</div>`;
}

function spacingSample(kind) {
  if (kind === 'space') {
    const rows = ['inner', 'row', 'card-gap', 'card-padding', 'section'];
    return `<div class="sample"><p class="sample-label">見本: 余白</p><ul class="scale">${rows
      .map((r) => `<li><code>--space-${r}</code><span class="scale-bar" style="width:var(--space-${r})"></span><span class="scale-val">${resolve(tokens.semantic.space[r].$value)}</span></li>`)
      .join('')}</ul></div>`;
  }
  if (kind === 'radius') {
    const rows = ['small', 'row', 'card', 'pill'];
    return `<div class="sample"><p class="sample-label">見本: 角丸</p><ul class="radii">${rows
      .map((r) => `<li><span class="radius-box${r === 'pill' ? ' is-pill' : ''}" style="border-radius:var(--radius-${r})"></span><code>--radius-${r}</code><span class="scale-val">${resolve(tokens.semantic.radius[r].$value)}</span></li>`)
      .join('')}</ul></div>`;
  }
  if (kind === 'shadow') {
    return `<div class="sample"><p class="sample-label">見本: 影</p><div class="shadows"><div class="shadow-box" style="box-shadow:var(--shadow-card)"><code>--shadow-card</code></div><div class="shadow-box is-pill" style="box-shadow:var(--shadow-float)"><code>--shadow-float</code></div></div></div>`;
  }
  return `<div class="sample"><p class="sample-label">見本: タップ範囲</p><div class="tap-demo"><span class="tap-target"><span class="tap-visual">36px の見た目</span></span><span class="scale-val">押せる範囲は 44px 四方（破線）</span></div></div>`;
}

// ---------------------------------------------------------------- 外枠

function layout(p, body, { toc = '' } = {}) {
  const rel = (target) => posix.relative(posix.dirname(p.out), target) || posix.basename(target);
  const sec = sections.find((s) => s.id === p.section);
  const navItem = (q) => `<li><a href="${rel(q.out)}"${q === p ? ' aria-current="page"' : ''}>${esc(q.nav || q.title)}</a></li>`;
  const side = sections
    .map((s) => {
      const qs = pages.filter((q) => q.section === s.id && !q.hidden);
      let inner;
      if (s.id === 'components') {
        const top = qs.filter((q) => !q.comp);
        inner = top.map(navItem).join('') + compGroups
          .map((g) => `${g.title ? `<li class="side-sub">${esc(g.title)}</li>` : ''}${qs.filter((q) => q.comp && g.items.includes(q.comp)).map(navItem).join('')}`)
          .join('');
      } else if (s.id === 'patterns') {
        inner = qs.filter((q) => !q.app).map(navItem).join('') + APPS
          .map((a) => `<li class="side-sub">${esc(a.title)}</li>${qs.filter((q) => q.app === a).map(navItem).join('')}`)
          .join('');
      } else inner = qs.map(navItem).join('');
      return `<div class="side-group${s.id === p.section ? ' is-current' : ''}"><p class="side-title">${esc(s.title)}</p><ul>${inner}</ul></div>`;
    })
    .join('');
  const global = sections
    .map((s) => `<li><a href="${rel(s.top)}"${s.id === p.section ? ' aria-current="true"' : ''}>${esc(s.title)}</a></li>`)
    .join('');
  const crumbs = [`<li><a href="${rel('index.html')}">トップ</a></li>`];
  if (p.out !== 'index.html') {
    if (sec && sec.top !== p.out && sec.top !== 'index.html') crumbs.push(`<li><a href="${rel(sec.top)}">${esc(sec.title)}</a></li>`);
    if (p.app && p.app.page !== p) crumbs.push(`<li><a href="${rel(p.app.page.out)}">${esc(p.app.title)}</a></li>`);
    crumbs.push(`<li aria-current="page">${esc(p.nav && p.kind !== 'home' ? p.nav : p.title)}</li>`);
  }
  const editSrc = p.src ? `<a href="${REPO}/blob/main/${p.src}" rel="noopener">GitHub で元の文書を見る（${esc(p.src)}）</a>` : '';
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${p.kind === 'home' ? 'Muse Design System' : `${esc(p.title)} | Muse Design System`}</title>${p.kind === 'moved' ? `\n<meta http-equiv="refresh" content="0; url=${rel(p.to)}">\n<link rel="canonical" href="${rel(p.to)}">` : ''}
<meta name="description" content="Muse アプリの見た目を再現するためのデザインシステム。トークン・部品・使い分けのドキュメントとデモ。">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Figtree:wght@400..900&family=Noto+Sans+JP:wght@400..900&display=swap">
<link rel="stylesheet" href="${rel('tokens/tokens.css')}">
<link rel="stylesheet" href="${rel('assets/site.css')}">
<link rel="stylesheet" href="${rel('assets/demos.css')}">
<link rel="icon" href="${rel('assets/favicon.svg')}" type="image/svg+xml">
<script>try{var t=localStorage.getItem('muse-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t;}catch(e){}</script>
</head>
<body>
<a class="skip" href="#main">本文へ移動</a>
<header class="site-header">
  <div class="site-header-inner">
    <a class="brand" href="${rel('index.html')}"><span class="brand-mark" aria-hidden="true"></span><span class="brand-name">Muse Design System</span></a>
    <span class="brand-ver">v${pkg.version}</span>
    <nav class="global-nav" aria-label="サイト全体"><ul>${global}</ul></nav>
    <div class="header-tools">
      <button class="theme-btn" type="button" data-theme-toggle aria-label="表示モードを切り替える"><span data-theme-label>自動</span></button>
      <button class="menu-btn" type="button" aria-expanded="false" aria-controls="side" data-menu-toggle>目次</button>
    </div>
  </div>
</header>
<div class="site-body">
  <nav class="side" id="side" aria-label="目次">${side}</nav>
  <main id="main" class="main${p.kind === 'home' ? ' is-home' : ''}">
    ${p.kind === 'home' ? '' : `<ol class="crumbs" aria-label="現在地">${crumbs.join('')}</ol>`}
    ${body}
    ${toc}
    <footer class="page-foot">
      <p>${editSrc}</p>
      <p>Muse DS v${pkg.version} ・ 文面はリポジトリの docs/ と tokens/ をそのまま表示しています。</p>
    </footer>
  </main>
</div>
<div class="m-toast-region" role="status" aria-live="polite"></div>
<script src="${rel('assets/site.js')}" defer></script>
<script src="${rel('assets/demos.js')}" defer></script>
</body>
</html>
`;
}

// ---------------------------------------------------------------- ページの中身

function renderDoc(p, { skipH1 = false, srcText } = {}) {
  return markdown(srcText ?? read(p.src), { link: makeLinker(p.src, p.out), skipH1 });
}

function buildPage(p) {
  if (p.kind === 'home') {
    const readme = read('README.md');
    const lead = readme.split('\n').find((l) => l.startsWith('アプリ「Muse」'));
    const principles = renderDoc({ src: 'docs/principles.md', out: 'index.html' }, { skipH1: true });
    const principleItems = [...read('docs/principles.md').matchAll(/^## (\d+)\. (.*)\n\n(.*)/gm)];
    const layers = [
      { n: '1', t: '原則', d: '判断に迷ったときに戻る4つの決め事', href: 'principles.html' },
      { n: '2', t: 'ファウンデーション', d: '色・文字・余白・角丸・影のトークンと、アイコンの組、アクセシビリティの基準', href: 'foundations/index.html' },
      { n: '3', t: 'コンポーネント', d: `再利用する部品。部品ごとに1ファイル（${components.length}件）`, href: 'components/index.html' },
      { n: '4', t: 'パターン', d: `部品の組み合わせの型と、アプリ固有の複合体（${composites.length}件）`, href: 'patterns.html' },
    ];
    void principles;
    const body = `
<section class="hero">
  <p class="hero-kicker">Muse DS v${pkg.version}</p>
  <h1 class="hero-title">Muse Design System</h1>
  <p class="hero-lead">${inline(lead, makeLinker('README.md', 'index.html'))}</p>
  <p class="hero-actions"><a class="m-btn m-btn--primary" href="getting-started.html">使い方を見る</a><a class="m-btn m-btn--secondary" href="components/index.html">部品を見る</a><a class="m-btn m-btn--ghost" href="${REPO}" rel="noopener">GitHub</a></p>
</section>
<section class="home-section" aria-labelledby="h-layers">
  <h2 id="h-layers">構成</h2>
  <p class="home-note">ドキュメントは4層です。上の層ほど判断の基準になり、下の層ほど具体的になります。</p>
  <ol class="layer-cards">${layers
    .map((l) => `<li><a class="layer-card" href="${l.href}"><span class="layer-n">${l.n}</span><span class="layer-t">${l.t}</span><span class="layer-d">${l.d}</span></a></li>`)
    .join('')}</ol>
</section>
<section class="home-section" aria-labelledby="h-principles">
  <h2 id="h-principles">原則</h2>
  <p class="home-note">個別のルールで決めきれないときに、この4つで判断します。</p>
  <ol class="principle-list">${principleItems
    .map(([, n, t, d]) => `<li><a href="principles.html#${slugify(`${n}. ${t}`)}"><span class="principle-n">${n}</span><span class="principle-t">${esc(t)}</span></a><p>${inline(d, makeLinker('docs/principles.md', 'index.html'))}</p></li>`)
    .join('')}</ol>
</section>
<section class="home-section" aria-labelledby="h-more">
  <h2 id="h-more">そのほか</h2>
  <ul class="link-list">
    <li><a href="decisions/index.html">決めたことの記録</a></li>
    <li><a href="open-questions.html">判断待ちの点</a></li>
    <li><a href="versioning.html">版の付け方</a></li>
    <li><a href="changelog.html">変更履歴</a></li>
  </ul>
</section>`;
    return layout(p, body);
  }

  if (p.kind === 'readme') {
    const src = read('README.md');
    const from = src.indexOf('## 構成');
    const { html } = renderDoc(p, { srcText: `# 使い方\n\n` + src.slice(from) });
    return layout(p, `<article class="doc">${html}</article>`);
  }

  let { html } = renderDoc(p);

  if (p.kind === 'moved') {
    html += `<p><a class="m-btn m-btn--primary" href="${posix.relative(posix.dirname(p.out), p.to)}">移行先を開く</a></p>`;
  }

  if (p.kind === 'catalog') {
    // 部品の表をカードの並びにする（文面は表のまま）
    const groupsHtml = p.app ? [p.app.items] : compGroups.map((g) => g.items);
    let gi = 0;
    html = html.replace(/<div class="table-wrap"><table>[\s\S]*?<\/table><\/div>/g, (table) => {
      const items = groupsHtml[gi++];
      if (!items) return table;
      return `<ul class="catalog">${items
        .map((c) => `<li><a class="catalog-card" href="${c.slug}.html"><span class="catalog-thumb" data-thumb="${c.slug}" aria-hidden="true">${thumb(c.slug)}</span><span class="catalog-name">${esc(c.name)}</span><span class="catalog-sum">${inline(c.summary, () => ({ href: '#' }))}</span></a></li>`)
        .join('')}</ul>`;
    });
  }

  if (p.comp) {
    const d = demo(p.comp.slug);
    if (d) {
      html = html.replace(/(<\/h1>)/, `$1\n<p class="comp-lead">${inline(p.comp.summary, () => ({ href: '#' }))}</p>\n<section class="demo" aria-labelledby="demo-h"><h2 id="demo-h" class="demo-h">デモ</h2>${d}</section>`);
    }
    const idx = p.list.indexOf(p.comp);
    const prev = p.list[idx - 1];
    const next = p.list[idx + 1];
    html += `<nav class="pager" aria-label="前後の部品">${prev ? `<a class="pager-prev" href="${prev.slug}.html"><span>前の部品</span>${esc(prev.name)}</a>` : '<span></span>'}${next ? `<a class="pager-next" href="${next.slug}.html"><span>次の部品</span>${esc(next.name)}</a>` : ''}</nav>`;
  }

  if (p.out === 'foundations/color.html') html = insertAtSectionEnd(html, 'ui-の色', swatches());
  if (p.out === 'foundations/typography.html') html = insertAfterHeading(html, '段', typeSpecimen());
  if (p.out === 'foundations/spacing-radius-elevation.html') {
    html = insertAtSectionEnd(html, '余白', spacingSample('space'));
    html = insertAtSectionEnd(html, '角丸', spacingSample('radius'));
    html = insertAtSectionEnd(html, '影', spacingSample('shadow'));
    html = insertAtSectionEnd(html, '大きさ', spacingSample('tap'));
  }
  if (p.out === 'patterns.html') {
    html = insertAtSectionEnd(html, 'b-承認をはさむ型', demo('pattern-b'));
    html = insertAtSectionEnd(html, 'e-スライドの型', demo('pattern-e'));
  }

  return layout(p, `<article class="doc">${html}</article>`);
}

// 一覧のカードに載せる小さな見本（部品のデモの縮小ではなく、部品の形だけ）
function thumb(slug) {
  const t = site('thumbs.html');
  const m = t.match(new RegExp(`<template data-slug="${slug}">([\\s\\S]*?)</template>`));
  return m ? withIcons(m[1].trim()) : '';
}

// ---------------------------------------------------------------- 書き出し

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
for (const p of pages) {
  const file = join(out, p.out);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, buildPage(p));
}
cpSync(join(root, 'site/assets'), join(out, 'assets'), { recursive: true });
mkdirSync(join(out, 'tokens'), { recursive: true });
cpSync(join(root, 'tokens/tokens.css'), join(out, 'tokens/tokens.css'));
cpSync(join(root, 'tokens/tokens.json'), join(out, 'tokens/tokens.json'));
writeFileSync(join(out, '.nojekyll'), '');
writeFileSync(
  join(out, '404.html'),
  layout({ out: '404.html', title: 'ページが見つかりません', section: 'start', kind: 'page' }, `<article class="doc"><h1>ページが見つかりません</h1><p><a href="${'/muse-design-system/'}">トップへ戻る</a></p></article>`)
    .replace(/(href|src)="(?!https?:|#|\/)([^"]+)"/g, '$1="/muse-design-system/$2"')
);

// 内部リンクの確認
let broken = 0;
const exists = new Set(pages.map((p) => p.out));
for (const p of pages) {
  const html = readFileSync(join(out, p.out), 'utf8');
  for (const [, href] of html.matchAll(/href="([^"#:]+\.html)(#[^"]*)?"/g)) {
    const target = posix.normalize(posix.join(posix.dirname(p.out), href));
    if (!exists.has(target)) { console.error(`リンク切れ: ${p.out} → ${href}`); broken++; }
  }
  for (const [, href, hash] of html.matchAll(/href="([^"#:]*\.html)?#([^"]+)"/g)) {
    const target = href ? posix.normalize(posix.join(posix.dirname(p.out), href)) : p.out;
    if (!exists.has(target)) continue;
    const th = readFileSync(join(out, target), 'utf8');
    if (!th.includes(`id="${decodeURIComponent(hash)}"`)) { console.error(`アンカー切れ: ${p.out} → ${href || ''}#${hash}`); broken++; }
  }
}
console.log(`書き出した: ${out}（${pages.length} ページ、部品 ${components.length} 件、複合体 ${composites.length} 件、転送 ${moved.length} 件）`);
if (broken) { console.error(`リンク切れ ${broken} 件`); process.exit(1); }
