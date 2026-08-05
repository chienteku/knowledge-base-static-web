# Parallel Routes (`@folder`)

> **Level 4 — Advanced Routing**
> A routing feature that allows you to simultaneously or conditionally render multiple pages within the same layout, highly useful for dashboards or split-screen views.

---

## 1. Prerequisites
- [App Router vs Pages Router](../level_01/app_router_vs_pages.md) — The foundation of Next.js folder routing.
- [`layout.tsx`](../level_02/layout.md) — The file that receives and renders the parallel routes.
---

## 2. Term Category
- **Routing / UI Architecture**

---

## 3. Environment Context
- **Build-Time (Routing)**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Imagine a complex Dashboard. You want an Analytics chart on the left, and a Team Activity feed on the right. Both sections need their own loading states (`loading.tsx`), their own error boundaries (`error.tsx`), and they should fetch their data independently.
If you just put two React components inside `dashboard/page.tsx`, you have to manage all that state manually.
**Parallel Routes** allow you to define multiple distinct `page.tsx` files for the exact same URL, and Next.js will inject *all* of them into the Layout simultaneously as props.

### (2) The `@folder` Syntax
You define a parallel route by naming a folder starting with an `@` symbol (called a "slot"). These slots do not affect the URL.

```text
app/
  dashboard/
    layout.tsx
    @analytics/
      page.tsx     -> The analytics UI
      loading.tsx  -> Independent loading state!
    @team/
      page.tsx     -> The team UI
      error.tsx    -> Independent error state!
```

### (3) Receiving Slots in Layout
The slots are automatically passed as props to the `layout.tsx` in the same folder. (Remember how `children` is a prop? `children` is actually just an implicit `@children` slot!).

```tsx
// app/dashboard/layout.tsx
export default function DashboardLayout({
  children,   // This is the implicit app/dashboard/page.tsx (if it exists)
  analytics,  // The `@analytics` slot
  team        // The `@team` slot
}: {
  children: React.ReactNode;
  analytics: React.ReactNode;
  team: React.ReactNode;
}) {
  return (
    <div>
      <header>My Dashboard</header>
      <div className="flex">
        <aside>{analytics}</aside>
        <main>{team}</main>
      </div>
      {children}
    </div>
  );
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Forgetting `default.tsx` during hard navigation

**The mistake:** A developer sets up Parallel Routes, navigates directly to `/dashboard` via the browser URL bar, and gets a 404 error for one of their slots.

**Why it's wrong:** When Next.js does a hard reload (not client-side navigation), it needs to know what to render for *every single slot* at that specific URL. If a slot doesn't have a UI defined for that exact path, Next.js panics.
**Golden Rule:** Always provide a `default.tsx` file inside your `@slot` folders. It acts as a fallback UI when Next.js cannot find an exact match for the slot during a hard reload.

---

### Mistake 2: Omitting `default.tsx` Files for Parallel Route Slots (404 on Soft Reload)

**The mistake:** Creating parallel slot `app/@team/page.tsx` without creating a `default.tsx` file.

**Why it's wrong:** When navigating or refreshing pages, if Next.js cannot recover the active slot state for a parallel route, it renders `default.tsx`. Omitting `default.tsx` causes 404 errors.

*Incorrect:*
```tsx
// app/@team/page.tsx exists, but app/@team/default.tsx is missing ❌ 404 on page refresh!
```

*Fix:*
```typescript
// Create app/@team/default.tsx returning fallback slot UI or null
```

---

### Mistake 3: Expecting Parallel Route Slots to Receive Shared Layout State Automatically

**The mistake:** Attempting to pass state between `@analytics` and `@team` parallel slots via props.

**Why it's wrong:** Parallel route slots render independently as sibling props inside the parent layout (`layout.tsx`). Share state between slots using URL parameters, cookies, or global stores.

*Incorrect:*
```tsx
/* Attempting direct prop passing between parallel slot sibling components */
```

*Fix:*
```tsx
/* Share state between parallel slots using URL searchParams or global state stores */
```


---

## 6. Practice Exercises

### Exercise 1: Conditional Rendering

**Problem:** You have a layout receiving an `@adminDashboard` slot. How can you easily hide it from standard users?

**Expected output:**
> [!check]- Answer
> ```tsx
> export default function Layout({ children, adminDashboard }) {
>   const isAdmin = checkUserRole();
>   return (
>     <>
>       {children}
>       {/* Just use standard React conditional logic! */}
>       {isAdmin ? adminDashboard : null} 
>     </>
>   );
> }
> ```
> - Slots are just React nodes passed as props.

---

### Exercise 2: Parallel Route Layout Slot Pattern

**Problem:** Write `app/layout.tsx` accepting `children`, `@team`, and `@analytics` parallel slot props.

**Expected output:**
> [!check]- Answer
> ```tsx
> export default function Layout({ children, team, analytics }: { children: React.ReactNode; team: React.ReactNode; analytics: React.ReactNode }) { return ( <div> {children} <div className="flex">{team}{analytics}</div> </div> ); }
> ```
> - Named slot folders `@slot` pass matching props to parent layout.
> 
> ```tsx
> export default function Layout({
>   children,
>   team,
>   analytics
> }: {
>   children: React.ReactNode;
>   team: React.ReactNode;
>   analytics: React.ReactNode;
> }) {
>   return (
>     <div>
>       {children}
>       <div className="grid grid-cols-2 gap-4">
>         {team}
>         {analytics}
>       </div>
>     </div>
>   );
> }
> ```

---

### Exercise 3: Parallel Route Folder Naming Convention

**Problem:** Which symbol prefix defines a Parallel Route slot folder in Next.js App Router?

**Expected output:**
> [!check]- Answer
> ```text
> @ (e.g. app/@slotName)
> ```
> - `@` prefix defines named parallel route slots.
> 
> ```text
> app/@modal/page.tsx -> Passes 'modal' prop to app/layout.tsx
> ```


---

## 7. Related Terms
- [`layout.tsx`](../level_02/layout.md) — The file that orchestrates the slots.
- [Intercepting Routes (`(..)folder`)](intercepting_routes.md) — Often combined with Parallel Routes to build modal windows.
- [Route Groups (`(group)`)](../level_03/route_groups.md) — Related concept: Route Groups (`(group)`).
---

## 8. Key Takeaways
- **Parallel Routes** use the `@folderName` convention.
- They allow you to render multiple pages simultaneously within the same layout.
- Each slot acts as an independent Next.js route, meaning they get their own `loading.tsx` and `error.tsx`.
- The slots are passed as named props to the `layout.tsx`.
- They do not affect the public URL structure.
