# On-Demand Revalidation (`revalidatePath`, `revalidateTag`)

> **Level 6 — Server Actions & Mutations**
> Server-side functions used to instantly purge specific cached data and force Next.js to regenerate the UI, typically called immediately after a database mutation.

---

## 1. Prerequisites
- [Server Actions Overview (`"use server"`)](server_actions.md) — The environment where you trigger the revalidation.
- [Data Caching (`force-cache`, `no-store`)](../level_05/data_caching.md) — The cache you are purging.

---

## 2. Term Category

**Data Fetching & Caching** (Programmatic Cache Purging): On-Demand Revalidation (`revalidatePath`, `revalidateTag`) purges Data Cache entries instantly after data mutations occur.



---

## 3. Explanation

### Environment Context
- **Server Only**

### (1) Design Motivation — "Why did we design this?"
You have a Blog app. The homepage lists all posts and is heavily cached using `force-cache` for performance.
A user submits a Form Action to publish a new post. The database is updated, but because the homepage is permanently cached, the new post doesn't show up!
You don't want to wait an hour for a time-based revalidation. You need to tell Next.js: *"Hey, I just updated the database. Delete the cache for the homepage RIGHT NOW."*
**On-Demand Revalidation** allows you to programmatically purge the cache at the exact moment data changes.

### (2) `revalidatePath()`
This function purges the cache for a specific URL path.

```tsx
// app/actions.ts
"use server";
import { revalidatePath } from 'next/cache';
import db from '@/lib/db';

export async function createPost(formData: FormData) {
  // 1. Update the database
  await db.post.create({ title: formData.get('title') });

  // 2. Instantly purge the cache for the blog homepage!
  revalidatePath('/blog');
  
  // The next user to visit /blog will trigger a fresh fetch and see the new post.
}
```

### (3) `revalidateTag()`
What if the blog posts are displayed on the homepage `/`, the `/blog` page, and an `/author/kenny` page? Calling `revalidatePath` three times is tedious.
Instead, when you fetch the data, you can tag the request:
`fetch('...', { next: { tags: ['posts'] } })`

Then, in your Server Action, you purge the tag! This instantly purges that specific data from *every* page it exists on.

```tsx
"use server";
import { revalidateTag } from 'next/cache';

export async function createPost() {
  await db.post.create(...);
  
  // Instantly purges ALL fetches tagged with 'posts' across the entire application!
  revalidateTag('posts'); 
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting to `await` the database mutation

**The mistake:** A developer calls `revalidatePath` before the database finishes saving.
```tsx
export async function createPost() {
  db.post.create(...) // ❌ Missing 'await'!
  revalidatePath('/blog'); // Runs instantly!
}
```

**Why it's wrong:** The `revalidatePath` function fires immediately. It clears the cache and tells Next.js to fetch fresh data. But because you forgot to `await` the database insertion, the database hasn't actually saved the new post yet! Next.js fetches the "fresh" data, but it's still the old data.
**Golden Rule:** Always ensure your database mutations are completely `await`ed before calling revalidation functions.

---

### Mistake 2: Forgetting to Call `revalidatePath()` After Mutating Database State in Server Actions

**The mistake:** Updating a user profile in a Server Action without calling `revalidatePath('/profile')`.

**Why it's wrong:** Next.js aggressively caches rendered server components. Mutating database records without invalidating path caches causes users to see stale old data.

*Incorrect:*
```typescript
'use server';
export async function updateName(newName: string) {
  await db.user.update(...);
  // ❌ Missing revalidatePath! UI continues showing stale cached name!
}
```

*Fix:*
```typescript
'use server';
import { revalidatePath } from 'next/cache';
export async function updateName(newName: string) {
  await db.user.update(...);
  revalidatePath('/profile'); // Purges cached page path
}
```

---

### Mistake 3: Over-Purging Cache Using Layout Scope `revalidatePath('/', 'layout')`

**The mistake:** Purging root layout cache on every single form comment submission.

**Why it's wrong:** Purging root layout invalidates cache across ALL pages in the app, forcing full server re-renders for every user. Use tag-based revalidation (`revalidateTag()`).

*Incorrect:*
```typescript
revalidatePath('/', 'layout'); // ❌ Wipes entire app cache!
```

*Fix:*
```typescript
revalidateTag('comments'); // Targeted invalidation for comment feeds
```


---

## 5. Practice Exercises

### Exercise 1: Revalidating Specific Route Paths with `revalidatePath`

**Scenario:**
Purge cached data for `/products` after updating a product record inside a Server Action.

**Requirements:**
1. Import `revalidatePath` from `next/cache`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // app/actions/product.ts
> "use server";

import { revalidatePath } from "next/cache";

export async function updateProductAction(id: string, name: string) {
  // Update database...

  // Purge static route cache for /products
  revalidatePath("/products");
}
```

