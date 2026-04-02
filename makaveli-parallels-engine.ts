#!/usr/bin/env node
/**
 * MAKAVELI PARALLELS ENGINE
 * Historical analogies and precedent mapping for strategic analysis
 * Provides decision-making reference points without replacing Makaveli's judgment
 */

import * as fs from 'fs';

// ============================================================================
// HISTORICAL PARALLELS DATABASE
// ============================================================================

interface HistoricalCase {
  id: string;
  name: string;
  date: string;
  region: string;
  scenarioType: string[];
  summary: string;
  keyActors: Actor[];
  strategicDynamics: StrategicDynamic[];
  outcome: Outcome;
  lessons: Lesson[];
  relevanceScore?: number; // Calculated at runtime
}

interface Actor {
  name: string;
  type: 'great_power' | 'regional_power' | 'proxy' | 'non_state' | 'alliance';
  objectives: string[];
  constraints: string[];
  resources: string[];
}

interface StrategicDynamic {
  factor: string;
  description: string;
  weight: 'critical' | 'high' | 'medium' | 'low';
}

interface Outcome {
  result: 'decisive_victory' | 'limited_victory' | 'stalemate' | 'limited_defeat' | 'decisive_defeat' | 'ongoing';
  duration: string;
  casualties?: string;
  economicImpact?: string;
  geopoliticalShift: string;
}

interface Lesson {
  insight: string;
  applicability: string[];
  caveats: string[];
}

interface ParallelMatch {
  historicalCase: HistoricalCase;
  relevanceScore: number;
  matchingFactors: string[];
  divergingFactors: string[];
  makaveliNote: string;
}

