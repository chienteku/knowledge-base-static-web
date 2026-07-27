# On-Demand Revalidation (`revalidatePath`, `revalidateTag`)

> **Level 6 — Server Actions & Mutations**
> Server-side functions used to instantly purge specific cached data and force Next.js to regenerate the UI, typically called immediately after a database mutation.

---

## 1. Prerequisites
- [Server Actions](../level_06/server_actions.md) — The environment where you trigger the revalidation.
- [Data Caching (`force-cache`)](../level_05/data_caching.md) — The cache you are purging.

---

## 2. Term Category
- **Cache Management / Mutation**

---

## 3. Environment Context
- **Server Only**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Revalidating a Layout

**Problem:** You have a `layout.tsx` that fetches a user's notification count. The user clicks a "Mark all as read" Server Action. If you call `revalidatePath('/dashboard')`, does it refresh the layout's data too?

**Expected output:**
```text
Yes!
`revalidatePath` clears the Router Cache and the Data Cache for the entire specified path, including its layouts. The next time the page renders, the layout will fetch the fresh notification count (0).
```

> [!check]- Answer
> - Think about the scope of a URL path.

---

### Exercise 2: revalidatePath vs revalidateTag Selection

**Problem:** When should you prefer `revalidateTag()` over `revalidatePath()`?

**Expected output:**
```text
When cached data is shared across multiple different page URLs (e.g. product details rendered on homepage, category page, and product detail page).
```

> [!check]- Answer
> - `revalidateTag()` purges tagged data across ALL page URLs simultaneously.
> 
> ```text
> revalidatePath() = Single URL path;
> revalidateTag() = Shared data across multiple URLs.
> ```

---

### Exercise 3: On-Demand Revalidation Webhook Pattern

**Problem:** Write a Next.js Route Handler `app/api/revalidate/route.ts` validating a secret token and calling `revalidateTag('posts')`.

**Expected output:**
```typescript
import { revalidateTag } from 'next/cache'; import { NextRequest, NextResponse } from 'next/server'; export async function POST(req: NextRequest) { const secret = req.nextUrl.searchParams.get('secret'); if (secret !== process.env.MY_SECRET) return NextResponse.json({ message: 'Invalid token' }, { status: 401 }); revalidateTag('posts'); return NextResponse.json({ revalidated: true }); }
```

> [!check]- Answer
> - Secure webhook route handlers purge caches for headless CMS updates.
> 
> ```typescript
> import { revalidateTag } from 'next/cache';
> import { NextRequest, NextResponse } from 'next/server';
> 
> export async function POST(req: NextRequest) {
>   const secret = req.nextUrl.searchParams.get('secret');
>   if (secret !== process.env.MY_SECRET) {
>     return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
>   }
>   revalidateTag('posts');
>   return NextResponse.json({ revalidated: true, now: Date.now() });
> }
> ```


---

## 7. Related Terms
- [Data Caching](../level_05/data_caching.md) — The system being manipulated.
- [`redirect()`](../level_04/redirect.md) — Often called immediately *after* `revalidatePath` in a Server Action.

---

## 8. Key Takeaways
- **On-Demand Revalidation** allows you to instantly purge cached data after a mutation.
- **`revalidatePath('/route')`** clears the cache for a specific URL.
- **`revalidateTag('tagName')`** clears the cache for any `fetch` request that was labeled with that specific tag, regardless of what URL it is on.
- These functions must be called *after* the database mutation completes.
