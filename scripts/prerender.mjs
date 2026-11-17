// Runs after `vite build`: writes crawlable static pages into dist/.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderIndexPage, renderPatternPage, renderRobots, renderSitemap } from './prerender-lib.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const site = (process.env.SITE_URL || 'https://dsa.startora.tech').replace(/\/+$/, '');
const data = JSON.parse(fs.readFileSync(path.join(root, 'dsa_pattern_mastery_tracker.json'), 'utf8'));
const patterns = data.patterns;

if (!fs.existsSync(dist)) throw new Error('dist/ not found: run `vite build` first');

const write = (rel, content) => {
  const file = path.join(dist, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
};

const slugs = new Set();
for (const p of patterns) {
  const { slug, html } = renderPatternPage(p, site, patterns);
  if (slugs.has(slug)) throw new Error(`duplicate slug ${slug}`);
  slugs.add(slug);
  write(`learn/${slug}/index.html`, html);
}
write('learn/index.html', renderIndexPage(patterns, site));
write('sitemap.xml', renderSitemap(patterns, site, new Date().toISOString().slice(0, 10)));
write('robots.txt', renderRobots(site));
console.log(`prerendered ${patterns.length} pattern pages + index, sitemap, robots (${site})`);