// Historical Cases Database
const HISTORICAL_CASES: HistoricalCase[] = [
  {
    id: 'suez_1956',
    name: 'Suez Crisis',
    date: '1956',
    region: 'Middle East',
    scenarioType: ['decapitation_attempt', 'regional_war', 'resource_stranglehold', 'great_power_proxy'],
    summary: 'Anglo-French-Israeli attempt to seize Suez Canal and topple Nasser. Successful military operation failed strategically due to superpower pressure and financial warfare.',
    keyActors: [
      {
        name: 'United Kingdom/France',
        type: 'great_power',
        objectives: ['Regain canal control', 'Remove Nasser', 'Restore colonial prestige'],
        constraints: ['Post-war financial weakness', 'U.S. opposition', 'Domestic opposition'],
        resources: ['Military superiority', 'Naval power', 'Diplomatic alliances']
      },
      {
        name: 'Egypt',
        type: 'regional_power',
        objectives: ['Maintain sovereignty', 'Control canal revenue', 'Lead Arab nationalism'],
        constraints: ['Military inferiority', 'Economic isolation'],
        resources: ['Soviet backing', 'Canal control as leverage', 'Nationalist mobilization']
      },
      {
        name: 'United States',
        type: 'great_power',
        objectives: ['Prevent Soviet entry', 'Maintain financial stability', 'Assert leadership'],
        constraints: ['NATO alliance tensions', 'Cold War priorities'],
        resources: ['Financial leverage (Sterling crisis)', 'Diplomatic pressure', 'Oil supply threats']
      }
    ],
    strategicDynamics: [
      { factor: 'Decapitation failed to collapse regime', description: 'Nasser survived, regime consolidated around anti-colonial resistance', weight: 'critical' },
      { factor: 'Financial warfare decisive', description: 'U.S. threat to dump Sterling forced British withdrawal', weight: 'critical' },
      { factor: 'Military success ≠ strategic victory', description: 'Canal seized but operation politically untenable', weight: 'critical' },
      { factor: 'Superpower red lines enforced', description: 'Soviet nuclear threats + U.S. financial pressure ended conflict', weight: 'high' }
    ],
    outcome: {
      result: 'decisive_defeat',
      duration: '2 months',
      casualties: '3,000+',
      economicImpact: 'British/French humiliation, end of imperial era',
      geopoliticalShift: 'U.S. replaces UK/France as Middle East arbiter; Soviet influence expands'
    },
    lessons: [
      {
        insight: 'Decapitation strikes without follow-through invite prolonged resistance',
        applicability: ['leadership_decapitation', 'regime_change_attempts'],
        caveats: ['Requires total military occupation to succeed', 'Nationalist backlash likely']
      },
      {
        insight: 'Financial leverage can defeat military superiority',
        applicability: ['economic_warfare', 'sanctions_strategy'],
        caveats: ['Requires control of reserve currency or key markets']
      },
      {
        insight: 'Secondary powers cannot challenge superpower consensus',
        applicability: ['regional_hegemons', 'coalition_warfare'],
        caveats: ['Superpowers must agree on red lines']
      }
    ]
  },
  {
    id: 'tanker_war_1984_88',
    name: 'Tanker War (Iran-Iraq)',
    date: '1984-1988',
    region: 'Persian Gulf',
    scenarioType: ['strait_closure', 'resource_denial', 'attrition_warfare', 'naval_blockade'],
    summary: 'Iran and Iraq attacked shipping to deprive each other of oil revenue. U.S. escort operations eventually broke Iranian blockade strategy.',
    keyActors: [
      {
        name: 'Iran',
        type: 'regional_power',
        objectives: ['Punish Gulf Arab backers of Iraq', 'Maintain Hormuz leverage', 'Outlast Saddam'],
        constraints: ['Outgunned conventionally', 'International isolation', 'War exhaustion'],
        resources: ['Asymmetric naval capabilities', 'Mine warfare', 'Silkworm missiles', 'Revolutionary zeal']
      },
      {
        name: 'Iraq',
        type: 'regional_power',
        objectives: ['Secure oil exports', 'Force Iranian acceptance of ceasefire', 'Maintain Gulf support'],
        constraints: ['Landlocked effectively', 'Dependence on Gulf ports'],
        resources: ['Air superiority', 'Superpower backing', 'Chemical weapons']
      },
      {
        name: 'United States',
        type: 'great_power',
        objectives: ['Protect oil flows', 'Contain Iran', 'Prevent Soviet entry'],
        constraints: ['Vietnam syndrome', 'Congressional wariness', 'Escalation risks'],
        resources: ['Naval supremacy', 'Regional basing', 'Coalition building']
      }
    ],
    strategicDynamics: [
      { factor: 'Hormuz closure unsustainable against great power', description: 'Iran could harass but not close strait against U.S. naval power', weight: 'critical' },
      { factor: 'Attrition favored the economically stronger', description: 'Iraq with Gulf backing outlasted isolated Iran', weight: 'critical' },
      { factor: 'Asymmetric warfare prolonged but did not win', description: 'Iranian innovations delayed defeat but not prevented', weight: 'high' },
      { factor: 'International coalition broke blockade', description: 'Reflagging operation made attacks politically costly', weight: 'high' }
    ],
    outcome: {
      result: 'stalemate',
      duration: '4 years (tanker phase)',
      casualties: '500+ sailors, 546 merchant ships damaged',
      economicImpact: 'Insurance rates soared, oil prices volatile but supplies maintained',
      geopoliticalShift: 'U.S. establishes permanent Gulf naval presence; Iran isolated'
    },
    lessons: [
      {
        insight: 'Hormuz can be harassed but not closed against determined great power',
        applicability: ['strait_closure_scenarios', 'naval_blockade'],
        caveats: ['Requires sustained U.S. commitment', 'Coalition support essential']
      },
      {
        insight: 'Mine warfare effective for denial, not control',
        applicability: ['asymmetric_naval', 'area_denial'],
        caveats: ['Can be cleared eventually', 'International condemnation follows']
      },
      {
        insight: 'Attrition warfare favors the economically integrated',
        applicability: ['protracted_conflict', 'sanctions_regimes'],
        caveats: ['Requires time and domestic patience', 'Revolutionary regimes may endure more pain']
      }
    ]
  },
  {
    id: 'libya_2011',
    name: 'Libyan Intervention',
    date: '2011',
    region: 'North Africa',
    scenarioType: ['decapitation_success', 'regime_change', 'air_campaign', 'coalition_warfare'],
    summary: 'NATO air campaign enabled rebel victory and Gaddafi death. Rapid success but created power vacuum and prolonged instability.',
    keyActors: [
      {
        name: 'NATO',
        type: 'alliance',
        objectives: ['Protect civilians', 'Remove Gaddafi', 'Prevent massacre'],
        constraints: ['No ground troops', 'UN mandate limitations', 'Alliance divisions'],
        resources: ['Air superiority', 'Precision munitions', 'Intelligence support']
      },
      {
        name: 'Libyan Rebels',
        type: 'non_state',
        objectives: ['Overthrow Gaddafi', 'Control oil revenue', 'Regional autonomy'],
        constraints: ['Lack heavy weapons', 'Organizational weakness', 'Factionalism'],
        resources: ['Popular support', 'Foreign air cover', 'Qatari/Turkish backing']
      },
      {
        name: 'Gaddafi Regime',
        type: 'regional_power',
        objectives: ['Survival', 'Crush rebellion', 'Maintain oil control'],
        constraints: ['International isolation', 'Defection of key tribes', 'No air defense'],
        resources: ['Mercenary forces', 'Cash reserves', 'Scorched earth capability']
      }
    ],
    strategicDynamics: [
      { factor: 'Air power sufficient without ground troops', description: 'Precision strikes + rebel ground force = regime collapse', weight: 'critical' },
      { factor: 'Decapitation succeeded but state collapsed', description: 'Gaddafi death ended regime but not conflict', weight: 'critical' },
      { factor: 'Coalition held despite divergent interests', description: 'Qatar/Turkey armed Islamists; France wanted quick win', weight: 'high' },
      { factor: 'No post-conflict plan', description: 'Power vacuum led to civil war, migration crisis', weight: 'critical' }
    ],
    outcome: {
      result: 'decisive_victory',
      duration: '8 months',
      casualties: '20,000+',
      economicImpact: 'Oil production collapse, migration crisis affects EU',
      geopoliticalShift: 'NATO role affirmed but "responsibility to protect" discredited by aftermath'
    },
    lessons: [
      {
        insight: 'Air campaigns can achieve regime change but not stability',
        applicability: ['limited_intervention', 'air_campaigns'],
        caveats: ['Requires capable local partners', 'Post-conflict planning essential']
      },
      {
        insight: 'Decapitation without institution-building creates vacuum',
        applicability: ['regime_change', 'state_collapse'],
        caveats: ['Tribal/sectarian divisions accelerate fragmentation']
      },
      {
        insight: 'Coalition warfare requires aligned end states',
        applicability: ['multilateral_operations', 'proxy_warfare'],
        caveats: ['Hidden agendas undermine stability operations']
      }
    ]
  },
  {
    id: 'lebanon_2006',
    name: 'Second Lebanon War',
    date: '2006',
    region: 'Levant',
    scenarioType: ['asymmetric_warfare', 'decapitation_failure', 'proxy_conflict', 'missile_warfare'],
    summary: 'Israel attempted to destroy Hezbollah through air campaign and limited ground incursion. Hezbollah survived, Israel perceived as not achieving objectives.',
    keyActors: [
      {
        name: 'Israel',
        type: 'regional_power',
        objectives: ['Recover soldiers', 'Destroy Hezbollah', 'Restore deterrence'],
        constraints: ['Casualty aversion', 'Time pressure', 'International criticism'],
        resources: ['Air superiority', 'Precision munitions', 'Intelligence dominance']
      },
      {
        name: 'Hezbollah',
        type: 'non_state',
        objectives: ['Survive Israeli assault', 'Maintain rocket threat', 'Claim victory'],
        constraints: ['No air defense', 'Limited territory', 'Isolation from Lebanese state'],
        resources: ['Rocket arsenal (13,000+)', 'Bunker networks', 'Iranian resupply', 'Popular support in Shia areas']
      },
      {
        name: 'Iran',
        type: 'regional_power',
        typealias: 'patron',
        objectives: ['Test Israeli limits', 'Demonstrate proxy utility', 'Deter Israeli strike on Iran'],
        constraints: ['Direct involvement risks wider war'],
        resources: ['Weapons supply', 'Training', 'Financial support']
      }
    ],
    strategicDynamics: [
      { factor: 'Air power insufficient against dug-in irregulars', description: 'Bunker networks and rocket dispersal limited damage', weight: 'critical' },
      { factor: 'Decapitation failed - Nasrallah survived', description: 'Leadership survived, command and control intact', weight: 'critical' },
      { factor: 'Rocket attrition unsustainable for Israel', description: '4,000 rockets forced population displacement', weight: 'high' },
      { factor: 'Ground invasion too limited and late', description: '33 days of air war before serious ground operations', weight: 'high' }
    ],
    outcome: {
      result: 'limited_defeat',
      duration: '34 days',
      casualties: '1,200 Lebanese, 165 Israelis',
      economicImpact: '$2.5B Israeli damage, Lebanon infrastructure devastated',
      geopoliticalShift: 'Hezbollah prestige enhanced; Israeli deterrence questioned; Iran encouraged'
    },
    lessons: [
      {
        insight: 'Air campaigns cannot defeat dug-in irregular forces',
        applicability: ['counterinsurgency', 'asymmetric_warfare', 'proxy_destruction'],
        caveats: ['Requires willing ground force or total annihilation']
      },
      {
        insight: 'Missile arsenaries create unacceptable costs for limited wars',
        applicability: ['deterrence', 'area_denial', 'escalation_control'],
        caveats: ['Requires survivable launch capabilities']
      },
      {
        insight: 'Proxy forces can absorb punishment that states cannot',
        applicability: ['proxy_warfare', 'irregular_warfare'],
        caveats: ['Requires external resupply and popular tolerance']
      }
    ]
  },
  {
    id: 'ukraine_2014_22',
    name: 'Ukraine Conflict (2014-2022)',
    date: '2014-2022',
    region: 'Eastern Europe',
    scenarioType: ['hybrid_warfare', 'territorial_annexation', 'sanctions_warfare', 'great_power_proxy'],
    summary: 'Russian seizure of Crimea and Donbas using hybrid tactics. Western sanctions failed to reverse territorial changes. Demonstrated limits of economic warfare without military counter-pressure.',
    keyActors: [
      {
        name: 'Russia',
        type: 'great_power',
        objectives: ['Prevent NATO expansion', 'Secure Crimea', 'Maintain sphere of influence'],
        constraints: ['Economic exposure', 'International isolation', 'Military overextension'],
        resources: ['Energy leverage', 'Hybrid capabilities', 'Nuclear deterrent']
      },
      {
        name: 'Ukraine',
        type: 'regional_power',
        objectives: ['Territorial integrity', 'Western integration', 'Sovereignty'],
        constraints: ['Military weakness', 'Energy dependence', 'Corruption'],
        resources: ['Western support', 'Nationalist mobilization', 'Geographic depth']
      },
      {
        name: 'EU/NATO',
        type: 'alliance',
        objectives: ['Support Ukraine', 'Deter further expansion', 'Maintain sanctions'],
        constraints: ['Energy dependence', 'No military intervention', 'Divided resolve'],
        resources: ['Economic sanctions', 'Financial aid', 'Diplomatic pressure']
      }
    ],
    strategicDynamics: [
      { factor: 'Sanctions insufficient without military counter-pressure', description: 'Economic pain did not reverse territorial gains', weight: 'critical' },
      { factor: 'Hybrid warfare below Article 5 threshold', description: 'NATO could not respond directly to ambiguous aggression', weight: 'critical' },
      { factor: 'Energy leverage muted Western response', description: 'European dependence limited sanctions severity', weight: 'high' },
      { factor: 'Frozen conflict served Russian interests', description: 'Permanent instability prevented Ukrainian NATO integration', weight: 'high' }
    ],
    outcome: {
      result: 'limited_victory',
      duration: '8 years (frozen conflict)',
      casualties: '14,000+',
      economicImpact: 'Russian resilience despite sanctions; Ukraine economic crisis',
      geopoliticalShift: 'NATO unity tested; Russian revisionism affirmed; prelude to 2022 full invasion'
    },
    lessons: [
      {
        insight: 'Sanctions alone cannot reverse territorial conquest',
        applicability: ['economic_warfare', 'territorial_disputes'],
        caveats: ['Requires military counter-pressure or threat to succeed']
      },
      {
        insight: 'Hybrid warfare exploits alliance thresholds',
        applicability: ['asymmetric_warfare', 'alliance_management'],
        caveats: ['Requires nuclear escalation dominance to prevent direct response']
      },
      {
        insight: 'Energy dependence constrains economic warfare',
        applicability: ['sanctions_design', 'resource_politics'],
        caveats: ['Alternative supply routes reduce leverage over time']
      }
    ]
  },
  {
    id: 'yom_kippur_1973',
    name: 'Yom Kippur War',
    date: '1973',
    region: 'Middle East',
    scenarioType: ['surprise_attack', 'attrition_warfare', 'superpower_crisis', 'resource_weaponization'],
    summary: 'Egypt/Syria surprise attack on Israel. Initial Arab successes reversed by Israeli counter-attack. Arab oil embargo demonstrated resource weaponization.',
    keyActors: [
      {
        name: 'Egypt/Syria',
        type: 'regional_power',
        objectives: ['Recover territory', 'Restore Arab dignity', 'Force negotiations'],
        constraints: ['Military inferiority', 'Soviet equipment limitations', 'Israeli nuclear potential'],
        resources: ['Strategic surprise', 'Numerical superiority', 'Oil weapon']
      },
      {
        name: 'Israel',
        type: 'regional_power',
        objectives: ['Survival', 'Repel invasion', 'Maintain territorial gains'],
        constraints: ['Strategic surprise', 'Manpower limitations', 'Superpower pressure'],
        resources: ['Military quality', 'U.S. resupply', 'Nuclear deterrent']
      },
      {
        name: 'Saudi Arabia/OPEC',
        type: 'alliance',
        typealias: 'resource_leverager',
        objectives: ['Support Arab cause', 'Increase oil prices', 'Punish Western support of Israel'],
        constraints: ['Economic interdependence', 'Long-term market share'],
        resources: ['Oil production control', 'Financial reserves']
      }
    ],
    strategicDynamics: [
      { factor: 'Surprise achievable but not decisive', description: 'Initial gains reversed by day 10; war became attritional', weight: 'critical' },
      { factor: 'Oil weapon changed global calculations', description: 'Embargo quadrupled prices, forced Western pressure for ceasefire', weight: 'critical' },
      { factor: 'Superpower resupply determined outcome', description: 'U.S. airlift decisive; Soviet threats brought nuclear alert', weight: 'critical' },
      { factor: 'Limited war aims enabled settlement', description: 'Egypt sought territory recovery, not Israeli destruction', weight: 'high' }
    ],
    outcome: {
      result: 'stalemate',
      duration: '20 days',
      casualties: '16,000+',
      economicImpact: 'Oil shock triggered global recession, inflation',
      geopoliticalShift: 'Egypt pivots to U.S.; Arab oil power demonstrated; Kissinger diplomacy begins'
    },
    lessons: [
      {
        insight: 'Resource weaponization can succeed where military force cannot',
        applicability: ['economic_warfare', 'resource_denial', 'strait_closure'],
        caveats: ['Requires control of critical supply', 'Self-harm from price spikes']
      },
      {
        insight: 'Surprise attacks create windows, not victories',
        applicability: ['first_strike_scenarios', 'counteroffensive_planning'],
        caveats: ['Requires exploitation before enemy mobilizes']
      },
      {
        insight: 'Superpower resupply can reverse battlefield outcomes',
        applicability: ['proxy_warfare', 'great_power_intervention'],
        caveats: ['Risks direct superpower confrontation']
      }
    ]
  },
  {
    id: 'gulf_war_1991',
    name: 'Gulf War',
    date: '1991',
    region: 'Persian Gulf',
    scenarioType: ['coalition_warfare', 'overwhelming_force', 'decisive_victory', 'resource_protection'],
    summary: 'U.S.-led coalition expelled Iraq from Kuwait using overwhelming air and ground forces. Demonstrated conventional superiority but stopped short of regime change.',
    keyActors: [
      {
        name: 'Coalition',
        type: 'alliance',
        objectives: ['Liberate Kuwait', 'Destroy Iraqi WMD', 'Deter future aggression'],
        constraints: ['Casualty aversion', 'Arab coalition sensitivities', 'No regime change mandate'],
        resources: ['Air supremacy', 'Precision munitions', 'Global basing', '$60B+ funding']
      },
      {
        name: 'Iraq',
        type: 'regional_power',
        objectives: ['Retain Kuwait', 'Survive as regime', 'Inflict coalition casualties'],
        constraints: ['Military overmatch', 'International isolation', 'No strategic depth'],
        resources: ['Fourth-largest army', 'Fortified positions', 'Scud missiles', 'Chemical weapons']
      }
    ],
    strategicDynamics: [
      { factor: 'Overwhelming force achieved rapid victory', description: '100-hour ground war after 42-day air campaign', weight: 'critical' },
      { factor: 'Regime survival without occupation', description: 'Saddam survived because coalition stopped at Kuwait border', weight: 'critical' },
      { factor: 'Resource protection justified global coalition', description: 'Oil security brought Arab states and West together', weight: 'high' },
      { factor: 'Scud missiles ineffective but politically significant', description: 'Israeli restraint prevented coalition fracture', weight: 'high' }
    ],
    outcome: {
      result: 'decisive_victory',
      duration: '6 weeks',
      casualties: '100,000+ Iraqi, 300 coalition',
      economicImpact: 'Kuwait oil infrastructure destroyed; $60B war cost',
      geopoliticalShift: 'U.S. establishes permanent Gulf presence; Iraq contained until 2003'
    },
    lessons: [
      {
        insight: 'Overwhelming force prevents prolonged attrition',
        applicability: ['conventional_warfare', 'coalition_operations'],
        caveats: ['Requires political will for decisive action', 'Clear mandate essential']
      },
      {
        insight: 'Air campaigns alone cannot force regime change',
        applicability: ['limited_war', 'air_power_limits'],
        caveats: ['Requires ground occupation to remove regime']
      },
      {
        insight: 'Resource security creates unusual coalitions',
        applicability: ['energy_politics', 'multilateral_diplomacy'],
        caveats: ['Coalition fractures after immediate threat removed']
      }
    ]
  },
  {
    id: 'afghanistan_2001_2021',
    name: 'Afghanistan War',
    date: '2001-2021',
    region: 'Central Asia',
    scenarioType: ['regime_change', 'counterinsurgency', 'nation_building', 'proxy_abandonment'],
    summary: 'U.S. toppled Taliban in 3 months but failed to build stable state. 20-year occupation ended with Taliban return, demonstrating limits of military occupation without local legitimacy.',
    keyActors: [
      {
        name: 'United States/NATO',
        type: 'alliance',
        objectives: ['Destroy al-Qaeda', 'Remove Taliban', 'Build democratic Afghanistan'],
        constraints: ['Casualty aversion', 'Nation-building failures', 'Pakistani duplicity'],
        resources: ['Military supremacy', 'Economic aid', 'Global legitimacy']
      },
      {
        name: 'Taliban',
        type: 'non_state',
        objectives: ['Expel foreign occupiers', 'Restore Islamic Emirate', 'Outlast NATO'],
        constraints: ['No conventional capabilities', 'International isolation'],
        resources: ['Pakistani sanctuary', 'Rural support', 'Guerrilla tactics', 'Time']
      }
    ],
    strategicDynamics: [
      { factor: 'Regime change achieved but stability failed', description: 'Taliban fell in 3 months but insurgency never defeated', weight: 'critical' },
      { factor: 'Time favored the insurgent', description: 'NATO patience finite; Taliban patience infinite', weight: 'critical' },
      { factor: 'Sanctuary in Pakistan decisive', description: 'Quetta Shura directed insurgency with impunity', weight: 'critical' },
      { factor: 'Corruption eroded legitimacy', description: 'Kabul government never gained popular support', weight: 'high' }
    ],
    outcome: {
      result: 'decisive_defeat',
      duration: '20 years',
      casualties: '176,000+ total',
      economicImpact: '$2.3 trillion spent, Afghanistan economy collapsed',
      geopoliticalShift: 'U.S. credibility damaged; Taliban restored; China eyes resources'
    },
    lessons: [
      {
        insight: 'Military victory without political strategy becomes defeat',
        applicability: ['counterinsurgency', 'nation_building', 'regime_change'],
        caveats: ['Local legitimacy cannot be imported']
      },
      {
        insight: 'Sanctuary guarantees insurgent survival',
        applicability: ['counterinsurgency', 'proxy_warfare'],
        caveats: ['Requires neighboring state tolerance or support']
      },
      {
        insight: 'Time is asymmetric resource favoring defender',
        applicability: ['protracted_war', 'occupation_warfare'],
        caveats: ['Insurgent must avoid decisive battle']
      }
    ]
  },
  {
    id: 'cuban_missile_1962',
    name: 'Cuban Missile Crisis',
    date: '1962',
    region: 'Caribbean',
    scenarioType: ['nuclear_crisis', 'blockade', 'superpower_bargaining', 'face_saving_exit'],
    summary: 'Soviet missile deployment to Cuba triggered U.S. naval blockade. Resolved through secret concessions (Turkey missiles) allowing face-saving Soviet withdrawal.',
    keyActors: [
      {
        name: 'United States',
        type: 'great_power',
        objectives: ['Remove Soviet missiles', 'Demonstrate credibility', 'Avoid nuclear war'],
        constraints: ['Nuclear escalation risk', 'Alliance credibility', 'Domestic political pressure'],
        resources: ['Naval blockade capability', 'Nuclear superiority', 'Turkey missiles (bargaining chip)']
      },
      {
        name: 'Soviet Union',
        type: 'great_power',
        objectives: ['Protect Cuba', 'Achieve strategic parity', 'Avoid humiliation'],
        constraints: ['Inferior nuclear forces', 'Long supply lines', 'No strategic rationale to fight'],
        resources: ['Nuclear arsenal', 'Cuba as bargaining chip', 'Secrecy']
      }
    ],
    strategicDynamics: [
      { factor: 'Blockade provided escalation control', description: 'Naval "quarantine" allowed time for negotiation', weight: 'critical' },
      { factor: 'Secret concessions enabled face-saving', description: 'Turkey missiles traded quietly for Cuba missiles', weight: 'critical' },
      { factor: 'Nuclear parity created mutual vulnerability', description: 'Both sides understood war meant mutual destruction', weight: 'critical' },
      { factor: 'Time pressure forced resolution', description: 'Missiles becoming operational created deadline', weight: 'high' }
    ],
    outcome: {
      result: 'negotiated_settlement',
      duration: '13 days',
      casualties: '1 (U-2 pilot shot down)',
      economicImpact: 'Minimal direct; defense spending increased',
      geopoliticalShift: 'Hotline established; Limited Test Ban Treaty; Soviet seeks parity'
    },
    lessons: [
      {
        insight: 'Face-saving exits prevent nuclear escalation',
        applicability: ['crisis_management', 'superpower_bargaining', 'nuclear_deterrence'],
        caveats: ['Requires trusted backchannels', 'Both sides must want to de-escalate']
      },
      {
        insight: 'Limited force options create negotiation space',
        applicability: ['escalation_control', 'coercive_diplomacy'],
        caveats: ['Must be credible enough to pressure, limited enough to not force war']
      },
      {
        insight: 'Deadline pressure can force concessions',
        applicability: ['crisis_bargaining', 'ultimatum_design'],
        caveats: ['Must leave time for face-saving arrangements']
      }
    ]
  }
];

