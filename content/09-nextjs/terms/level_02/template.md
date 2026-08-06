# `template.tsx`

> **Level 2 — App Router UI Elements**
> A special file that acts almost exactly like `layout.tsx`, wrapping child pages. However, unlike layouts, Templates **destroy and recreate their state** on every single navigation.

---

## 1. Prerequisites
- [`layout.tsx`](layout.md) — The standard wrapper file that Templates emulate.
- [React `useEffect` Hook](use_effect.md) — Often used inside Templates to trigger animations on navigation.

---

## 2. Term Category

**Routing & Layouts** (Re-Mounting Subtree Shell Component): `template.tsx` is a layout-like wrapper that creates a new component instance and re-mounts state on every route navigation.



---

## 3. Explanation

### Environment Context
- **Server Component (Default) or Client Component**

### (1) Design Motivation — "Why did we design this?"
We just learned that `layout.tsx` is amazing because it *does not remount* on navigation, preserving state.
But what if you *want* the component to remount? 
Imagine a "Page Transition Animation" component. It needs to trigger a fade-in CSS animation every time the user clicks a link. If you put it in `layout.tsx`, it only runs once (on the initial load) and then never runs again.
**`template.tsx`** was designed for these specific edge cases. It is a layout that intentionally forces a re-render/remount on navigation.

### (2) The Syntax
It looks identical to a layout. It must accept a `children` prop.

```tsx
// app/template.tsx
"use client"; // Often client components because they deal with animations/state
import { useEffect } from 'react';

export default function Template({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // This will log on EVERY route change, because the component is destroyed and remounted!
    console.log("Page transition animation triggered!");
  }, []);

  return <div className="animate-fade-in">{children}</div>;
}
```

### (3) How it nests with Layouts
If a folder has both a `layout.tsx` and a `template.tsx`, the layout wraps the template.
```text
<Layout>
  {/* Template is destroyed and rebuilt on navigation */}
  <Template>
    <Page />
  </Template>
</Layout>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using Template when Layout is needed

**The mistake:** A developer wants to share a Header across multiple pages, so they put it in `template.tsx` instead of `layout.tsx`.

**Why it's wrong:** While it will visually work, you are forcing the Header to completely destroy itself, wipe its state, and rebuild its DOM nodes every single time the user clicks a link. This causes unnecessary browser rendering overhead and destroys any state (like an open mobile menu).
**Golden Rule:** Always use `layout.tsx` by default. Only reach for `template.tsx` if you specifically need `useEffect` to re-fire or state (`useState`) to reset on navigation.

---

### Mistake 2: Using `template.tsx` When Shared Persistent Layout State Is Intended

**The mistake:** Building a global navigation sidebar inside `template.tsx` expecting state to persist across route changes.

**Why it's wrong:** `template.tsx` creates a NEW component instance on every route transition, destroying and re-mounting all state, DOM nodes, and effects. Use `layout.tsx` for persistent UI.

*Incorrect:*
```typescript
// app/template.tsx
export default function Template({ children }) {
  const [search, setSearch] = useState(''); // ❌ State wiped on every page navigation!
  return <div><Sidebar />{children}</div>;
}
```

*Fix:*
```typescript
// Use layout.tsx for persistent UI like Sidebars and Headers:
// app/layout.tsx
export default function Layout({ children }) { ... }
```

---

### Mistake 3: Forgetting `{ children }` Destructuring in Template Components

**The mistake:** Writing `export default function Template() { return <div>Content</div>; }` without `{ children }`.

**Why it's wrong:** Like layouts, templates wrap sub-route pages via `{ children }`. Omitting `{ children }` drops nested page content.

*Incorrect:*
```typescript
export default function Template() { return <div>Template</div>; } // ❌ Pages fail to render!
```

*Fix:*
```typescript
export default function Template({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}
```


---

## 5. Practice Exercises

### Exercise 1: Resetting State on Route Transitions with `template.tsx`

**Scenario:**
Create `app/dashboard/template.tsx` to force component re-instantiation and state reset on sub-route changes.

**Requirements:**
1. Export default component in `template.tsx`.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> // app/dashboard/template.tsx
> export default function DashboardTemplate({
>   children
> }: {
>   children: React.ReactNode;
> }) {
>   return (
>     <div className="animate-fade-in">
>       {children}
>     </div>
>   );
> }
> ```

> #### Technical Explanation
>
> 1. Unlike `layout.tsx`, `template.tsx` creates a NEW component instance on every route transition.
> 2. Resets local component state and triggers enter/exit CSS animations on navigation.
> 3. Useful when route changes require clean state resets or analytics page view tracking.

---

### Exercise 2: Triggering Route Transition Animations in Templates

**Scenario:**
Use Framer Motion or CSS animation libraries inside `template.tsx` to animate page entrance effects.

**Requirements:**
1. Add animation wrappers in `template.tsx`.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> "use client";

import { motion } from "framer-motion";

export default function AnimatedTemplate({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}
```

> #### Technical Explanation
>
> 1. Because `layout.tsx` stays mounted, Framer Motion exit/enter animations will NOT fire on sub-route changes inside layouts.
> 2. `template.tsx` re-mounts on every navigation, allowing page transition animations to execute reliably.
> 3. Idiomatic pattern for route transition animations in App Router.

---

### Exercise 3: Choosing Between `layout.tsx` vs `template.tsx`

**Scenario:**
Formulate an architectural selection decision matrix explaining when to use `layout.tsx` vs `template.tsx`.

**Requirements:**
1. Contrast state persistence, re-rendering, and animation behavior.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Layout vs Template Selection Matrix:
> - layout.tsx: Persistent shell. Preserves state, skips re-rendering common UI, does NOT re-trigger useEffect on sub-navigation. Use for sidebars, navbars, persistent forms.
> - template.tsx: Re-mounting shell. Resets state, re-executes useEffect hooks, re-triggers CSS/Framer animations. Use for page view analytics, enter animations, modal resets.
> ```

> #### Technical Explanation
>
> 1. `layout.tsx` is the default choice for performance and state persistence.
> 2. `template.tsx` is explicitly chosen when state reset or re-animation is required.
> 3. Core App Router layout architecture choice.

---




---

## 6. Related Terms
- [`layout.tsx`](layout.md) — The state-preserving default wrapper.
- [`page.tsx`](page.md) — The child UI being wrapped.
- [React `useEffect` Hook](use_effect.md) — Related concept: React `useEffect` Hook.

---

## 7. Key Takeaways
- **`template.tsx`** is a shared UI wrapper, just like a Layout.
- Unlike Layouts, **Templates remount on every navigation**, destroying their state and re-running their effects.
- They are primarily used for enter/exit animations, resetting state on navigation, or logging page views via `useEffect`.
- You should use `layout.tsx` 99% of the time, and only use `template.tsx` when you specifically require remounting.
