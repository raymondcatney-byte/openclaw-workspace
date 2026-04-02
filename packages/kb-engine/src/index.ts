// packages/kb-engine/src/index.ts
// Main exports for KB Causation Engine

export { KBVectorStore } from './vector-store';
export { PatternExtractor } from './pattern-extractor';
export { CausationEngine } from './causation-engine';
export * from './types';

// Convenience function to initialize full engine
import { KBVectorStore } from './vector-store';
import { PatternExtractor } from './pattern-extractor';
import { CausationEngine } from './causation-engine';

export function createKBEngine() {
  const vectorStore = new KBVectorStore();
  const patternExtractor = new PatternExtractor(vectorStore);
  const causationEngine = new CausationEngine(vectorStore, patternExtractor);
  
  return {
    vectorStore,
    patternExtractor,
    causationEngine
  };
}