// ============================================================================
// PARALLELS MATCHING ENGINE
// ============================================================================

interface ScenarioProfile {
  type: string[];
  actors: string[];
  keyFactors: string[];
  region?: string;
  intensity?: 'low' | 'medium' | 'high' | 'extreme';
}

class ParallelsEngine {
  private cases = HISTORICAL_CASES;
  
  findParallels(scenario: ScenarioProfile): ParallelMatch[] {
    const matches = this.cases.map(historicalCase => {
      const match = this.calculateMatch(scenario, historicalCase);
      return {
        historicalCase,
        relevanceScore: match.score,
        matchingFactors: match.matches,
        divergingFactors: match.divergences,
        makaveliNote: this.generateMakaveliNote(historicalCase, match)
      };
    });
    
    return matches
      .filter(m => m.relevanceScore > 0.3)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 5);
  }
  
  private calculateMatch(scenario: ScenarioProfile, historical: HistoricalCase): { score: number; matches: string[]; divergences: string[] } {
    let score = 0;
    const matches: string[] = [];
    const divergences: string[] = [];
    
    // Type matching (most important)
    const typeOverlap = scenario.type.filter(t => historical.scenarioType.includes(t)).length;
    score += (typeOverlap / Math.max(scenario.type.length, historical.scenarioType.length)) * 0.4;
    if (typeOverlap > 0) matches.push(`Scenario type overlap: ${typeOverlap} factors`);
    
    // Actor matching
    const actorTypes = historical.keyActors.map(a => a.type);
    scenario.actors.forEach(actor => {
      if (actorTypes.includes(actor as any)) {
        score += 0.15;
        matches.push(`Actor type: ${actor}`);
      }
    });
    
    // Factor matching
    scenario.keyFactors.forEach(factor => {
      const matchingDynamic = historical.strategicDynamics.find(d => 
        d.factor.toLowerCase().includes(factor.toLowerCase()) ||
        factor.toLowerCase().includes(d.factor.toLowerCase())
      );
      if (matchingDynamic) {
        score += matchingDynamic.weight === 'critical' ? 0.2 : matchingDynamic.weight === 'high' ? 0.1 : 0.05;
        matches.push(`Strategic dynamic: ${matchingDynamic.factor}`);
      }
    });
    
    // Region bonus
    if (scenario.region === historical.region) {
      score += 0.1;
      matches.push(`Regional context: ${historical.region}`);
    }
    
    // Divergences
    if (!scenario.region || scenario.region !== historical.region) {
      divergences.push('Different geopolitical context');
    }
    if (scenario.intensity && this.intensityDiffers(scenario.intensity, historical.outcome.casualties)) {
      divergences.push('Different scale of conflict');
    }
    
    return { score: Math.min(score, 1), matches, divergences };
  }
  
  private intensityDiffers(intensity: string, casualties?: string): boolean {
    if (!casualties) return false;
    const num = parseInt(casualties.replace(/[^0-9]/g, ''));
    if (intensity === 'extreme' && num < 100000) return true;
    if (intensity === 'low' && num > 10000) return true;
    return false;
  }
  
  private generateMakaveliNote(historical: HistoricalCase, match: { score: number; matches: string[] }): string {
    if (match.score > 0.8) {
      return `Strong parallel to ${historical.name}: ${historical.outcome.result.replace('_', ' ')}. Study ${historical.lessons[0].insight.substring(0, 60)}...`;
    } else if (match.score > 0.5) {
      return `Moderate parallel to ${historical.name}. Key difference: ${historical.scenarioType.find(t => !match.matches.includes(t)) || 'geopolitical context'}`;
    } else {
      return `Weak but instructive parallel. Consider ${historical.strategicDynamics[0]?.factor || 'lessons'} with caution.`;
    }
  }
  
  getLessonsForScenario(parallels: ParallelMatch[]): string[] {
    const lessons: string[] = [];
    parallels.slice(0, 3).forEach(p => {
      p.historicalCase.lessons.forEach(l => {
        lessons.push(`${p.historicalCase.name}: ${l.insight}`);
      });
    });
    return lessons;
  }
  
  formatForMakaveli(parallels: ParallelMatch[]): string {
    if (parallels.length === 0) {
      return 'No strong historical parallels found. This scenario may be without precedent.';
    }
    
    let output = '📜 HISTORICAL PARALLELS\n';
    output += '=' .repeat(70) + '\n\n';
    
    parallels.forEach((p, i) => {
      const h = p.historicalCase;
      const stars = '★'.repeat(Math.round(p.relevanceScore * 5));
      
      output += `${i + 1}. ${h.name} (${h.date}) ${stars}\n`;
      output += `   Relevance: ${Math.round(p.relevanceScore * 100)}% | Outcome: ${h.outcome.result.replace(/_/g, ' ')}\n`;
      output += `   ${h.summary.substring(0, 120)}...\n\n`;
      
      output += `   Matching Factors:\n`;
      p.matchingFactors.slice(0, 3).forEach(f => output += `      • ${f}\n`);
      
      if (p.divergingFactors.length > 0) {
        output += `   Key Differences:\n`;
        p.divergingFactors.slice(0, 2).forEach(f => output += `      ⚠ ${f}\n`);
      }
      
      output += `\n   Applicable Lessons:\n`;
      h.lessons.slice(0, 2).forEach(l => {
        output += `      💡 ${l.insight.substring(0, 80)}${l.insight.length > 80 ? '...' : ''}\n`;
      });
      
      output += `\n   🎭 Makaveli Note: "${p.makaveliNote}"\n`;
      output += '\n' + '-'.repeat(70) + '\n\n';
    });
    
    return output;
  }
}

