# Draft Mode

> **Level 10 — Advanced Architecture**
> A Next.js API helper feature that temporarily bypasses the static cache (SSG), allowing Headless CMS editors to securely preview unpublished drafts in real-time.

---

## 1. Prerequisites
- [Static Site Generation (SSG)](../level_08/ssg.md) — The caching mechanism that Draft Mode bypasses.
- [Route Handlers (`route.ts`)](../level_07/route_handlers.md) — How you securely enable Draft Mode via an API endpoint.
---

## 2. Term Category
- **API Helpers**

---

## 3. Environment Context
- **Server Only (Server Components & Route Handlers)**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Static rendering (SSG) compiles React components into raw HTML at build time for speed. However, this creates a major obstacle for content creators using a Headless Content Management System (CMS) like Sanity or Contentful. 

If a writer modifies a draft in the CMS, they cannot see how the changes look on the actual live website layout because the website page is statically frozen. Rebuilding the entire site takes too long.

**Draft Mode** resolves this. It allows content editors to securely preview their unpublished CMS drafts in real-time directly on the live website layout by dynamically bypassing Next.js static page caches.

---

### (2) Cookie-Based Bypass Mechanics
When you enable Draft Mode, Next.js sets a signed, secure cookie on the user's browser named `__prerender_bypass`. 

Every time a page request is made, Next.js checks for the presence of this cookie. If found, Next.js bypasses the static cache (Full Route Cache) and executes the Server Component dynamically at request time, allowing the page to fetch fresh draft details from the CMS.

---

### (3) Implementation Pattern
First, create a secure Route Handler to enable the cookie:

```typescript
// app/api/draft/route.ts
import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const slug = searchParams.get('slug') || '/';
  
  // 1. Verify the secret token matches your CMS settings
  if (secret !== process.env.CMS_PREVIEW_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  // 2. Set the secure prerender bypass cookie
  draftMode().enable();

  // 3. Redirect to the target post path
  redirect(slug);
}
```

Next, read the draft status inside your Server Component:

```typescript
// app/posts/[slug]/page.tsx
import React from 'react';
import { draftMode } from 'next/headers';
import { getPost } from '@/lib/cms';

export default async function BlogPostPage({ params }) {
  // Read if the bypass cookie is active
  const { isEnabled } = draftMode();

  // Fetch draft content if enabled, otherwise fetch public content
  const post = await getPost(params.slug, { preview: isEnabled });

  return (
    <article>
      {isEnabled && <div className="banner">Preview Mode Active</div>}
      <h1>{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  );
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Forgetting to build a Disable endpoint

**The mistake:** Enabling Draft Mode, but leaving no mechanism for users to disable it:

**Why it's wrong:** Once `draftMode().enable()` sets the cookie, the browser retains it. The user will perpetually bypass the cache, experiencing slow dynamic rendering on every visit until they manually delete their browser cookies.

**Golden Rule:** Always build a companion API route that clears the cookie using `draftMode().disable()`.

---

### Mistake 2: Leaving Draft Mode Secret Validation Tokens Exposed in Public Repositories

**The mistake:** Hardcoding `if (secret !== 'my-secret')` inside `app/api/draft/route.ts`.

**Why it's wrong:** Hardcoding draft mode secrets allows unauthorized users to trigger draft mode previews. Read secret tokens from secure environment variables (`process.env.DRAFT_SECRET`).

*Incorrect:*
```typescript
if (secret !== '12345') return; // ❌ Hardcoded secret token!
```

*Fix:*
```typescript
if (secret !== process.env.DRAFT_SECRET) return new Response('Invalid secret', { status: 401 });
```

---

### Mistake 3: Confusing Deprecated `previewData` (Pages Router) with `draftMode()` (App Router)

**The mistake:** Attempting to use `res.setPreviewData()` inside App Router Route Handlers.

**Why it's wrong:** In App Router, `setPreviewData` is replaced by `draftMode().enable()` and `draftMode().disable()`.

*Incorrect:*
```typescript
res.setPreviewData({}); // ❌ Deprecated Pages Router preview API!
```

*Fix:*
```typescript
import { draftMode } from 'next/headers';
draftMode().enable(); // Correct App Router Draft Mode API
```


---

## 6. Practice Exercises

### Exercise 1: Disable Route Handler

**Problem:** Write a Route Handler `/api/disable-draft/route.ts` that disables Draft Mode and redirects the user back to the homepage:

```typescript
// app/api/disable-draft/route.ts
import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';

// Solution:
export async function GET() {
  draftMode().disable();
  redirect('/');
}
```

> [!check]- Answer
> - Call `draftMode().disable()` to clear the bypass cookie.

---

### Exercise 2: Draft Mode Route Handler Pattern

**Problem:** Write App Router Route Handler `app/api/draft/route.ts` checking secret and calling `draftMode().enable()`.

**Expected output:**
> [!check]- Answer
> ```typescript
> import { draftMode } from 'next/headers'; import { redirect } from 'next/navigation'; export async function GET(request: Request) { draftMode().enable(); redirect('/posts/slug'); }
> ```
> - `draftMode().enable()` sets a cookie bypassing static page cache.
> 
> ```typescript
> import { draftMode } from 'next/headers';
> import { redirect } from 'next/navigation';
> 
> export async function GET(request: Request) {
>   const { searchParams } = new URL(request.url);
>   const secret = searchParams.get('secret');
>   const slug = searchParams.get('slug');
>   
>   if (secret !== process.env.DRAFT_SECRET) {
>     return new Response('Invalid token', { status: 401 });
>   }
>   
>   draftMode().enable();
>   redirect(`/posts/${slug}`);
> }
> ```

---

### Exercise 3: Checking Draft Mode State in Server Components

**Problem:** Write line in Server Component checking if Draft Mode is currently enabled.

**Expected output:**
> [!check]- Answer
> ```typescript
> import { draftMode } from 'next/headers'; const { isEnabled } = draftMode();
> ```
> - `draftMode().isEnabled` indicates active draft mode status.
> 
> ```typescript
> import { draftMode } from 'next/headers';
> const { isEnabled } = draftMode();
> ```


---

## 7. Related Terms
- [Route Handlers (`route.ts`)](../level_07/route_handlers.md) — The endpoints used to toggle Draft Mode.
- [Static Site Generation (SSG)](../level_08/ssg.md) — The static caching layer being bypassed.
---

## 8. Key Takeaways
- Draft Mode temporarily bypasses Next.js's static HTML cache.
- It is designed for real-time visual previews of draft CMS contents.
- It operates using a signed browser cookie (`__prerender_bypass`).
- Toggle Draft Mode using `draftMode().enable()` and `draftMode().disable()` inside API routes.
- Access the current status in Server Components via the boolean value `draftMode().isEnabled`.
