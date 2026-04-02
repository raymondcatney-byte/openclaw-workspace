import { SECTORS, Sector } from '@/types';

export function classifySector(question: string): Sector | 'OTHER' {
  const q = question.toLowerCase();
  
  for (const [sector, keywords] of Object.entries(SECTORS)) {
    if (keywords.some(kw => q.includes(kw.toLowerCase()))) {
      return sector as Sector;
    }
  }
  
  return 'OTHER';
}

export function getAllSectors(): string[] {
  return Object.keys(SECTORS);
}