// ============================================================================
// INTEGRATION WITH MAKAVELI FEED
// ============================================================================

export interface EnhancedIntelligenceReport {
  scenario: string;
  timestamp: string;
  parallels: ParallelMatch[];
  formattedParallels: string;
  applicableLessons: string[];
  probabilityAdjustment?: string;
}

export function generateParallelsForScenario(scenario: string): EnhancedIntelligenceReport {
  const engine = new ParallelsEngine();
  
  // Parse scenario for matching
  const profile = parseScenario(scenario);
  const parallels = engine.findParallels(profile);
  const lessons = engine.getLessonsForScenario(parallels);
  
  return {
    scenario,
    timestamp: new Date().toISOString(),
    parallels,
    formattedParallels: engine.formatForMakaveli(parallels),
    applicableLessons: lessons,
    probabilityAdjustment: generateProbabilityGuidance(parallels)
  };
}

function parseScenario(scenario: string): ScenarioProfile {
  const profile: ScenarioProfile = {
    type: [],
    actors: [],
    keyFactors: [],
    region: undefined
  };
  
  const lower = scenario.toLowerCase();
  
  // Detect scenario types
  if (lower.includes('hormuz') || lower.includes('strait') || lower.includes('blockade')) {
    profile.type.push('strait_closure', 'resource_denial', 'naval_blockade');
  }
  if (lower.includes('decapitat') || lower.includes('leadership') || lower.includes('strike')) {
    profile.type.push('decapitation_attempt');
  }
  if (lower.includes('proxy') || lower.includes('hezbollah') || lower.includes('militia')) {
    profile.type.push('proxy_conflict', 'asymmetric_warfare');
  }
  if (lower.includes('coalition') || lower.includes('nato') || lower.includes('alliance')) {
    profile.type.push('coalition_warfare');
  }
  if (lower.includes('nuclear') || lower.includes('missile crisis')) {
    profile.type.push('nuclear_crisis');
  }
  if (lower.includes('attrition') || lower.includes('protracted')) {
    profile.type.push('attrition_warfare');
  }
  
  // Detect actors
  if (lower.includes('us') || lower.includes('united states') || lower.includes('america')) {
    profile.actors.push('great_power');
  }
  if (lower.includes('iran') || lower.includes('iraq') || lower.includes('israel')) {
    profile.actors.push('regional_power');
  }
  if (lower.includes('hezbollah') || lower.includes('taliban') || lower.includes('rebel')) {
    profile.actors.push('non_state');
  }
  if (lower.includes('nato') || lower.includes('coalition') || lower.includes('gcc')) {
    profile.actors.push('alliance');
  }
  
  // Detect key factors
  if (lower.includes('oil') || lower.includes('energy')) profile.keyFactors.push('resource');
  if (lower.includes('sanction')) profile.keyFactors.push('sanction');
  if (lower.includes('surprise')) profile.keyFactors.push('surprise');
  if (lower.includes('air')) profile.keyFactors.push('air power');
  if (lower.includes('ground') || lower.includes('invasion')) profile.keyFactors.push('ground troops');
  
  // Detect region
  if (lower.includes('iran') || lower.includes('iraq') || lower.includes('gulf') || lower.includes('middle east')) {
    profile.region = 'Middle East';
  }
  if (lower.includes('ukraine') || lower.includes('europe')) {
    profile.region = 'Eastern Europe';
  }
  if (lower.includes('afghanistan') || lower.includes('central asia')) {
    profile.region = 'Central Asia';
  }
  
  return profile;
}

