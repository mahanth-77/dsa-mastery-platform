import { describe, expect, it } from 'vitest';
import oaCatalogue from '../data/oa-ques/oa-ques.json';

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

  it('does not fabricate OA records to fill the catalogue', () => {
    expect(oaCatalogue.catalogue).toBe('VERTEX OA Questions');
    expect(oaCatalogue.records).toEqual([]);
  });
});