> #### Technical Explanation
>
> 1. `revalidatePath('/products')` purges cached route HTML and Data Cache entries for the specified route.
> 2. Subsequent HTTP requests fetch fresh data from the server.
> 3. Instant UI updates for dynamic route mutations.

---

### Exercise 2: Revalidating Tagged Data Requests with `revalidateTag`

**Scenario:**
Purge all fetch requests tagged with `'user-profile'` across all application routes using `revalidateTag()`.

**Requirements:**
1. Execute `revalidateTag('user-profile')` in Server Action.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> "use server";

import { revalidateTag } from "next/cache";

export async function updateUserProfile(userId: string) {
  // Update user in database...

  // Purges all Data Cache entries tagged with 'user-profile'
  revalidateTag("user-profile");
}
```

> #### Technical Explanation
>
> 1. `revalidateTag('tag-name')` invalidates matching Data Cache entries globally, regardless of which page requested them.
> 2. Superior to `revalidatePath` when the same data entity is rendered across multiple distinct URL routes.
> 3. Targeted cache invalidation pattern.

---

### Exercise 3: Revalidating Layout vs Page Segments

**Scenario:**
Revalidate an entire layout segment (`/dashboard`) including all sub-pages using `revalidatePath('/dashboard', 'layout')`.

**Requirements:**
1. Pass `'layout'` as second argument to `revalidatePath()`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> "use server";

import { revalidatePath } from "next/cache";

export async function globalDashboardReset() {
  // Revalidates dashboard layout AND all nested sub-routes (/dashboard/analytics, /dashboard/users)
  revalidatePath("/dashboard", "layout");
}
```

> #### Technical Explanation
>
> 1. `revalidatePath(path, 'layout')` recursively purges the layout and all child route pages under the path.
> 2. `revalidatePath(path, 'page')` purges ONLY the specific page segment.
> 3. Granular route cache invalidation control.

---




---

## 6. Related Terms
- [Data Caching (`force-cache`, `no-store`)](../level_05/data_caching.md) — The system being manipulated.
- [`redirect()` & `permanentRedirect()`](../level_04/redirect.md) — Often called immediately *after* `revalidatePath` in a Server Action.
- [Time-based Revalidation (`next.revalidate`)](../level_05/revalidation.md) — Related concept: Time-based Revalidation (`next.revalidate`).
- [Incremental Static Regeneration (ISR)](../level_08/isr.md) — Related concept: Incremental Static Regeneration (ISR).
- [The Next.js Cache (The Four Caches)](../level_08/next_cache.md) — Related concept: The Next.js Cache (The Four Caches).

---

## 7. Key Takeaways
- **On-Demand Revalidation** allows you to instantly purge cached data after a mutation.
- **`revalidatePath('/route')`** clears the cache for a specific URL.
- **`revalidateTag('tagName')`** clears the cache for any `fetch` request that was labeled with that specific tag, regardless of what URL it is on.
- These functions must be called *after* the database mutation completes.
