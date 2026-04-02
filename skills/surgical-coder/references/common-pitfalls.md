# Common Pitfalls in LLM Coding

This reference documents the specific failure modes that this skill prevents.

---

## 1. CSS Directional Confusion

### The Problem
Models confuse axes. "Move left" becomes `margin-top` because both are "spacing."

### Wrong:
```css
/* User said: "Move the text to the left" */
.text {
  margin-top: 16px;  /* WRONG: This moves it DOWN */
}
```

### Right:
```css
/* User said: "Move the text to the left" */
.text {
  margin-left: 16px;  /* CORRECT: Horizontal spacing */
}
```

### The Fix
Always map to exact properties:
- Left/right → `margin-left`, `margin-right`, `padding-left`, `padding-right`, `left`, `right`
- Up/down → `margin-top`, `margin-bottom`, `padding-top`, `padding-bottom`, `top`, `bottom`

---

## 2. Layout Method Mismatch

### The Problem
Applying flex properties to grid layouts, or absolute positioning to flow layouts.

### Wrong (Flex properties on static element):
```css
.container {
  /* This is NOT a flex container */
}
.item {
  justify-content: flex-start;  /* WRONG: Does nothing without display: flex */
}
```

### Right:
```css
.container {
  display: flex;  /* REQUIRED for justify-content to work */
}
.item {
  margin-right: auto;  /* Push to left in flex */
}
```

### Detection Strategy
Before editing, check for:
- `display: flex` → Use `justify-content`, `align-items`, `gap`
- `display: grid` → Use `grid-*` properties
- `position: absolute/relative/fixed` → Use `top`, `left`, `right`, `bottom`
- None of the above → Use `margin`, `padding`, `text-align`

---

## 3. The "Cleanup Creep" Problem

### The Problem
Model sees "unused" imports or "redundant" code and removes it while making requested changes.

### Wrong:
```typescript
// User said: "Change the button color to red"
// Model also did this:
-import { useCallback } from 'react';  // WRONG: "Looks unused"
import { Button } from './Button';

export function Form() {
  // ... later in file ...
  const handleSubmit = useCallback(() => {}, []);  // BROKEN: useCallback not imported
}
```

### Right:
```typescript
// User said: "Change the button color to red"
// Model ONLY did this:
import { useCallback } from 'react';  // UNCHANGED
import { Button } from './Button';

// In Button.tsx:
- color: blue;
+ color: red;
```

### The Rule
**NEVER** remove imports, delete code, or refactor adjacent lines unless the user **explicitly** says: "clean up unused imports" or "refactor this file."

---

## 4. Property Name Hallucinations

### The Problem
Model invents CSS properties that sound right but don't exist.

### Wrong:
```css
.element {
  align: center;           /* WRONG: Property doesn't exist */
  float-align: left;       /* WRONG: Not a real property */
  justify-align: start;    /* WRONG: Made up */
}
```

### Right:
```css
.element {
  text-align: center;      /* For inline content */
  justify-content: center; /* For flex containers */
  place-items: center;     /* For grid containers */
  float: left;             /* For floating (rarely used now) */
}
```

### Common Valid Properties
| Intent | Property |
|--------|----------|
| Center text (inline) | `text-align: center` |
| Center flex child | `justify-content: center` + `align-items: center` |
| Center grid child | `place-items: center` or `justify-items` + `align-items` |
| Push to left edge | `margin-right: auto` (flex) or `justify-content: flex-start` |
| Push to right edge | `margin-left: auto` (flex) or `justify-content: flex-end` |

---

## 5. The "Flex Direction" Trap

### The Problem
`justify-content` controls the **main axis**, which changes based on `flex-direction`.

### Example:
```css
.container {
  display: flex;
  flex-direction: column;  /* Main axis is now VERTICAL */
  justify-content: center; /* Centers VERTICALLY, not horizontally */
}
```

### The Fix
Always check both:
- `flex-direction: row` (default) → `justify-content` = horizontal, `align-items` = vertical
- `flex-direction: column` → `justify-content` = vertical, `align-items` = horizontal

When uncertain, use `margin: auto` which works regardless of flex direction:
```css
.item {
  margin-left: auto;   /* Pushes to right in row, bottom in column */
  margin-right: auto;  /* Pushes to left in row, top in column */
}
```

---

## 6. Confusing Container vs Child Properties

### The Problem
Applying container properties to children or vice versa.

### Wrong:
```css
.container {
  display: flex;
}
.item {
  justify-content: center;  /* WRONG: This goes on the CONTAINER */
}
```

### Right:
```css
.container {
  display: flex;
  justify-content: center;  /* CORRECT: Controls children alignment */
}
.item {
  align-self: center;       /* CORRECT: Controls this specific child */
}
```

### Container Properties (go on parent):
- `justify-content`
- `align-items`
- `gap`
- `flex-direction`
- `flex-wrap`

### Child Properties (go on child):
- `align-self`
- `flex-grow`
- `flex-shrink`
- `flex-basis`
- `order`

---

## 7. The "Position Relative" Oversight

### The Problem
Using `top`, `left`, `right`, `bottom` without `position: relative/absolute/fixed`.

### Wrong:
```css
.element {
  left: 0;  /* WRONG: Does nothing without position property */
}
```

### Right:
```css
.element {
  position: relative;  /* REQUIRED */
  left: 0;
}
```

### Remember
`top`, `left`, `right`, `bottom`, `z-index` only work with non-static positioning.

---

## Quick Reference: Translation Dictionary

| User Intent | If Flex Container | If Grid Container | If Static/Flow |
|-------------|-------------------|-------------------|----------------|
| "Move left" | `margin-right: auto` or `align-self: flex-start` | `justify-self: start` | `margin-right: auto` or `text-align: left` |
| "Move right" | `margin-left: auto` or `align-self: flex-end` | `justify-self: end` | `margin-left: auto` or `text-align: right` |
| "Center horizontally" | `justify-content: center` or `margin: 0 auto` | `justify-items: center` | `margin: 0 auto` or `text-align: center` |
| "Center vertically" | `align-items: center` | `align-items: center` | `padding-top/bottom` or flex/grid wrapper |
| "Space between" | `justify-content: space-between` | `justify-content: space-between` | Harder, probably needs flex/grid |
| "Push to edges" | `justify-content: space-between` | `justify-content: space-between` | `margin-left: auto` / `margin-right: auto` |

---

## When In Doubt

1. **Read the file** — Check existing CSS to understand the layout system
2. **Ask** — "Is this a flex container or using absolute positioning?"
3. **Be specific** — Use exact property names, never directional language
4. **Show the diff** — Let the user verify before applying
