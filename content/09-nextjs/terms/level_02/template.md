# `template.tsx`

> **Level 2 — App Router UI Elements**
> A special file that acts almost exactly like `layout.tsx`, wrapping child pages. However, unlike layouts, Templates **destroy and recreate their state** on every single navigation.

---

## 1. Prerequisites
- [`layout.tsx`](layout.md) — The standard wrapper file that Templates emulate.
- [React `useEffect` Hook](use_effect.md) — Often used inside Templates to trigger animations on navigation.
---

## 2. Term Category
- **Routing / UI Architecture**

---

## 3. Environment Context
- **Server Component (Default) or Client Component**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Form State Reset

**Problem:** You have a multi-step checkout process (`/checkout/step1`, `/checkout/step2`). You want to ensure a specific feedback form resets its text input every time the user moves to a new step. Should the feedback form live in `layout.tsx` or `template.tsx`?

**Expected output:**
> [!check]- Answer
> ```text
> It should live in `template.tsx`.
> If it lived in `layout.tsx`, the text the user typed into the feedback form on Step 1 would still be sitting there on Step 2. By using a Template, the component is remounted, wiping the `useState` back to its initial empty string.
> ```
> - Do you want the state preserved or destroyed?

---

### Exercise 2: Template Enter Animation Pattern

**Problem:** Write App Router `template.tsx` triggering page entrance animations using `useEffect` on every route navigation.

**Expected output:**
> [!check]- Answer
> ```tsx
> 'use client'; import { useEffect } from 'react'; export default function Template({ children }: { children: React.ReactNode }) { useEffect(() => { logPageView(); }, []); return <div className="animate-fade-in">{children}</div>; }
> ```
> - `template.tsx` re-mounts on every route transition, re-firing `useEffect`.
> 
> ```tsx
> 'use client';
> import { useEffect } from 'react';
> 
> export default function Template({ children }: { children: React.ReactNode }) {
>   useEffect(() => {
>     console.log('Route navigated, template re-mounted');
>   }, []);
>   
>   return <div className="animate-fade-in">{children}</div>;
> }
> ```

---

### Exercise 3: Layout vs Template Matrix

**Problem:** Compare `layout.tsx` vs `template.tsx` across:
1. Component instance re-creation on navigation
2. DOM state preservation
3. useEffect re-triggering

**Expected output:**
> [!check]- Answer
> ```text
> 1. layout.tsx: Persists instance; template.tsx: Re-creates instance
> 2. layout.tsx: Preserves DOM state; template.tsx: Wipes DOM state
> 3. layout.tsx: useEffect runs once; template.tsx: useEffect runs on every navigation
> ```
> - `layout.tsx` -> Persistent, state-preserving, runs effect once.
> - `template.tsx` -> Instantiates fresh component on every navigation.
> 
> ```text
> Use layout for persistent wrappers; Use template for navigation-triggered animations.
> ```


---

## 7. Related Terms
- [`layout.tsx`](layout.md) — The state-preserving default wrapper.
- [`page.tsx`](page.md) — The child UI being wrapped.
- [React `useEffect` Hook](use_effect.md) — Related concept: React `useEffect` Hook.
---

## 8. Key Takeaways
- **`template.tsx`** is a shared UI wrapper, just like a Layout.
- Unlike Layouts, **Templates remount on every navigation**, destroying their state and re-running their effects.
- They are primarily used for enter/exit animations, resetting state on navigation, or logging page views via `useEffect`.
- You should use `layout.tsx` 99% of the time, and only use `template.tsx` when you specifically require remounting.
