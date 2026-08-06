# React Components

> **Level 1 — Core Concepts & Architecture**
> Reusable, self-contained building blocks of a user interface that accept props and return JSX describing what should appear on screen.

---

## 1. Prerequisites
- [Next.js Overview](nextjs.md) — The framework that uses React components as its primary building block.

---

## 2. Term Category

**Framework Architecture** (React Component Foundations): React Components are modular, reusable UI building blocks composing user interfaces across client and server boundaries.



---

## 3. Explanation

### Environment Context
- **Universal** (Runs on the server during pre-rendering, and in the browser during interactivity).

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Authoring Functional React Components with TypeScript Props

**Scenario:**
Create a reusable, typed Card component accepting `title`, `description`, and `children`.

**Requirements:**
1. Export default React component with typed props.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> interface CardProps {
>   title: string;
>   description?: string;
>   children?: React.ReactNode;
> }
> 
> export default function Card({ title, description, children }: CardProps) {
>   return (
>     <div className="p-6 bg-white border rounded-lg shadow-sm">
>       <h2 className="text-xl font-bold">{title}</h2>
>       {description && <p className="text-gray-600 mt-2">{description}</p>}
>       <div className="mt-4">{children}</div>
>     </div>
>   );
> }
> ```
> 
> #### Technical Explanation
>
> 1. Functional React components accept typed `props` objects to render JSX elements.
> 2. `React.ReactNode` type argument allows passing arbitrary nested JSX elements into `children`.
> 3. Foundation of component-driven React design systems.
> 
---

### Exercise 2: Composing UI Layouts using Nested Components

**Scenario:**
Compose a dashboard layout combining Header, Sidebar, and Content components.

**Requirements:**
1. Render nested sub-components.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> function Header() {
>   return <header className="h-16 bg-blue-600 text-white p-4">App Header</header>;
> }
> 
> function Sidebar() {
>   return <aside className="w-64 bg-gray-800 text-white p-4">Sidebar Navigation</aside>;
> }
> 
> export default function DashboardShell({ children }: { children: React.ReactNode }) {
>   return (
>     <div className="min-h-screen flex flex-col">
>       <Header />
>       <div className="flex flex-1">
>         <Sidebar />
>         <main className="flex-1 p-6">{children}</main>
>       </div>
>     </div>
>   );
> }
> ```
> 
> #### Technical Explanation
>
> 1. Component composition breaks complex user interfaces into small, modular building blocks.
> 2. Encourages reusability and maintainable code architecture.
> 3. Primary React UI design paradigm.
> 
---

### Exercise 3: Conditional Rendering in React Components

**Scenario:**
Render loading state, error alert, or user data conditionally based on props.

**Requirements:**
1. Use ternary operators and logical AND (`&&`) for conditional rendering.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> interface ViewStateProps {
>   isLoading: boolean;
>   error?: string;
>   user?: { name: string };
> }
> 
> export default function UserViewState({ isLoading, error, user }: ViewStateProps) {
>   if (isLoading) return <div>Loading User...</div>;
>   if (error) return <div className="text-red-500">Error: {error}</div>;
> 
>   return (
>     <div>
>       {user ? <h1>Welcome, {user.name}</h1> : <p>Guest User</p>}
>     </div>
>   );
> }
> ```
> 
> #### Technical Explanation
>
> 1. React components evaluate JavaScript expressions directly inside JSX `{}` tags.
> 2. Early return statements (`if (isLoading)`) simplify complex conditional template logic.
> 3. Declarative UI rendering logic.
> 
---


## 6. Related Terms
- [React Server Components (RSC)](rsc.md) — Components executing exclusively on the server.
- [Client Components (`"use client"`)](client_components.md) — Interactive components executed on both server and client.
- [React Hooks](react_hooks.md) — Related concept: React Hooks.
- [React Children Prop](../level_02/children_prop.md) — Related concept: React Children Prop.
- [React Error Boundaries](../level_02/error_boundaries.md) — Related concept: React Error Boundaries.

---

## 7. Key Takeaways
- React Components are independent, reusable building blocks of user interfaces.
- Props allow you to pass configuration data down the component tree.
- Props must be treated as read-only, immutable values.
- In Next.js, components can execute on the server (RSC) or run dynamically on the client.