function generateProbabilityGuidance(parallels: ParallelMatch[]): string {
  if (parallels.length === 0) return 'No historical guidance available';
  
  const top = parallels[0];
  const outcome = top.historicalCase.outcome.result;
  
  const guidance: Record<string, string> = {
    'decisive_victory': 'Historical parallel suggests potential for rapid resolution if overwhelming force applied',
    'limited_victory': 'Expect partial success; limited objectives more achievable than regime change',
    'stalemate': 'Protracted conflict likely; attrition favors defender',
    'limited_defeat': 'Initiator may achieve tactical gains but fail strategic objectives',
    'decisive_defeat': 'High risk of failure; reconsider approach or escalate commitment',
    'negotiated_settlement': 'Crisis likely resolves through bargaining; identify face-saving options early'
  };
  
  return `Based on ${top.historicalCase.name}: ${guidance[outcome] || 'Outcome uncertain'}`;
}

// ============================================================================
// CLI OUTPUT
// ============================================================================

if (require.main === module) {
  const scenario = process.argv[2] || 'Iran conflict with Hormuz closure and decapitation strikes';
  
  console.log('\n🔮 MAKAVELI PARALLELS ENGINE');
  console.log('=' .repeat(70));
  console.log(`Scenario: ${scenario}\n`);
  
  const report = generateParallelsForScenario(scenario);
  console.log(report.formattedParallels);
  
  console.log('\n📊 PROBABILITY GUIDANCE');
  console.log('-'.repeat(70));
  console.log(report.probabilityAdjustment);
  
  console.log('\n💡 KEY LESSONS FOR MAKAVELI');
  console.log('-'.repeat(70));
  report.applicableLessons.slice(0, 5).forEach((lesson, i) => {
    console.log(`${i + 1}. ${lesson}`);
  });
  
  // Save report
  const filename = `parallels_${Date.now()}.json`;
  fs.writeFileSync(filename, JSON.stringify(report, null, 2));
  console.log(`\n💾 Report saved to ${filename}`);
}

export { ParallelsEngine, HISTORICAL_CASES };
