import { describe, expect, it } from 'vitest';
import oaCatalogue from '../data/oa-ques/oa-ques.json';
import curriculum from '../dsa_pattern_mastery_tracker.json';
import hackerRank from '../data/oa-ques/hackerrank-kit.json';
const leetcodeBatches = import.meta.glob('../data/oa-ques/leetcode-batches/*.json', { eager: true, import: 'default' }) as Record<string, { records: any[] }>;
const expandedRecords = [...oaCatalogue.records, ...Object.values(leetcodeBatches).flatMap((batch) => batch.records), ...hackerRank.records];

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

  it('imports only source-linked candidate-reported OA records with company and title', () => {
    expect(oaCatalogue.catalogue).toBe('VERTEX OA Questions');
    expect(oaCatalogue.records).toHaveLength(2531);
    expect(expandedRecords).toHaveLength(2748);
    expect(new Set(oaCatalogue.records.map((item: any) => item.company)).size).toBe(24);
    expect(oaCatalogue.records.filter((item: any) => item.sourceType === 'candidate_reported_actual_oa')).toHaveLength(65);
    expect(expandedRecords.filter((item: any) => item.sourceType === 'oa_style_practice')).toHaveLength(2683);
    expect(oaCatalogue.records.every((item: any) => item.sourceUrl.startsWith('https://github.com/mrsac7/placement-resources/'))).toBe(true);
    expect(new Set(oaCatalogue.records.map((item: any) => item.id)).size).toBe(oaCatalogue.records.length);
  });

  it('does not import exact-title duplicates already in the DSA curriculum', () => {
    const curriculumTitles = new Set<string>();
    curriculum.patterns.forEach((pattern: any) => pattern.variations.forEach((variation: any) => variation.problems.forEach((problem: any) => curriculumTitles.add(normalize(problem.title)))));
    const duplicateTitles = expandedRecords.filter((item: any) => curriculumTitles.has(normalize(item.title)));
    expect(duplicateTitles).toEqual([]);
  });

  it('keeps records without cohort evidence pending review', () => {
    expect(oaCatalogue.records.filter((item: any) => item.verificationStatus === 'pending_review').map((item: any) => item.company).sort()).toEqual(['Adobe', 'Adobe', 'DE Shaw', 'DE Shaw', 'DE Shaw']);
  });
});
