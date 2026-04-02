# S02: Attack Priorities Roadmap

**Demo Sentence:** After this slice, you have a ranked, scoped roadmap of the 5 attack priorities—with each priority connected to the pillars it serves and the criteria it requires.

**Parent Milestone:** M001 — Bruce Wayne's Sovereignty Strategy

**Status:** In Progress

---

## Boundary Map

**CONSUMES:**
- M001-strategy-living.md (Section III — Attack Vectors)
- S01/pillars-defined.md (Pillar 1-5 criteria)
- S01/sovereignty-scorecard.md (current pillar scores — optional)

**PRODUCES:**
- priorities-ranked.md — Priority 1-5 with selection rationale
- priority-1-privacy.md — scoped requirements for zkTLS infrastructure
- priority-2-crosschain.md — scoped requirements for chain abstraction
- priority-3-ai-risk.md — scoped requirements for agent guardrails
- priority-4-payments.md — scoped requirements for self-custody bridge
- priority-5-compliance.md — scoped requirements for RegTech
- decision-log.md — why these 5, why this order
- slice-boundaries.md — what each priority needs from others

---

## Must-Haves (Verification Criteria)

### Truths (Observable Behaviors)
- [ ] All 5 priorities are ranked with clear rationale
- [ ] Each priority maps to ≥2 pillar criteria it serves
- [ ] Each priority has a "start this if..." trigger condition
- [ ] The order reflects dependency logic (not just preference)

### Artifacts (Files That Must Exist)
- [ ] `priorities-ranked.md` — 200+ lines, full ranking logic
- [ ] `priority-1-privacy.md` — scoped to actionable requirements
- [ ] `priority-2-crosschain.md` — scoped to actionable requirements
- [ ] `priority-3-ai-risk.md` — scoped to actionable requirements
- [ ] `priority-4-payments.md` — scoped to actionable requirements
- [ ] `priority-5-compliance.md` — scoped to actionable requirements
- [ ] `decision-log.md` — captures why rankings were chosen

### Key Links
- [ ] All priority files reference specific pillar criteria from S01
- [ ] priorities-ranked.md imports and displays pillar dependencies
- [ ] Each priority file has a "needs from other priorities" section

---

## Notes

The 5 priorities from M001:
1. Privacy Infrastructure (Pillar 1 & 3)
2. Cross-Chain Abstraction (Pillar 2)
3. AI Risk Infrastructure (Pillar 3 & 5)
4. Self-Custody Payments (Pillar 2 & 5)
5. Compliance That Works (Pillar 4 & 5)

Key question: Is this the right order? Can we start #2 before #1 is done? What are the real dependencies?

**Started:** 2026-03-09
**Target Completion:** 2026-03-09 (single session)
