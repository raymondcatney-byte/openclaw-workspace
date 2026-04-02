/**
 * Knowledge Graph Skill — graphiti pattern
 * Neo4j-based graph for supplement/drug/condition interactions
 */

import neo4j, { Driver, Session } from 'neo4j-driver';

export interface Entity {
  id: string;
  name: string;
  type: 'supplement' | 'drug' | 'condition' | 'mechanism' | 'pathway';
  properties: Record<string, any>;
}

export interface Relationship {
  from: string;
  to: string;
  type: 'interacts_with' | 'contraindicated_for' | 'treats' | 'affects' | 'inhibits' | 'enhances' | 'similar_to';
  properties: {
    strength: 'strong' | 'moderate' | 'weak' | 'unknown';
    evidence: 'clinical' | 'preclinical' | 'theoretical' | 'anecdotal';
    mechanism?: string;
    source?: string;
  };
}

export class KnowledgeGraphSkill {
  private driver: Driver;
  
  constructor() {
    const uri = process.env.NEO4J_URI;
    const user = process.env.NEO4J_USER;
    const password = process.env.NEO4J_PASSWORD;
    
    if (!uri || !user || !password) {
      throw new Error('NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD required');
    }
    
    this.driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
  }
  
  /**
   * Add entity to graph
   */
  async addEntity(entity: Entity): Promise<void> {
    const session = this.driver.session();
    try {
      await session.run(`
        MERGE (e:Entity {id: $id})
        SET e.name = $name,
            e.type = $type,
            e += $properties
      `, entity);
    } finally {
      await session.close();
    }
  }
  
  /**
   * Add relationship between entities
   */
  async addRelationship(rel: Relationship): Promise<void> {
    const session = this.driver.session();
    try {
      await session.run(`
        MATCH (a:Entity {id: $from}), (b:Entity {id: $to})
        MERGE (a)-[r:${rel.type}]->(b)
        SET r.strength = $strength,
            r.evidence = $evidence,
            r += $properties
      `, {
        ...rel,
        properties: rel.properties
      });
    } finally {
      await session.close();
    }
  }
  
  /**
   * Check for interactions between substances
   */
  async checkInteraction(substance1: string, substance2: string): Promise<{
    hasInteraction: boolean;
    interactions: Array<{
      type: string;
      strength: string;
      evidence: string;
      mechanism?: string;
      recommendation: string;
    }>;
    paths: string[][];
  }> {
    const session = this.driver.session();
    try {
      // Direct interactions
      const directResult = await session.run(`
        MATCH (a:Entity)-[r:interacts_with|contraindicated_for|inhibits|enhances]-(b:Entity)
        WHERE (toLower(a.name) CONTAINS toLower($s1) OR a.id = $s1)
          AND (toLower(b.name) CONTAINS toLower($s2) OR b.id = $s2)
        RETURN a.name as from, b.name as to, type(r) as relType, r as rel
      `, { s1: substance1, s2: substance2 });
      
      const interactions = directResult.records.map(r => ({
        type: r.get('relType'),
        strength: r.get('rel').properties.strength || 'unknown',
        evidence: r.get('rel').properties.evidence || 'unknown',
        mechanism: r.get('rel').properties.mechanism,
        recommendation: this.getRecommendation(r.get('rel').properties)
      }));
      
      // Indirect paths (via mechanisms, pathways)
      const indirectResult = await session.run(`
        MATCH path = (a:Entity)-[:affects|inhibits|enhances*2..3]-(b:Entity)
        WHERE (toLower(a.name) CONTAINS toLower($s1) OR a.id = $s1)
          AND (toLower(b.name) CONTAINS toLower($s2) OR b.id = $s2)
          AND a <> b
        RETURN [node in nodes(path) | node.name] as pathNames
        LIMIT 5
      `, { s1: substance1, s2: substance2 });
      
      const paths = indirectResult.records.map(r => r.get('pathNames') as string[]);
      
      return {
        hasInteraction: interactions.length > 0 || paths.length > 0,
        interactions,
        paths
      };
    } finally {
      await session.close();
    }
  }
  
