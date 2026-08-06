# Parallel Routes (`@folder`)

> **Level 4 — Advanced Routing**
> A routing feature that allows you to simultaneously or conditionally render multiple pages within the same layout, highly useful for dashboards or split-screen views.

---

## 1. Prerequisites
- [App Router vs Pages Router](../level_01/app_router_vs_pages.md) — The foundation of Next.js folder routing.
- [`layout.tsx`](../level_02/layout.md) — The file that receives and renders the parallel routes.

---

## 2. Term Category

**Routing & Layouts** (Parallel Route Slot Composition): Parallel Routes (`@slot`) allow rendering multiple independent pages side-by-side inside a single shared layout.



---

## 3. Explanation

### Environment Context
- **Build-Time (Routing)**

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Creating Parallel Route Slots `@slot`

**Scenario:**
Create parallel slots `@team` and `@analytics` inside `app/dashboard/` and render them in `app/dashboard/layout.tsx`.

**Requirements:**
1. Use `@folder` slot directory naming.
2. Accept slots as props in layout.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> // app/dashboard/layout.tsx
> export default function ParallelDashboardLayout({
>   children,
>   analytics,
>   team
> }: {
>   children: React.ReactNode;
>   analytics: React.ReactNode;
>   team: React.ReactNode;
> }) {
>   return (
>     <div className="space-y-6 p-6">
>       <div>{children}</div>
>       <div className="grid grid-cols-2 gap-4">
>         <div>{analytics}</div>
>         <div>{team}</div>
>       </div>
>     </div>
>   );
> }
> ```

> #### Technical Explanation
>
> 1. Folders named `@slotName` define parallel route slots that do NOT affect URL paths.
> 2. Next.js passes slots directly as props to the parent `layout.tsx`.
> 3. Renders independent page components side-by-side in a unified view.

---

### Exercise 2: Conditional Slot Rendering Based on User Role

**Scenario:**
Render `@admin` slot conditionally inside layout based on active user authentication role.

**Requirements:**
1. Check user role in Server Layout and render slot or `null`.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> import { getUser } from "@/lib/auth";

export default async function ConditionalDashboardLayout({
  children,
  admin
}: {
  children: React.ReactNode;
  admin: React.ReactNode;
}) {
  const user = await getUser();

  return (
    <div>
      {children}
      {user.role === "ADMIN" ? admin : null}
    </div>
  );
}
```

> #### Technical Explanation
>
> 1. Parallel slots are standard React Node props, allowing conditional rendering based on server state.
> 2. Admin analytics pages are fetched and rendered ONLY when authorized.
> 3. Secure dashboard composition pattern.

---

### Exercise 3: Handling Fallback Un-Matched Routes with `default.tsx`

**Scenario:**
Create `app/dashboard/@analytics/default.tsx` to handle slot rendering when sub-routes update.

**Requirements:**
1. Export default fallback component in `default.tsx`.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> // app/dashboard/@analytics/default.tsx
> export default function DefaultAnalytics() {
>   return <div>Analytics Overview (Default Fallback)</div>;
> }
> ```

> #### Technical Explanation
>
> 1. When navigating between sub-routes, Next.js renders `default.tsx` for parallel slots if their active state cannot be determined.
> 2. Prevents empty or blank slot panels during client transitions or page refreshes.
> 3. Essential component for parallel routing systems.

---




---

## 6. Related Terms
- [`layout.tsx`](../level_02/layout.md) — The file that orchestrates the slots.
- [Intercepting Routes (`(..)folder`)](intercepting_routes.md) — Often combined with Parallel Routes to build modal windows.
- [Route Groups (`(group)`)](../level_03/route_groups.md) — Related concept: Route Groups (`(group)`).

---

## 7. Key Takeaways
- **Parallel Routes** use the `@folderName` convention.
- They allow you to render multiple pages simultaneously within the same layout.
- Each slot acts as an independent Next.js route, meaning they get their own `loading.tsx` and `error.tsx`.
- The slots are passed as named props to the `layout.tsx`.
- They do not affect the public URL structure.
