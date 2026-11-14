import { describe, expect, it } from 'vitest';
import oaCatalogue from '../data/oa-ques/oa-ques.json';
import scenarioCatalogue from '../data/scenario-catalogue/scenario-catalogue.json';

describe('VERTEX OA Ques catalogue isolation', () => {
  it('starts with an explicit, empty OA catalogue rather than fabricated questions', () => {
    expect(oaCatalogue.catalogue).toBe('VERTEX OA Questions');
    expect(oaCatalogue.records).toEqual([]);
    expect(oaCatalogue.counts).toEqual({
      total: 0,
      companyVerified: 0,
      oaStylePractice: 0,
      pendingReview: 0,
    });
  });

  it('keeps OA questions separate from Scenario Questions and the core curriculum', () => {
    expect(oaCatalogue.records).not.toBe(scenarioCatalogue.records);
    expect(scenarioCatalogue.records).toHaveLength(162);
    expect(scenarioCatalogue.counts.coreCurriculumImports).toBe(0);
  });

  it('requires source and evidence classification for every future OA record', () => {
    for (const question of oaCatalogue.records) {
      expect(question.id).toBeTruthy();
      expect(question.title).toBeTruthy();
      expect(new URL(question.sourceUrl).protocol).toMatch(/^https?:$/);
      expect(['company_verified', 'oa_style_practice']).toContain(question.sourceType);
      expect(['verified', 'pending_review']).toContain(question.verificationStatus);
    }
  });
});
