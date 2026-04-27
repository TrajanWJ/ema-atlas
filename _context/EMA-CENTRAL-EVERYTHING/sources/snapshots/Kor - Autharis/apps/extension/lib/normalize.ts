// Shared normalization. Takes a raw site-scrape and produces something that
// matches the shape of `CreateJobRequestInput` from @autharis/sdk.
//
// Kept dependency-free on purpose: content scripts inline this module.

export interface RawScrape {
  title: string;
  description: string;
  company: string;
  compensation?: string;
  skills: string[];
  hoursPerWeek?: number;
  duration?: string;
  timezone?: string;
  category?: string;
  industry?: string;
}

export interface NormalizedPayload {
  title: string;
  category: string;
  client: string;
  description: string;
  hoursPerWeek: number;
  duration: string;
  timezone: string;
  budget: [number, number];
  skills: string[];
  industry: string;
  // extras for the popup — not on CreateJobRequestInput but useful
  sourceUrl?: string;
}

// Very small keyword dictionary for skill extraction. Parsers can add more.
const SKILL_KEYWORDS = [
  'TypeScript', 'JavaScript', 'React', 'Next.js', 'Node', 'Python',
  'Django', 'Flask', 'Ruby', 'Rails', 'Go', 'Rust', 'Java', 'Kotlin',
  'Swift', 'iOS', 'Android', 'Figma', 'Sketch', 'Illustrator',
  'Photoshop', 'SEO', 'SEM', 'PPC', 'Webflow', 'Shopify',
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'GraphQL', 'REST',
  'AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes', 'Terraform',
  'Copywriting', 'Content', 'Branding', 'UX', 'UI', 'Product',
  'Analytics', 'Data', 'ML', 'AI', 'LLM', 'SQL', 'Tableau',
];

export function extractSkills(text: string, seeded: string[] = []): string[] {
  const pool = new Set<string>(seeded.map((s) => s.trim()).filter(Boolean));
  if (text) {
    for (const kw of SKILL_KEYWORDS) {
      const re = new RegExp(`\\b${escapeRegExp(kw)}\\b`, 'i');
      if (re.test(text)) pool.add(kw);
    }
  }
  return Array.from(pool).slice(0, 20);
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Parse free-form compensation strings into a [min, max] USD-ish range.
// Handles shapes like: "$80k - $120k", "$50/hr", "USD 90,000", "80000 - 120000"
export function parseBudget(s?: string): [number, number] {
  if (!s) return [0, 0];
  const cleaned = s.replace(/,/g, '').toLowerCase();
  const nums: number[] = [];
  const re = /(\d+(?:\.\d+)?)\s*(k|m)?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(cleaned)) !== null) {
    let n = parseFloat(m[1]);
    if (m[2] === 'k') n *= 1_000;
    else if (m[2] === 'm') n *= 1_000_000;
    nums.push(Math.round(n));
  }
  if (!nums.length) return [0, 0];
  if (nums.length === 1) return [nums[0], nums[0]];
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  return [min, max];
}

export function parseHoursPerWeek(text: string): number {
  const re = /(\d{1,2})\s*(?:hrs?|hours?)\s*(?:\/|per)\s*(?:wk|week)/i;
  const m = re.exec(text);
  if (m) return Math.min(60, parseInt(m[1], 10));
  if (/full[-\s]?time/i.test(text)) return 40;
  if (/part[-\s]?time/i.test(text)) return 20;
  return 20;
}

export function guessCategory(text: string): string {
  const t = text.toLowerCase();
  if (/(design|figma|ux|ui|brand)/.test(t)) return 'Design';
  if (/(engineer|developer|programming|software|react|node|python)/.test(t))
    return 'Engineering';
  if (/(marketing|seo|sem|content|copy)/.test(t)) return 'Marketing';
  if (/(data|analytics|ml|ai|sql)/.test(t)) return 'Data';
  if (/(ops|project|program|manager)/.test(t)) return 'Operations';
  return 'General';
}

export function guessIndustry(text: string): string {
  const t = text.toLowerCase();
  if (/(fintech|finance|bank)/.test(t)) return 'Fintech';
  if (/(health|medical|pharma|biotech)/.test(t)) return 'Healthcare';
  if (/(ecommerce|retail|shop|marketplace)/.test(t)) return 'Ecommerce';
  if (/(saas|b2b|enterprise)/.test(t)) return 'SaaS';
  return 'General';
}

export function normalize(
  raw: RawScrape,
  ctx: { sourceUrl?: string } = {},
): NormalizedPayload {
  const budget = parseBudget(raw.compensation);
  const corpus = `${raw.title}\n${raw.description}`;
  return {
    title: raw.title?.trim() || 'Untitled role',
    category: raw.category ?? guessCategory(corpus),
    client: raw.company?.trim() || '',
    description: raw.description?.trim() || '',
    hoursPerWeek: raw.hoursPerWeek ?? parseHoursPerWeek(corpus),
    duration: raw.duration ?? 'Ongoing',
    timezone: raw.timezone ?? 'Flexible',
    budget,
    skills: extractSkills(corpus, raw.skills),
    industry: raw.industry ?? guessIndustry(corpus),
    sourceUrl: ctx.sourceUrl,
  };
}