  /**
   * Find substances that affect a condition or mechanism
   */
  async findSubstancesFor(target: string, relationship: string = 'treats'): Promise<Entity[]> {
    const session = this.driver.session();
    try {
      const result = await session.run(`
        MATCH (s:Entity)-[r:${relationship}]-(t:Entity)
        WHERE toLower(t.name) CONTAINS toLower($target) OR t.id = $target
        RETURN s as entity, r as rel
        ORDER BY r.evidence = 'clinical' DESC, r.strength = 'strong' DESC
        LIMIT 10
      `, { target });
      
      return result.records.map(r => ({
        id: r.get('entity').properties.id,
        name: r.get('entity').properties.name,
        type: r.get('entity').properties.type,
        properties: {
          ...r.get('entity').properties,
          relationshipStrength: r.get('rel').properties.strength,
          evidence: r.get('rel').properties.evidence
        }
      }));
    } finally {
      await session.close();
    }
  }
  
  /**
   * Get mechanism of action for a substance
   */
  async getMechanism(substance: string): Promise<{
    directMechanisms: string[];
    affectedPathways: string[];
    downstreamEffects: string[];
  }> {
    const session = this.driver.session();
    try {
      const result = await session.run(`
        MATCH (s:Entity)-[r:affects|inhibits|enhances]-(m:Entity)
        WHERE toLower(s.name) CONTAINS toLower($substance) OR s.id = $substance
        RETURN m.name as mechanism, m.type as type, type(r) as relType
      `, { substance });
      
      const mechanisms = result.records;
      
      return {
        directMechanisms: mechanisms
          .filter(r => r.get('type') === 'mechanism')
          .map(r => r.get('mechanism')),
        affectedPathways: mechanisms
          .filter(r => r.get('type') === 'pathway')
          .map(r => r.get('mechanism')),
        downstreamEffects: mechanisms
          .filter(r => r.get('type') === 'condition')
          .map(r => r.get('mechanism'))
      };
    } finally {
      await session.close();
    }
  }
  
  /**
   * Seed the graph with common supplement/drug interactions
   */
  async seedCommonInteractions(): Promise<void> {
    // NMN
    await this.addEntity({
      id: 'nmn',
      name: 'NMN',
      type: 'supplement',
      properties: { category: 'longevity', mechanism: 'NAD+ precursor' }
    });
    
    // Metformin
    await this.addEntity({
      id: 'metformin',
      name: 'Metformin',
      type: 'drug',
      properties: { category: 'diabetes', mechanism: 'AMPK activator' }
    });
    
    // Add interaction
    await this.addRelationship({
      from: 'nmn',
      to: 'metformin',
      type: 'interacts_with',
      properties: {
        strength: 'moderate',
        evidence: 'theoretical',
        mechanism: 'Both affect NAD+/AMPK pathways',
        source: 'examine.com'
      }
    });
    
    // Add more seed data...
    const seeds = [
      { id: 'creatine', name: 'Creatine', type: 'supplement', props: { category: 'performance' } },
      { id: 'magnesium', name: 'Magnesium', type: 'supplement', props: { category: 'mineral' } },
      { id: 'caffeine', name: 'Caffeine', type: 'supplement', props: { category: 'stimulant' } },
      { id: 'sleep_quality', name: 'Sleep Quality', type: 'condition', props: {} },
      { id: 'nad_plus', name: 'NAD+', type: 'mechanism', props: {} },
    ];
    
    for (const seed of seeds) {
      await this.addEntity({
        id: seed.id,
        name: seed.name,
        type: seed.type as any,
        properties: seed.props
      });
    }
    
    // Common relationships
    await this.addRelationship({
      from: 'magnesium',
      to: 'sleep_quality',
      type: 'treats',
      properties: { strength: 'moderate', evidence: 'clinical', source: 'pubmed' }
    });
    
    await this.addRelationship({
      from: 'caffeine',
      to: 'sleep_quality',
      type: 'inhibits',
      properties: { strength: 'strong', evidence: 'clinical', source: 'pubmed' }
    });
  }
  
  private getRecommendation(relProps: any): string {
    const strength = relProps.strength || 'unknown';
    const evidence = relProps.evidence || 'unknown';
    
    if (relProps.type === 'contraindicated_for') {
      return 'Avoid combination. Use alternative.';
    }
    
    if (strength === 'strong' && evidence === 'clinical') {
      return 'Significant interaction. Monitor closely or avoid.';
    }
    
    if (strength === 'moderate') {
      return 'Possible interaction. Monitor for effects.';
    }
    
    return 'Interaction theoretical or weak. Generally safe to combine with awareness.';
  }
  
  async close(): Promise<void> {
    await this.driver.close();
  }
}