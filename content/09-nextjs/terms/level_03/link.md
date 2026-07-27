# `<Link>` Component

> **Level 3 — Navigation & Routing Fundamentals**
> The built-in Next.js component used for client-side navigation between routes. It is a highly optimized extension of the standard HTML `<a>` tag.

---

## 1. Prerequisites
- [App Router vs Pages Router](../level_01/app_router_vs_pages.md) — How routes are structured.
- [React Components](../level_01/react_components.md) — The syntax of using a React component.

---

## 2. Term Category
- **Routing / Navigation**

---

## 3. Environment Context
- **Server Component or Client Component**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Disabling Prefetching

**Problem:** You have a massive table of 500 users, each with a `<Link href="/user/123">` button. You notice your server is getting slammed because Next.js is prefetching all 500 user profiles as soon as the table loads. How do you disable this?

**Expected output:**
```tsx
// You can pass the `prefetch={false}` prop!
// Note: It will still prefetch if the user physically hovers their mouse over it.
<Link href={`/user/${user.id}`} prefetch={false}>
  View Profile
</Link>
```

> [!check]- Answer
> - Check the props available on the Link component.

---

### Exercise 2: Link Object Prop Syntax

**Problem:** Write `<Link>` passing URL path `/search` with query parameter `{ q: 'nextjs' }` and hash `#results`.

**Expected output:**
```tsx
<Link href={{ pathname: '/search', query: { q: 'nextjs' }, hash: 'results' }}>Search</Link>
```

> [!check]- Answer
> - `<Link href={{ ... }}>` accepts URL location objects.
> 
> ```tsx
> import Link from 'next/link';
> 
> export function SearchLink() {
>   return (
>     <Link
>       href={{
>         pathname: '/search',
>         query: { q: 'nextjs' },
>         hash: 'results'
>       }}
>     >
>       Search Next.js
>     </Link>
>   );
> }
> ```

---

### Exercise 3: Link Viewport Prefetching Rule

**Problem:** When does Next.js automatically prefetch code for `<Link>` components in production?

**Expected output:**
```text
When the <Link> component enters the browser viewport.
```

> [!check]- Answer
> - Prefetching executes when links enter the browser viewport.
> 
> ```text
> Intersection Observer detects Link -> Background RSC payload prefetch
> ```


---

## 7. Related Terms
- [`useRouter` Hook](../level_03/use_router.md) — How to navigate programmatically without a clickable link.
- [`page.tsx`](../level_02/page.md) — The file that the `<Link>` ultimately resolves to.

---

## 8. Key Takeaways
- Use **`<Link href="...">`** instead of `<a href="...">` for all internal navigation in Next.js.
- It enables client-side routing, meaning the page doesn't hard-refresh when clicked.
- It automatically **prefetches** destination routes when the link enters the viewport, making navigation feel instantaneous.
- You can pass `prefetch={false}` if you have too many links on a page and want to save bandwidth.
