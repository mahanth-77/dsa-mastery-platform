// Pure helpers that turn the curriculum JSON into crawlable static HTML.
// Used by scripts/prerender.mjs after `vite build`. No dependencies.

export const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function slugify(name) {
  return String(name)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function patternNumber(id) {
  const m = /(\d+)$/.exec(id);
  return m ? parseInt(m[1], 10) : 0;
}

export function summarisePattern(p) {
  const diff = { Easy: 0, Medium: 0, Hard: 0 };
  const urls = new Set();
  let problems = 0;
  for (const v of p.variations) {
    for (const q of v.problems) {
      problems++;
      urls.add(q.url);
      if (diff[q.difficulty] !== undefined) diff[q.difficulty]++;
    }
  }
  return { variations: p.variations.length, problems, unique: urls.size, diff };
}

const CSS = `:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:#0b0b0a;color:#e9e4d8;font:18px/1.6 Newsreader,Georgia,serif}
a{color:inherit}main,header,footer{max-width:900px;margin:0 auto;padding:0 24px}header{display:flex;justify-content:space-between;align-items:baseline;padding-top:28px;padding-bottom:20px;border-bottom:1px solid rgba(233,228,216,.12)}
.mono,.lbl{font:12px ui-monospace,Menlo,monospace;letter-spacing:.06em;color:rgba(233,228,216,.55)}h1{font-weight:300;font-size:clamp(36px,7vw,60px);line-height:1.02;letter-spacing:-.03em;margin:48px 0 16px}
h2{font-weight:400;font-size:26px;margin:44px 0 8px}p.lede{color:rgba(233,228,216,.7);max-width:640px}.cta{display:inline-block;margin:28px 0;padding:12px 26px;background:#e9e4d8;color:#0b0b0a;text-decoration:none}
.cta:hover{background:#ff5b2e}ul{list-style:none;padding:0;margin:0}li{padding:9px 0;border-bottom:1px solid rgba(233,228,216,.1)}li small{color:rgba(233,228,216,.5);font:12px ui-monospace,monospace;margin-left:8px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:0 32px}footer{padding-top:36px;padding-bottom:48px;margin-top:56px;border-top:1px solid rgba(233,228,216,.12)}`;

function shell({ title, description, canonical, jsonLd, body }) {
  return `<!doctype html>
<html lang="en" class="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonical)}">
<meta name="theme-color" content="#0b0b0a">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta name="twitter:card" content="summary">
<link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,300..500;1,300..500&display=swap" rel="stylesheet">
<style>${CSS}</style>
<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>
</head>
<body>
<header><a href="/" class="mono" style="text-decoration:none;letter-spacing:.22em">VERTEX</a><a href="/learn/" class="lbl">Pattern guide</a></header>
<main>
${body}
</main>
<footer><span class="lbl">VERTEX · free to start · progress is kept on your device</span></footer>
</body>
</html>
`;
}

export function renderPatternPage(p, site, all) {
  const slug = slugify(p.name);
  const n = patternNumber(p.id);
  const s = summarisePattern(p);
  const canonical = `${site}/learn/${slug}/`;
  const title = `${p.name}: ${s.variations} variations and ${s.unique} practice problems | VERTEX`;
  const description = `${p.name} is pattern ${n} of ${all.length} in VERTEX. Work through ${s.variations} variations and ${s.unique} problems (${s.diff.Easy} easy, ${s.diff.Medium} medium, ${s.diff.Hard} hard) in a sensible order, then review them on a spaced schedule.`;
  const variations = p.variations
    .map((v) => {
      const items = v.problems
        .map((q) => `<li>${esc(q.title)}<small>${esc(q.difficulty)}</small></li>`)
        .join('\n');
      return `<h2>${esc(v.name)}</h2>\n<ul>\n${items}\n</ul>`;
    })
    .join('\n');
  const body = `<p class="lbl">Pattern ${String(n).padStart(2, '0')} of ${all.length}</p>
<h1>${esc(p.name)}</h1>
<p class="lede">${s.variations} variations, ${s.unique} problems: ${s.diff.Easy} easy, ${s.diff.Medium} medium, ${s.diff.Hard} hard. Practise them in order, from the plain form to the tricky ones.</p>
<a class="cta" href="/patterns/${esc(p.id)}">Practise this pattern in VERTEX</a>
${variations}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'VERTEX', item: `${site}/` },
          { '@type': 'ListItem', position: 2, name: 'Pattern guide', item: `${site}/learn/` },
          { '@type': 'ListItem', position: 3, name: p.name, item: canonical },
        ],
      },
      {
        '@type': 'ItemList',
        name: `${p.name} practice problems`,
        numberOfItems: s.unique,
        itemListElement: p.variations
          .flatMap((v) => v.problems)
          .filter((q, i, arr) => arr.findIndex((x) => x.url === q.url) === i)
          .map((q, i) => ({ '@type': 'ListItem', position: i + 1, name: q.title })),
      },
    ],
  };
  return { slug, html: shell({ title, description, canonical, jsonLd, body }) };
}

export function renderIndexPage(patterns, site) {
  const canonical = `${site}/learn/`;
  const total = new Set(patterns.flatMap((p) => p.variations.flatMap((v) => v.problems.map((q) => q.url)))).size;
  const title = `The ${patterns.length} patterns behind DSA interview problems | VERTEX`;
  const description = `A guide to ${patterns.length} data structure and algorithm patterns covering ${total} interview and placement problems, with variations ordered from simple to tricky.`;
  const items = patterns
    .map((p) => {
      const s = summarisePattern(p);
      return `<li><a href="/learn/${slugify(p.name)}/">${esc(p.name)}</a><small>${s.variations} variations · ${s.unique} problems</small></li>`;
    })
    .join('\n');
  const body = `<p class="lbl">Pattern guide</p>
<h1>The ${patterns.length} patterns behind the problems</h1>
<p class="lede">Most interview problems are a small number of mechanisms in different clothes. Learn the mechanism, then the variations.</p>
<a class="cta" href="/">Start practising in VERTEX</a>
<ul class="grid">
${items}
</ul>`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: title,
    itemListElement: patterns.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${site}/learn/${slugify(p.name)}/`,
      name: p.name,
    })),
  };
  return shell({ title, description, canonical, jsonLd, body });
}

export function renderSitemap(patterns, site, today) {
  const urls = [`${site}/`, `${site}/learn/`, ...patterns.map((p) => `${site}/learn/${slugify(p.name)}/`)];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${esc(u)}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`;
}

export function renderRobots(site) {
  return `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${site}/sitemap.xml\n`;
}
