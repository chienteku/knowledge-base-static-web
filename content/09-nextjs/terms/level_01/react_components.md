# React Components

> **Level 1 — Core Concepts & Architecture**
> Reusable, self-contained building blocks of a user interface that accept props and return JSX describing what should appear on screen.

---

## 1. Prerequisites
- [Next.js Overview](nextjs.md) — The framework that uses React components as its primary building block.
---

## 2. Term Category
- **React Architecture**

---

## 3. Environment Context
- **Universal** (Runs on the server during pre-rendering, and in the browser during interactivity).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In traditional web development, a page is a single, large HTML document styled with CSS and manipulated using imperative JavaScript (e.g. `document.getElementById('btn').addEventListener(...)`). As applications grow, this makes code maintenance difficult because the layout (HTML), styles (CSS), and logic (JS) are separated across different files, making the UI fragile and hard to update.

React solves this by introducing **Components**. Components combine HTML structure (via JSX), styling, and state logic into a single, cohesive unit. This allows developers to build complex user interfaces by nesting small, isolated, and testable components inside one another.

---

### (2) Core Concept — Component Syntax and Props
In modern React and Next.js, components are written as JavaScript functions that accept a single object argument (called **Props**) and return a tree of JSX elements:

```typescript
// components/UserCard.tsx
import React from 'react';

// Strict TypeScript typing for component parameters (Props)
interface UserCardProps {
  name: string;
  role: string;
  avatarUrl?: string; // Optional prop
}

export default function UserCard({ name, role, avatarUrl }: UserCardProps) {
  return (
    <div className="card">
      <img src={avatarUrl || '/placeholder.png'} alt={`${name}'s avatar`} />
      <h2>{name}</h2>
      <p>{role}</p>
    </div>
  );
}
```

Components are composed to build larger layouts:

```typescript
// app/team/page.tsx (Server Component composing UserCard)
import React from 'react';
import UserCard from '@/components/UserCard';

export default function TeamPage() {
  return (
    <main>
      <h1>Our Team</h1>
      <div className="team-grid">
        <UserCard name="Alice" role="Lead Architect" />
        <UserCard name="Bob" role="Frontend Developer" />
      </div>
    </main>
  );
}
```

---

### (3) How Components Execute in Next.js
In standard React (SPA), components execute *only* inside the user's browser.
In Next.js, components can render in one of two modes:
1.  **Server Components (Default):** Run exclusively on the server. They do not send JavaScript code to the browser and are ideal for static layout and data fetching.
2.  **Client Components:** Render initial HTML on the server and are then "hydrated" with JavaScript in the browser to support dynamic interactions and hooks.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Mutating component props directly

**The mistake:** Modifying a prop argument inside the body of a component function:

```typescript
// BAD: Props are read-only and should never be modified!
export default function ProfileCard({ user }) {
  user.name = user.name.toUpperCase(); // Direct mutation!
  return <div>{user.name}</div>;
}
```

**Why it's wrong:** React relies on immutable data to detect when to update the DOM. If you mutate a prop directly, React will not detect the change, which can lead to layout bugs and unexpected rendering behavior.

**Golden Rule:** Always treat component props as read-only, immutable values. If a value needs to change over time, use state instead.

---

### Mistake 2: Defining Nested Components Inside Parent Component Render Bodies

**The mistake:** Declaring `function ChildComponent() { ... }` inside the body of `ParentComponent()`.

**Why it's wrong:** Declaring components inside another component causes React to re-create the child component definition on every parent re-render, destroying child component state and triggering DOM flickering.

*Incorrect:*
```typescript
export default function Parent() {
  function Child() { return <div>Child</div>; } // ❌ Re-created on every Parent render!
  return <Child />;
}
```

*Fix:*
```typescript
// Move ChildComponent outside ParentComponent scope:
function Child() { return <div>Child</div>; }
export default function Parent() {
  return <Child />;
}
```

---

### Mistake 3: Forgetting the `key` Prop When Mapping Lists of React Components

**The mistake:** Writing `{items.map(item => <Card item={item} />)}` without a `:key` prop.

**Why it's wrong:** React uses `key` props to track component instances across re-renders. Omitting keys degrades Virtual DOM diffing performance and corrupts component input state.

*Incorrect:*
```tsx
{items.map(item => <Card item={item} />)} <!-- ❌ Missing key prop! -->
```

*Fix:*
```tsx
{items.map(item => <Card key={item.id} item={item} />)}
```


---

## 6. Practice Exercises

### Exercise 1: Create a Stateful Button

**Problem:** Complete the component below to accept a `label` prop and type it strictly in TypeScript:

```typescript
// components/Button.tsx
import React from 'react';

// Solution:
interface ButtonProps {
  label: string;
}

export default function Button({ label }: ButtonProps) {
  return (
    <button className="primary-btn">
      {label}
    </button>
  );
}
```

> [!check]- Answer
> - Define a TypeScript interface for the component props containing a required `label` string field.

---

### Exercise 2: Server Component Default Rule

**Problem:** In the Next.js App Router, are components in the `app/` directory React Server Components (RSC) or Client Components by default?

**Expected output:**
> [!check]- Answer
> ```text
> React Server Components (RSC) by default unless marked with 'use client'.
> ```
> - All components in `app/` are Server Components by default.
> 
> ```text
> Default = Server Component; 'use client' = Client Component.
> ```

---

### Exercise 3: Component Props Typing in TSX

**Problem:** Write TypeScript interface and functional component definition for `UserCard` accepting `name: string` and optional `age?: number`.

**Expected output:**
> [!check]- Answer
> ```typescript
> interface UserCardProps { name: string; age?: number; } export function UserCard({ name, age }: UserCardProps) { return <div>{name}</div>; }
> ```
> - Type component props using explicit TypeScript interfaces.
> 
> ```tsx
> interface UserCardProps {
>   name: string;
>   age?: number;
> }
> 
> export function UserCard({ name, age }: UserCardProps) {
>   return <div>{name} ({age ?? 'N/A'})</div>;
> }
> ```


---

## 7. Related Terms
- [React Server Components (RSC)](rsc.md) — Components executing exclusively on the server.
- [Client Components (`"use client"`)](client_components.md) — Interactive components executed on both server and client.
- [React Hooks](react_hooks.md) — Related concept: React Hooks.
- [React Children Prop](../level_02/children_prop.md) — Related concept: React Children Prop.
- [React Error Boundaries](../level_02/error_boundaries.md) — Related concept: React Error Boundaries.
---

## 8. Key Takeaways
- React Components are independent, reusable building blocks of user interfaces.
- Props allow you to pass configuration data down the component tree.
- Props must be treated as read-only, immutable values.
- In Next.js, components can execute on the server (RSC) or run dynamically on the client.
