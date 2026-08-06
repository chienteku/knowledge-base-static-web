# `<Link>` Component

> **Level 3 — Navigation & Routing Fundamentals**
> The built-in Next.js component used for client-side navigation between routes. It is a highly optimized extension of the standard HTML `<a>` tag.

---

## 1. Prerequisites
- [App Router vs Pages Router](../level_01/app_router_vs_pages.md) — How routes are structured.
- [React Components](../level_01/react_components.md) — The syntax of using a React component.

---

## 2. Term Category

**Routing & Layouts** (Client Navigation Link Component): `<Link>` enables client-side SPA navigation, route chunk prefetching, and soft page transitions.



---

## 3. Explanation

### Environment Context
- **Server Component or Client Component**

### (1) Design Motivation — "Why did we design this?"
If you use a standard HTML `<a href="/about">` tag in a Next.js app, clicking it tells the browser to throw away the current page, make a full hard request to the server, download the CSS and JS all over again, and render the new page. This is slow and destroys any application state.
The **`<Link>`** component intercepts the click. Instead of a hard browser reload, it uses JavaScript to quietly fetch the new route's content in the background and instantly swaps the UI, providing a lightning-fast Single-Page Application (SPA) experience while maintaining all the SSR benefits.

### (2) The Syntax
You import it from `next/link` and use it exactly like an `<a>` tag.

```tsx
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav>
      {/* Standard string navigation */}
      <Link href="/about">About Us</Link>
      
      {/* Dynamic route navigation using Template Literals */}
      <Link href={`/blog/${post.id}`}>Read Post</Link>
    </nav>
  );
}
```

### (3) The Prefetching Superpower
By default, anytime a `<Link>` component scrolls into the user's viewport on the screen, Next.js automatically begins prefetching the code for that route in the background! 
By the time the user actually moves their mouse and clicks the link, the destination page is often already downloaded, resulting in near-instant zero-latency navigation.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using `<a>` tags for internal links

**The mistake:** A developer writes `<a href="/dashboard">Dashboard</a>`.

**Why it's wrong:** As mentioned, this causes a full browser refresh. You lose your Client Component state (like Redux stores or unsaved forms), you lose the Next.js cache, and the user experiences a white flash as the page reloads.
**Golden Rule:** Always use `next/link` for internal navigation. Only use standard `<a>` tags when linking to external websites (e.g., `<a href="https://google.com">`).

---

### Mistake 2: Nesting Manual `<a>` Anchors Inside Next.js `<Link>` Components

**The mistake:** Writing `<Link href="/about"><a>About</a></Link>` in Next.js 13+.

**Why it's wrong:** Next.js 13+ `<Link>` automatically renders an underlying `<a>` HTML tag. Nesting an explicit `<a>` inside `<Link>` creates invalid nested anchor HTML.

*Incorrect:*
```tsx
<Link href="/about">
  <a>About</a> <!-- ❌ Invalid nested <a> tag in Next.js 13+! -->
</Link>
```

*Fix:*
```tsx
<Link href="/about">
  About {/* Plain text or custom element directly inside Link */}
</Link>
```

---

### Mistake 3: Disabling Link Prefetching on Primary Site Navigation (Performance Drag)

**The mistake:** Adding `prefetch={false}` to all `<Link>` components in main navigation bars.

**Why it's wrong:** Next.js `<Link>` components automatically prefetch route JS chunks in the background when links enter the browser viewport. Disabling prefetch slows down navigation.

*Incorrect:*
```tsx
<Link href="/dashboard" prefetch={false}>Dashboard</Link> <!-- ❌ Disables fast instant prefetching! -->
```

*Fix:*
```tsx
<Link href="/dashboard">Dashboard</Link> <!-- Default prefetching enables instant page transitions -->
```


---

## 5. Practice Exercises

### Exercise 1: Client-Side SPA Navigation with `<Link>`

**Scenario:**
Implement client-side SPA navigation between `/` and `/about` using `<Link>`.

**Requirements:**
1. Render `<Link href="/about">About</Link>`.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> import Link from "next/link";
> 
> export default function Navigation() {
>   return (
>     <nav className="flex gap-4 p-4 bg-slate-100">
>       <Link href="/" className="hover:underline">
>         Home
>       </Link>
>       <Link href="/about" className="hover:underline">
>         About Us
>       </Link>
>     </nav>
>   );
> }
> ```
> 
> #### Technical Explanation
>
> 1. `<Link>` intercepts navigation clicks to perform fast client-side SPA route transitions.
> 2. Avoids triggering full browser page reloads.
> 3. Automatically prefetches route JavaScript chunks when links enter the browser viewport.
> 
---

### Exercise 2: Disabling Automatic Route Prefetching

**Scenario:**
Disable automatic viewport prefetching for a heavy admin dashboard link using `prefetch={false}`.

**Requirements:**
1. Set `prefetch={false}` on `<Link>`.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> import Link from "next/link";
> 
> export default function Footer() {
>   return (
>     <footer>
>       <Link href="/admin/analytics" prefetch={false}>
>         Admin Analytics (No Prefetch)
>       </Link>
>     </footer>
>   );
> }
> ```
> 
> #### Technical Explanation
>
> 1. By default, Next.js prefetches code chunks for all `<Link>` elements visible in the viewport.
> 2. `prefetch={false}` disables prefetching until the user hovers or clicks the link.
> 3. Reduces network data usage on mobile networks and heavy pages.
> 
---

### Exercise 3: Dynamic Route Passing to `<Link>`

**Scenario:**
Construct dynamic href paths dynamically for product cards.

**Requirements:**
1. Pass template literal or object to `href`.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> import Link from "next/link";
> 
> export default function ProductCard({ id, slug }: { id: string; slug: string }) {
>   return (
>     <div className="card">
>       <Link href={`/products/${id}?ref=${slug}`}>
>         View Product
>       </Link>
>     </div>
>   );
> }
> ```
> 
> #### Technical Explanation
>
> 1. Href prop accepts string paths or URL location objects (`{ pathname, query }`).
> 2. Preserves search parameters and dynamic segments during navigation.
> 3. Idiomatic navigation pattern in Next.js.
> 
---


## 6. Related Terms
- [`useRouter` Hook](use_router.md) — How to navigate programmatically without a clickable link.
- [`page.tsx`](../level_02/page.md) — The file that the `<Link>` ultimately resolves to.
- [Intercepting Routes (`(..)folder`)](../level_04/intercepting_routes.md) — Related concept: Intercepting Routes (`(..)folder`).

---

## 7. Key Takeaways
- Use **`<Link href="...">`** instead of `<a href="...">` for all internal navigation in Next.js.
- It enables client-side routing, meaning the page doesn't hard-refresh when clicked.
- It automatically **prefetches** destination routes when the link enters the viewport, making navigation feel instantaneous.
- You can pass `prefetch={false}` if you have too many links on a page and want to save bandwidth.
