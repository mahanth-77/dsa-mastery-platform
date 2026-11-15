import { describe, expect, it } from 'vitest';
import oaCatalogue from '../data/oa-ques/oa-ques.json';
import curriculum from '../dsa_pattern_mastery_tracker.json';
import hackerRank from '../data/oa-ques/hackerrank-kit.json';
import hackerRankChallenges from '../data/oa-ques/hackerrank-challenges.json';
import codeforcesSponsored from '../data/oa-ques/codeforces-sponsored-contests.json';
import atCoderSponsored from '../data/oa-ques/atcoder-sponsored-contests.json';
import candidateTcs from '../data/oa-ques/candidate-tcs-pyqs.json';

const leetcodeBatches = import.meta.glob('../data/oa-ques/leetcode-batches/*.json', { eager: true, import: 'default' }) as Record<string, { records: any[] }>;
const candidatePlacementBatches = import.meta.glob('../data/oa-ques/candidate-placement-reports-batch-*.json', { eager: true, import: 'default' }) as Record<string, { records: any[] }>;

const expandedRecords = [
  ...oaCatalogue.records,
  ...Object.values(leetcodeBatches).flatMap((batch) => batch.records),
  ...hackerRank.records,
  ...hackerRankChallenges.records,
  ...codeforcesSponsored.records,
  ...atCoderSponsored.records,
  ...candidateTcs.records,
  ...Object.values(candidatePlacementBatches).flatMap((batch) => batch.records)
];

type Record = { id: string; title: string; company: string | null; assessmentType: string };

function summarize(records: Record[]) {
  const counts = new Map<string, number>();
  records.forEach((item) => {
    const name = item.company?.trim();
    if (name) counts.set(name, (counts.get(name) || 0) + 1);
  });
  return Array.from(counts, ([company, count]) => ({ company, count })).sort((a, b) => a.company.localeCompare(b.company));
}

function searchRecords(records: Record[], query: string) {
  const q = query.trim().toLowerCase();
  return records.filter((item) => !q || [item.title, item.id, item.company || '', item.assessmentType].some((value) => value.toLowerCase().includes(q)));
}

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

