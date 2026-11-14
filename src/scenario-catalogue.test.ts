import { describe, it, expect } from 'vitest';
import rawCatalogue from '../data/scenario-catalogue/scenario-catalogue.json';

describe('VERTEX Long-Scenario Catalogue (162 Records)', () => {
  const catalogue = rawCatalogue;
  const records = catalogue.records;

  it('contains exactly 162 total scenario records', () => {
    expect(records.length).toBe(162);
    expect(catalogue.counts.total).toBe(162);
  });

  it('has zero duplicate IDs', () => {
    const ids = records.map(r => r.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(162);
  });

  it('has zero duplicate source URLs', () => {
    const urls = records.map(r => r.sourceUrl.trim().toLowerCase().replace(/\/$/, ''));
    const uniqueUrls = new Set(urls);
    expect(uniqueUrls.size).toBe(162);
  });

  it('has zero duplicate titles', () => {
    const titles = records.map(r => r.title.trim().toLowerCase());
    const uniqueTitles = new Set(titles);
    expect(uniqueTitles.size).toBe(162);
  });

  it('reconciles platform counts correctly', () => {
    const platformCounts: Record<string, number> = {};
    records.forEach(r => {
      platformCounts[r.platform] = (platformCounts[r.platform] || 0) + 1;
    });

    expect(platformCounts['CSES']).toBe(74);
    expect(platformCounts['Kattis']).toBe(47);
    expect(platformCounts['Codeforces']).toBe(21);
    expect(platformCounts['HackerRank']).toBe(18);
    expect(platformCounts['AtCoder']).toBe(2);
  });

  it('distinguishes historical certified (121) from user-accepted (41)', () => {
    const historical = records.filter(r => r.catalogueInclusion === 'historical_certified');
    const userAccepted = records.filter(r => r.catalogueInclusion === 'user_accepted');

    expect(historical.length).toBe(121);
    expect(userAccepted.length).toBe(41);

    expect(catalogue.counts.historicalCertified).toBe(121);
    expect(catalogue.counts.userAccepted).toBe(41);
  });

  it('guarantees complete isolation from core curriculum (importApproved === false)', () => {
    const imported = records.filter(r => r.importApproved === true);
    expect(imported.length).toBe(0);
    expect(catalogue.counts.coreCurriculumImports).toBe(0);
  });

  it('ensures all records have valid HTTPS/HTTP source URLs', () => {
    records.forEach(r => {
      expect(r.sourceUrl).toMatch(/^https?:\/\//);
      expect(r.title.length).toBeGreaterThan(0);
      expect(r.primaryPattern.length).toBeGreaterThan(0);
    });
  });
});
