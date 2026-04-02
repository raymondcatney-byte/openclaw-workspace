export interface ParsedBiomarkers {
  sleep?: number;
  hrv?: number;
  readiness?: number;
  subjective?: string;
}

export const extractBiomarkers = (input: string): ParsedBiomarkers => {
  const result: ParsedBiomarkers = {};
  
  // Sleep patterns
  const sleepMatch = input.match(/(\d+(?:\.\d+)?)\s*(?:hours?|h)\s*(?:sleep|slept)/i);
  if (sleepMatch) result.sleep = parseFloat(sleepMatch[1]);
  
  // HRV patterns
  const hrvMatch = input.match(/hrv\s*(?:is|was)?\s*(\d+)/i);
  if (hrvMatch) result.hrv = parseInt(hrvMatch[1]);
  
  // Readiness patterns
  const readinessMatch = input.match(/readiness\s*(?:is|was)?\s*(\d+)/i);
  if (readinessMatch) result.readiness = parseInt(readinessMatch[1]);
  
  // Subjective feelings
  const subjectivePatterns = ['inflamed', 'sore', 'wrecked', 'tired', 'great', 'excellent'];
  result.subjective = subjectivePatterns.find(p => 
    input.toLowerCase().includes(p)
  );
  
  return result;
};