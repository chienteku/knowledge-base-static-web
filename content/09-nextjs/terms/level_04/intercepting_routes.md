# Intercepting Routes (`(..)folder`)

> **Level 4 — Advanced Routing**
> A routing technique that allows you to load a route from another part of your application within the current layout, usually to create dynamic Modals (like Instagram's photo viewer).

---

## 1. Prerequisites
- [Parallel Routes (`@folder`)](parallel_routes.md) — Intercepting Routes are almost always rendered inside a Parallel Route slot.
- [Node.js `path` Module](path_module.md) — Understanding relative navigation patterns.

---

## 2. Term Category

**Routing & Layouts** (Intercepting Route Overlays): Intercepting Routes (`(..)photo`) intercept route transitions to render modal overlays while preserving shareable deep URLs.



---

## 3. Explanation

### Environment Context
- **Build-Time (Routing)**

### (1) Design Motivation — "Why did we design this?"
Think about a Reddit or Instagram feed. You scroll down and click a photo. 
1. The URL changes to `/photo/123`.
2. A Modal pops up *over* the feed showing the photo.
3. If you refresh the page, or share the link with a friend, they see the full `/photo/123` page, not a modal over your feed.
Historically, this was a nightmare to build in React. You had to manage complex state, sync it with the URL, and handle server-side rendering differently than client-side rendering.
**Intercepting Routes** fix this. They allow you to "intercept" a navigation attempt to a different route, and instead render that route's content as a modal within your current layout.

### (2) The `(..)` Syntax
The syntax mimics terminal directory navigation.
- `(.)folder` matches segments on the same level
- `(..)folder` matches segments one level above
- `(...)folder` matches segments from the root `app` directory

### (3) How it works (The Modal Example)
Let's build the Instagram feed.

```text
app/
  feed/
    layout.tsx
    page.tsx            -> The feed of photos
    @modal/             -> A Parallel Route to hold the modal
      (..)photo/        -> THIS intercepts the /photo route!
        [id]/page.tsx   -> Renders the Modal UI
  photo/
    [id]/page.tsx       -> Renders the Full Page UI (for hard refreshes)
```

**The Flow:**
1. User is on `/feed`. They click a `<Link href="/photo/123">`.
2. Next.js sees the `(..)photo` folder. It **intercepts** the navigation!
3. Instead of wiping the screen, Next.js keeps the `/feed` on screen, updates the URL to `/photo/123`, and injects the intercepted `page.tsx` into the `@modal` slot. The user sees a modal!
4. The user copies the URL `/photo/123` and sends it to a friend.
5. The friend opens it. Because this is a hard browser request (not client-side navigation), Next.js **bypasses the interception** and serves the standard `app/photo/[id]/page.tsx` full-page file.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding the folder levels

**The mistake:** A developer tries to use `(..)photo` but the `photo` folder is actually 2 levels up, not 1 level up.

**Why it's wrong:** The `(..)` syntax is strictly based on the route segments. If you get the levels wrong, Next.js will simply ignore the interceptor and do a standard page navigation.
**Golden Rule:** If your folder structure gets too complex, use `(...)folderName` to intercept from the absolute root `app` directory, guaranteeing you target the right route.

---

### Mistake 2: Confusing Intercepting Route Convention Syntax (`(.)`, `(..)`, `(...)`)

**The mistake:** Using `(..)` to intercept a route segment at the SAME directory level.

**Why it's wrong:** `(.)` matches segments at the SAME level; `(..)` matches segments 1 level ABOVE; `(..)(..)` matches 2 levels above; `(...)` matches segments from root `app/`.

*Incorrect:*
```tsx
// app/feed/(..)photo/[id]/page.tsx ❌ Incorrect folder level matching!
```

*Fix:*
```typescript
// app/feed/(.)photo/[id]/page.tsx Correct (.) same-level interception syntax
```

---

### Mistake 3: Expecting Intercepted Routes to Render on Direct Hard Browser Refreshes

**The mistake:** Testing modal interception by refreshing the browser URL `https://site.com/photo/5` directly.

**Why it's wrong:** Intercepting routes intercept ONLY client-side soft navigations (`<Link>`). Hard browser reloads bypass interception and render the actual target page directly.

*Incorrect:*
```tsx
/* Expecting modal interceptor on direct URL page refresh */
```

*Fix:*
```tsx
/* Client navigation renders interceptor modal; Hard refresh renders full page */
```


---

## 5. Practice Exercises

### Exercise 1: Implementing Modal Intercepting Routes

**Scenario:**
Create an intercepting modal route `app/feed/(..)photo/[id]/page.tsx` displaying a photo modal over the main feed.

**Requirements:**
1. Use `(..)` folder syntax for relative path interception.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> // app/feed/(..)photo/[id]/page.tsx
> export default async function PhotoModal({
>   params
> }: {
>   params: Promise<{ id: string }>;
> }) {
>   const { id } = await params;
> 
>   return (
>     <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
>       <div className="bg-white p-6 rounded-lg max-w-lg">
>         <h2>Photo Modal #{id}</h2>
>       </div>
>     </div>
>   );
> }
> ```
> 
> #### Technical Explanation
>
> 1. `(..)` matches 1 level up in the segment hierarchy, intercepting `/photo/[id]` when navigated to from `/feed`.
> 2. Renders photo content as a modal overlay on top of the active feed layout.
> 3. Reloading or deep linking directly to `/photo/123` bypasses the modal and loads full page view.
> 
---

### Exercise 2: Combining Intercepting Routes with Parallel Routes

**Scenario:**
Combine parallel slot `@modal` with intercepting route `(..)photo/[id]` to render modal slots cleanly inside layout.

**Requirements:**
1. Pass `@modal` slot into layout `children`.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> // app/feed/layout.tsx
> export default function FeedLayout({
>   children,
>   modal
> }: {
>   children: React.ReactNode;
>   modal: React.ReactNode;
> }) {
>   return (
>     <div>
>       {children}
>       {modal}
>     </div>
>   );
> }
> ```
> 
> #### Technical Explanation
>
> 1. Parallel route slot `@modal` acts as a target container for intercepted routes.
> 2. Allows opening modal overlays without breaking layout components.
> 3. Standard pattern for Instagram-style or Pinterest-style modal feeds.
> 
---

### Exercise 3: Handling Hard Page Refresh Fallbacks

**Scenario:**
Provide `default.tsx` fallback UI for parallel modal slots when users perform a hard browser refresh on dynamic URLs.

**Requirements:**
1. Create `app/feed/@modal/default.tsx` returning `null`.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> // app/feed/@modal/default.tsx
> export default function DefaultModal() {
>   return null;
> }
> ```
> 
> #### Technical Explanation
>
> 1. Next.js uses `default.tsx` to render fallback UI when a parallel slot cannot be matched during hard refreshes.
> 2. Returning `null` hides the empty modal slot container during initial page loads.
> 3. Essential guard for parallel intercepting routes.
> 
---


## 6. Related Terms
- [Parallel Routes (`@folder`)](parallel_routes.md) — The mechanism used to display the intercepted content without losing the background page.
- [`<Link>` Component](../level_03/link.md) — The trigger for the interception.
- [Node.js `path` Module](path_module.md) — Related concept: Node.js `path` Module.

---

## 7. Key Takeaways
- **Intercepting Routes** allow you to hijack client-side navigation to a new URL, displaying that URL's content within your current layout instead of navigating away.
- They are almost exclusively used in combination with Parallel Routes to build robust, shareable Modals.
- They use `(.)`, `(..)`, and `(...)` syntax to target which route they are intercepting based on folder depth.
- Interception **only happens on client-side navigation**. Hard refreshes serve the standard, non-intercepted route.
