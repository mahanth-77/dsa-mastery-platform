import { describe, it, expect } from 'vitest';
import curriculum from '../../dsa_pattern_mastery_tracker.json';
import { renderIndexPage, renderPatternPage, renderSitemap, slugify } from '../../scripts/prerender-lib.mjs';

const site = 'https://example.test';
const patterns: any[] = (curriculum as any).patterns;

describe('prerender', () => {
  it('gives every pattern a unique, url-safe slug', () => {
    const slugs = patterns.map((p) => slugify(p.name));
    expect(new Set(slugs).size).toBe(patterns.length);
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });
  it('renders crawlable pages with title, canonical and problem names', () => {
    const { html, slug } = renderPatternPage(patterns[0], site, patterns);
    expect(html).toContain(`<link rel="canonical" href="${site}/learn/${slug}/">`);
    expect(html).toMatch(/<title>[^<]+<\/title>/);
    expect(html).toContain(patterns[0].variations[0].problems[0].title);
  });
  it('escapes markup in names', () => {
    const evil = { id: 'pattern-99', name: '<script>x</script>', variations: [{ id: 'v', name: 'a&b', problems: [] }] };
    const { html } = renderPatternPage(evil, site, [evil]);
    expect(html).not.toContain('<script>x</script>');
    expect(html).toContain('a&amp;b');
  });
  it('lists every pattern in the index and sitemap', () => {
    const idx = renderIndexPage(patterns, site);
    const map = renderSitemap(patterns, site, '2026-01-01');
    for (const p of patterns) {
      expect(idx).toContain(`/learn/${slugify(p.name)}/`);
      expect(map).toContain(`${site}/learn/${slugify(p.name)}/`);
    }
  });
});
