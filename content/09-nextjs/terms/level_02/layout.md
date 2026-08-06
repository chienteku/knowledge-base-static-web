# `layout.tsx`

> **Level 2 — App Router UI Elements**
> A special file that defines UI that is shared across multiple pages. Unlike standard React components, layouts preserve state, remain interactive, and do not re-render when the user navigates between pages inside them.

---

## 1. Prerequisites
- [`page.tsx`](page.md) — The content that gets wrapped *inside* the layout.
- [React Children Prop](children_prop.md) — How the nested segments are passed into the layout.

---

## 2. Term Category

**Routing & Layouts** (Persistent Subtree Shell Component): `layout.tsx` creates shared persistent UI shells (headers, sidebars) across nested routes without losing state or re-rendering on navigation.



---

## 3. Explanation

### Environment Context
- **Server Component (Default) or Client Component**

### (1) Design Motivation — "Why did we design this?"
Almost every web app has shared UI. You have a Top Navbar and a Footer that appear on every page.
If you just manually import `<Navbar />` into `about/page.tsx` and `contact/page.tsx`, what happens when the user clicks a link to go from About to Contact? The entire page unmounts, the Navbar unmounts, and the new Navbar remounts. Any state inside the Navbar (like an open dropdown menu) is instantly destroyed.
**`layout.tsx`** solves this. It wraps the pages. When the user navigates between pages sharing the same layout, the layout *does not unmount*. It stays completely static, preserving state and preventing unnecessary re-renders.

### (2) The Syntax
A layout is a standard React component that **must** accept a `children` prop. Next.js will automatically take whatever `page.tsx` is currently active and inject it into the `children` prop.

```tsx
// app/dashboard/layout.tsx
import Sidebar from './Sidebar';

export default function DashboardLayout({
  children, // This will be populated by the active `page.tsx`
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      <Sidebar /> {/* This never unmounts during navigation! */}
      <main className="flex-grow">
        {children} 
      </main>
    </div>
  );
}
```

### (3) The Root Layout
Every Next.js App Router project MUST have a single **Root Layout** at `app/layout.tsx`. This file is responsible for rendering the `<html>` and `<body>` tags for the entire application.

