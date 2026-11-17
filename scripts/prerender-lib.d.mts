export const esc: (s: unknown) => string;
export function slugify(name: string): string;
export function patternNumber(id: string): number;
export function summarisePattern(p: any): { variations: number; problems: number; unique: number; diff: Record<string, number> };
export function renderPatternPage(p: any, site: string, all: any[]): { slug: string; html: string };
export function renderIndexPage(patterns: any[], site: string): string;
export function renderSitemap(patterns: any[], site: string, today: string): string;
export function renderRobots(site: string): string;
