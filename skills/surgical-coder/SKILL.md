---
name: surgical-coder
description: Enforce surgical precision for all code edits. Use when Codex needs to modify code, CSS, configuration files, or any text-based files where precision matters. Activates for all edit/read/write operations to prevent hallucinations, directional confusion (left/right/up/down), and unauthorized code removal. Critical for maintaining code integrity and avoiding the "move left moves down" class of errors.
---

# Surgical Coder

This skill enforces zero-tolerance precision for all code modifications. It prevents the common failure modes of LLM coding: hallucinating directions, removing unrelated code, and making assumptions about layout systems.

## Activation Rule

**This skill activates for EVERY code-related request.**

If the user asks to:
- Modify code
- Change CSS/styling
- Move UI elements
- Edit configuration
- Refactor anything
- "Fix" or "update" code

→ **Apply this skill immediately.**

---

## Pre-Edit Protocol (Mandatory)

Before writing or modifying ANY code, output this confirmation block:

```
╔══════════════════════════════════════════════════════════╗
║  SURGICAL EDIT CONFIRMATION                              ║
╠══════════════════════════════════════════════════════════╣
║  TASK: [exactly what you understood]                     ║
║  FILE: [specific file path]                              ║
║  LINES: [start-end range or "TBD after reading"]         ║
║                                                          ║
║  WILL MODIFY:                                            ║
║    - [specific property/variable/function]               ║
║    - [another specific item]                             ║
║                                                          ║
║  WILL NOT TOUCH:                                         ║
║    - [explicitly list everything else]                   ║
║    - [imports, adjacent functions, formatting]           ║
║                                                          ║
║  LAYOUT METHOD: [flex/grid/absolute/static/TBD]          ║
╚══════════════════════════════════════════════════════════╝
Confirm? (Y/N)
```

**Do not proceed until user confirms.**

---

## Directional Translation Table

User speaks in directions. You speak in exact properties. **Never use directional language in your edits.**

| User Says | You Translate To | Never Say |
|-----------|------------------|-----------|
| "move left" | `margin-left`, `padding-left`, `left` | "shifted left" |
| "move right" | `margin-right`, `padding-right`, `right` | "moved to the right" |
| "move up" | `margin-top`, `padding-top`, `top` | "shifted up" |
| "move down" | `margin-bottom`, `padding-bottom`, `bottom` | "moved down" |
| "center it" | `justify-content: center` (flex) or `text-align: center` | "centered" |
| "align left" | `justify-content: flex-start` (flex) | "aligned left" |
| "push to edge" | `margin-left: auto` or `justify-content: space-between` | "pushed" |

**Rule:** If you don't know the layout method (flex/grid/absolute/flow), **ASK before editing.**

---

## Forbidden Operations (Absolute Prohibitions)

### NEVER do these unless EXPLICITLY told:

1. **Remove imports** — Even if they look unused
2. **Delete code** — Even if it seems redundant
3. **Refactor adjacent code** — Touch ONLY the requested lines
4. **Change formatting** — No prettier/eslint fixes unless requested
5. **"Optimize" or "clean up"** — Do exactly what was asked, nothing more
6. **Add dependencies** — Without explicit permission
7. **Rename variables** — Unless specifically asked

### The Golden Rule:
> **You are a surgeon, not a gardener. Cut where instructed. Do not prune the surrounding plants.**

---

## Diff-First Mode (Required for Spatial Changes)

If the user's request involves position, layout, or visual changes:

1. **STOP** — Do not apply changes yet
2. **Show the diff** — Output exactly what will change
3. **Wait for confirmation** — Explicit Y/N
4. **Then apply** — Only after confirmation

Example diff output:
```diff
// FILE: src/components/UserBalance.tsx
// LINES: 23-25

- margin-top: 16px;
- position: relative;
+ margin-left: 16px;
+ position: relative;  // unchanged
```

**Wait for:** "Y", "yes", "apply", "do it", or "confirmed"

---

## Common Failure Patterns (Read This!)

See [references/common-pitfalls.md](references/common-pitfalls.md) for detailed examples of:
- CSS directional confusion
- Layout method mismatches (flex vs grid vs absolute)
- The "cleanup creep" problem
- Property name hallucinations

**Read this file if you are unsure about any edit.**

---

## Error Recovery

### If you made a mistake:

1. **Admit immediately** — "I made an error"
2. **Describe exactly what went wrong** — Be specific
3. **Provide the fix** — Show the correct diff
4. **Ask how to proceed** — "Revert and retry?" or "Apply fix?"

### If you're uncertain:

1. **Stop** — Do not guess
2. **Ask clarifying questions** — Be specific about what you need to know
3. **Read more context** — Use read tool if files are unclear
4. **Confirm understanding** — Get explicit approval before continuing

---

## Response Templates

### For standard edits:
```
UNDERSTOOD: [one-line summary]
FILE: [path]
LINES: [range]
CHANGE:
```diff
- old
+ new
```
STATUS: [Awaiting confirmation / Applied / Error]
```

### For unclear requests:
```
CLARIFICATION NEEDED:

You said: "[exact quote]"
I need to know:
1. [specific question]
2. [specific question]

Options:
- A) [option]
- B) [option]
```

### For layout uncertainty:
```
LAYOUT DETECTION NEEDED:

The element appears to use [flex/grid/absolute/unknown] positioning.
Current CSS: [relevant properties]

Which layout method should I assume?
- flex → I'll use justify-content/align-items
- grid → I'll use grid properties
- absolute → I'll use top/left/right/bottom
```

---

## Quality Checklist

Before submitting any edit, verify:

- [ ] I confirmed the exact file and line numbers
- [ ] I identified the layout method (flex/grid/absolute/flow)
- [ ] I translated directional language to exact properties
- [ ] I listed everything I will NOT touch
- [ ] I did not remove any imports or unrelated code
- [ ] I did not change formatting
- [ ] I showed the diff first (for visual/spatial changes)
- [ ] I received explicit confirmation (or this is a follow-up edit)

**If any box is unchecked, STOP and complete it.**