describe('VERTEX OA Ques company tags and counts', () => {
  const sample: Record[] = [
    { id: 'OA-001', title: 'Array Rotation', company: 'Amazon', assessmentType: 'Online Assessment' },
    { id: 'OA-002', title: 'String Groups', company: 'Amazon', assessmentType: 'Online Assessment' },
    { id: 'OA-003', title: 'Graph Paths', company: 'Microsoft', assessmentType: 'Coding Assessment' },
  ];

  it('counts total questions and unique companies dynamically', () => {
    expect(sample.length).toBe(3);
    expect(summarize(sample)).toEqual([{ company: 'Amazon', count: 2 }, { company: 'Microsoft', count: 1 }]);
  });

  it('returns all questions tagged with a searched company name, case-insensitively', () => {
    expect(searchRecords(sample, 'amazon').map((item) => item.id)).toEqual(['OA-001', 'OA-002']);
    expect(searchRecords(sample, 'MICROSOFT').map((item) => item.id)).toEqual(['OA-003']);
  });

  it('makes platform names searchable and separates platforms correctly', () => {
    expect(searchRecords(expandedRecords as Record[], 'HackerRank')).toHaveLength(584);
    expect(searchRecords(expandedRecords as Record[], 'LeetCode')).toHaveLength(4323);
    expect(searchRecords(expandedRecords as Record[], 'Codeforces')).toHaveLength(1015);
    expect(searchRecords(expandedRecords as Record[], 'AtCoder')).toHaveLength(106);
    expect(hackerRank.records.every((item: any) => item.sourceUrl.startsWith('https://www.hackerrank.com/'))).toBe(true);
    expect(hackerRankChallenges.records.every((item: any) => item.sourceUrl.startsWith('https://www.hackerrank.com/'))).toBe(true);
    expect(codeforcesSponsored.records.every((item: any) => item.sourceUrl.startsWith('https://codeforces.com/'))).toBe(true);
    expect(atCoderSponsored.records.every((item: any) => item.sourceUrl.startsWith('https://atcoder.jp/'))).toBe(true);
  });

  it('imports the audited source batches with explicit evidence classifications', () => {
    expect(oaCatalogue.catalogue).toBe('VERTEX OA Questions');
    expect(oaCatalogue.records).toHaveLength(2531);
    expect(expandedRecords).toHaveLength(6302);
    expect(new Set(expandedRecords.map((item: any) => item.id)).size).toBe(expandedRecords.length);
    expect(expandedRecords.filter((item: any) => item.sourceType === 'candidate_reported_actual_oa')).toHaveLength(272);
    expect(candidateTcs.records).toHaveLength(66);
    expect(Object.values(candidatePlacementBatches).reduce((n, batch) => n + batch.records.length, 0)).toBe(143);
    const requestedResearchLeads = candidatePlacementBatches['../data/oa-ques/candidate-placement-reports-batch-06.json']?.records || [];
    expect(requestedResearchLeads).toHaveLength(2);
    expect(requestedResearchLeads.every((item: any) => item.sourceType === 'oa_style_practice' && item.verificationStatus === 'pending_review')).toBe(true);
    expect(requestedResearchLeads.map((item: any) => item.company).sort()).toEqual(['Goldman Sachs', 'JPMorgan Chase']);
    const batch07 = candidatePlacementBatches['../data/oa-ques/candidate-placement-reports-batch-07.json']?.records || [];
    expect(batch07).toHaveLength(1);
    expect(batch07[0].title).toBe('Count the Number of Factors for Every Array Element');
    expect(batch07[0].company).toBe('Walmart');
    expect(batch07[0].sourceType).toBe('candidate_reported_actual_oa');
    expect(batch07[0].verificationStatus).toBe('verified');
    const leetcodeRecords = expandedRecords.filter((item: any) => item.assessmentType === 'LeetCode company-tagged practice');
    expect(leetcodeRecords).toHaveLength(4323);
    expect(new Set(leetcodeRecords.map((item: any) => item.sourceUrl.split('/problems/')[1]?.split('/')[0]?.toLowerCase()).filter(Boolean)).size).toBe(2056);
    expect(hackerRank.records).toHaveLength(68);
    expect(hackerRankChallenges.records).toHaveLength(516);
    expect(codeforcesSponsored.records).toHaveLength(1015);
    expect(atCoderSponsored.records).toHaveLength(106);
    expect(expandedRecords.filter((item: any) => item.sourceType === 'company_verified')).toHaveLength(0);
    expect(new Set(oaCatalogue.records.map((item: any) => item.company)).size).toBe(65);
    expect(oaCatalogue.records.filter((item: any) => item.sourceType === 'candidate_reported_actual_oa')).toHaveLength(65);
    expect(expandedRecords.filter((item: any) => item.sourceType === 'oa_style_practice')).toHaveLength(6030);
    expect(oaCatalogue.records.filter((item: any) => item.sourceType === 'candidate_reported_actual_oa').every((item: any) => item.sourceUrl.startsWith('https://github.com/mrsac7/placement-resources/'))).toBe(true);
    expect(new Set(oaCatalogue.records.map((item: any) => item.id)).size).toBe(oaCatalogue.records.length);
  });

  it('does not import exact-title duplicates already in the DSA curriculum', () => {
    const curriculumTitles = new Set<string>();
    curriculum.patterns.forEach((pattern: any) => pattern.variations.forEach((variation: any) => variation.problems.forEach((problem: any) => curriculumTitles.add(normalize(problem.title)))));
    const duplicateTitles = expandedRecords.filter((item: any) => curriculumTitles.has(normalize(item.title)));
    expect(duplicateTitles).toEqual([]);
    const curriculumSlugs = new Set<string>();
    curriculum.patterns.forEach((pattern: any) => pattern.variations.forEach((variation: any) => variation.problems.forEach((problem: any) => {
      const slug = (problem.url || '').split('/problems/')[1]?.split('/')[0];
      if (slug) curriculumSlugs.add(slug.toLowerCase());
    })));
    const duplicateLeetCodeSlugs = expandedRecords.filter((item: any) => item.assessmentType === 'LeetCode company-tagged practice' && curriculumSlugs.has((item.sourceUrl.split('/problems/')[1] || '').split('/')[0].toLowerCase()));
    expect(duplicateLeetCodeSlugs).toEqual([]);
  });

  it('keeps records without cohort evidence pending review', () => {
    expect(oaCatalogue.records.filter((item: any) => item.verificationStatus === 'pending_review').map((item: any) => item.company).sort()).toEqual(['Adobe', 'Adobe', 'DE Shaw', 'DE Shaw', 'DE Shaw']);
  });
});