```tsx
// app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <TopNav />
        {children}
      </body>
    </html>
  );
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Trying to access URL Search Params in a Layout

**The mistake:** A developer tries to read `searchParams` in `layout.tsx`.
```tsx
export default function Layout({ children, searchParams }) { // ❌ searchParams does not exist here!
```

**Why it's wrong:** Layouts do not re-render when the user navigates between pages. Because `searchParams` (like `?sort=asc`) change frequently during navigation, passing them to a component that refuses to re-render would cause massive stale data bugs. Therefore, Next.js simply does not pass `searchParams` to Layouts.
**Golden Rule:** If you need to read the URL or query parameters, do it in the `page.tsx` (which does re-render) or use a Client Component with the `useSearchParams` hook inside the layout.

---

### Mistake 2: Expecting State to Reset in `layout.tsx` When Navigating Between Sub-Routes

**The mistake:** Placing active search input `useState` inside a shared `layout.tsx` expecting it to clear on route changes.

**Why it's wrong:** Layouts **preserve state** and do NOT re-render or reset state when navigating between sibling child sub-routes. Use `template.tsx` if you need state to reset on navigation.

*Incorrect:*
```typescript
// app/dashboard/layout.tsx
const [search, setSearch] = useState(''); // ❌ State persists across all sub-route navigations!
```

*Fix:*
```typescript
// Move state into template.tsx if re-initialization on navigation is required
```

---

### Mistake 3: Passing Data Fetching Results from Layout to Page Components via Props

**The mistake:** Attempting to pass fetched data from `layout.tsx` to `page.tsx` as props.

**Why it's wrong:** Layouts CANNOT pass props to child `page.tsx` components in Next.js. Page components should fetch their own data directly (Next.js automatically deduplicates `fetch()` requests).

*Incorrect:*
```typescript
// app/layout.tsx
<Page userData={fetchedData} /> // ❌ Next.js layouts cannot pass props to page components!
```

*Fix:*
```typescript
// Fetch data directly in Page.tsx; Next.js fetch caching deduplicates identical requests automatically
```


---

## 5. Practice Exercises

### Exercise 1: Defining Root App Layouts (`app/layout.tsx`)

**Scenario:**
Define `app/layout.tsx` with global metadata, fonts, and HTML document tags.

**Requirements:**
1. Include `<html>` and `<body>` tags.
2. Export `metadata` object.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> // app/layout.tsx
> import "@/app/globals.css";
> import type { Metadata } from "next";
> 
> export const metadata: Metadata = {
>   title: "My Next.js Application",
>   description: "Built with Next.js App Router"
> };
> 
> export default function RootLayout({
>   children
> }: {
>   children: React.ReactNode;
> }) {
>   return (
>     <html lang="en">
>       <body className="antialiased bg-gray-50 text-gray-900">
>         {children}
>       </body>
>     </html>
>   );
> }
> ```
> 
> #### Technical Explanation
>
> 1. `app/layout.tsx` is required at the root of `app/` and wraps all application routes.
> 2. Must render `<html>` and `<body>` tags.
> 3. Preserves global CSS imports and document metadata.
> 
---

### Exercise 2: Implementing Nested Segment Layouts

**Scenario:**
Create a nested layout `app/settings/layout.tsx` providing a tabbed navigation header for settings sub-pages.

**Requirements:**
1. Create persistent navigation header in `app/settings/layout.tsx`.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> // app/settings/layout.tsx
> import Link from "next/link";
> 
> export default function SettingsLayout({
>   children
> }: {
>   children: React.ReactNode;
> }) {
>   return (
>     <div className="p-6">
>       <h1 className="text-2xl font-bold mb-4">Account Settings</h1>
>       <nav className="flex gap-4 border-b pb-2 mb-6">
>         <Link href="/settings/profile">Profile</Link>
>         <Link href="/settings/billing">Billing</Link>
>         <Link href="/settings/security">Security</Link>
>       </nav>
>       <div>{children}</div>
>     </div>
>   );
> }
> ```
> 
> #### Technical Explanation
>
> 1. Nested layouts wrap sub-routes (`/settings/profile`, `/settings/billing`) automatically.
> 2. Tab navigation header remains mounted while user switches between settings tabs.
> 3. Avoids re-fetching or re-rendering common header components.
> 
---

### Exercise 3: Fetching Data inside Async Server Layouts

**Scenario:**
Fetch user profile data directly inside an async `layout.tsx` Server Component.

**Requirements:**
1. Declare `export default async function Layout()`.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> // app/dashboard/layout.tsx
> import { getUser } from "@/lib/auth";
> 
> export default async function AsyncDashboardLayout({
>   children
> }: {
>   children: React.ReactNode;
> }) {
>   const user = await getUser();
> 
>   return (
>     <div>
>       <header className="p-4 bg-slate-800 text-white">
>         Logged in as: {user.email}
>       </header>
>       <main>{children}</main>
>     </div>
>   );
> }
> ```
> 
> #### Technical Explanation
>
> 1. Layouts can be declared as `async` React Server Components.
> 2. Fetches user auth data once when entering the dashboard route segment.
> 3. Data fetched in layouts is shared across sub-routes without duplicate API calls.
> 
---


## 6. Related Terms
- [`page.tsx`](page.md) — The file injected into the layout's `children`.
- [`template.tsx`](template.md) — A layout that *does* remount on navigation.
- [React Children Prop](children_prop.md) — Related concept: React Children Prop.
- [Route Groups (`(group)`)](../level_03/route_groups.md) — Related concept: Route Groups (`(group)`).
- [Parallel Routes (`@folder`)](../level_04/parallel_routes.md) — Related concept: Parallel Routes (`@folder`).
- [Metadata API (`metadata`)](../level_09/metadata_api.md) — Related concept: Metadata API (`metadata`).
- [`next/font` Optimization](../level_09/next_font.md) — Related concept: `next/font` Optimization.

---

## 7. Key Takeaways
- **`layout.tsx`** defines shared UI that wraps around pages or nested layouts.
- It MUST accept and render a `children` prop.
- Layouts **do not re-render** during navigation. They preserve their state perfectly.
- You must have exactly one Root Layout (`app/layout.tsx`) that contains the `<html>` and `<body>` tags.
- Layouts do not have access to `searchParams`.
