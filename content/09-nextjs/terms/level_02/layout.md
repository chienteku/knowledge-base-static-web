# `layout.tsx`

> **Level 2 — App Router UI Elements**
> A special file that defines UI that is shared across multiple pages. Unlike standard React components, layouts preserve state, remain interactive, and do not re-render when the user navigates between pages inside them.

---

## 1. Prerequisites
- [`page.tsx`](page.md) — The content that gets wrapped *inside* the layout.
- [React Children Prop](children_prop.md) — How the nested segments are passed into the layout.
---

## 2. Term Category
- **Routing / UI Architecture**

---

## 3. Environment Context
- **Server Component (Default) or Client Component**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Nested Layouts

**Problem:** You have `app/layout.tsx` and `app/dashboard/layout.tsx`. If the user navigates to `/dashboard`, how does the UI assemble itself?

**Expected output:**
> [!check]- Answer
> ```text
> Layouts nest perfectly!
> Next.js takes the Root Layout, injects the Dashboard Layout into the Root's `children`, and then injects the Dashboard Page into the Dashboard Layout's `children`.
> Result: <RootLayout> <DashboardLayout> <DashboardPage /> </DashboardLayout> </RootLayout>
> ```
> - Think of Russian nesting dolls.

---

### Exercise 2: Root Layout Mandatory Elements

**Problem:** Which 2 HTML tags MUST be present in the top-most `app/layout.tsx` file?

**Expected output:**
> [!check]- Answer
> ```text
> <html> and <body>
> ```
> - Root layout MUST render top-level `<html>` and `<body>` elements.
> 
> ```tsx
> export default function RootLayout({ children }) {
>   return (
>     <html lang="en">
>       <body>{children}</body>
>     </html>
>   );
> }
> ```

---

### Exercise 3: Nested Layout Composition

**Problem:** Trace how Next.js composes `app/layout.tsx`, `app/dashboard/layout.tsx`, and `app/dashboard/page.tsx`.

**Expected output:**
> [!check]- Answer
> ```text
> app/layout.tsx wraps app/dashboard/layout.tsx, which wraps app/dashboard/page.tsx.
> ```
> - Layouts nest recursively down the folder hierarchy.
> 
> ```text
> <RootLayout>
>   <DashboardLayout>
>     <DashboardPage />
>   </DashboardLayout>
> </RootLayout>
> ```


---

## 7. Related Terms
- [`page.tsx`](page.md) — The file injected into the layout's `children`.
- [`template.tsx`](template.md) — A layout that *does* remount on navigation.
- [React Children Prop](children_prop.md) — Related concept: React Children Prop.
- [Route Groups (`(group)`)](../level_03/route_groups.md) — Related concept: Route Groups (`(group)`).
- [Parallel Routes (`@folder`)](../level_04/parallel_routes.md) — Related concept: Parallel Routes (`@folder`).
- [Metadata API (`metadata`)](../level_09/metadata_api.md) — Related concept: Metadata API (`metadata`).
- [`next/font` Optimization](../level_09/next_font.md) — Related concept: `next/font` Optimization.
---

## 8. Key Takeaways
- **`layout.tsx`** defines shared UI that wraps around pages or nested layouts.
- It MUST accept and render a `children` prop.
- Layouts **do not re-render** during navigation. They preserve their state perfectly.
- You must have exactly one Root Layout (`app/layout.tsx`) that contains the `<html>` and `<body>` tags.
- Layouts do not have access to `searchParams`.
