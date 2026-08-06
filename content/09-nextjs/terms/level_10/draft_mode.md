# Draft Mode

> **Level 10 — Advanced Architecture**
> A Next.js API helper feature that temporarily bypasses the static cache (SSG), allowing Headless CMS editors to securely preview unpublished drafts in real-time.

---

## 1. Prerequisites
- [Static Site Generation (SSG)](../level_08/ssg.md) — The caching mechanism that Draft Mode bypasses.
- [Route Handlers (`route.ts`)](../level_07/route_handlers.md) — How you securely enable Draft Mode via an API endpoint.

---

## 2. Term Category

**SEO & Metadata** (Headless CMS Draft Mode Preview): Draft Mode (`draftMode().enable()`) bypasses static site caching to render unpublished CMS draft content live.



---

## 3. Explanation

### Environment Context
- **Server Only (Server Components & Route Handlers)**

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Enabling Headless CMS Draft Mode

**Scenario:**
Create a Route Handler `app/api/draft/route.ts` that enables Next.js Draft Mode and redirects to a CMS draft preview URL.

**Requirements:**
1. Import `draftMode` from `next/headers` and call `draftMode().enable()`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // app/api/draft/route.ts
> import { draftMode } from "next/headers";
> import { redirect } from "next/navigation";
> 
> export async function GET(request: Request) {
>   const { searchParams } = new URL(request.url);
>   const secret = searchParams.get("secret");
>   const slug = searchParams.get("slug");
> 
>   if (secret !== process.env.DRAFT_SECRET_TOKEN || !slug) {
>     return new Response("Invalid token", { status: 401 });
>   }
> 
>   const draft = await draftMode();
>   draft.enable(); // Sets __prerender_bypass cookie!
> 
>   redirect(`/blog/${slug}`);
> }
> ```
> 
> #### Technical Explanation
>
> 1. `draftMode().enable()` sets a secure `__prerender_bypass` HTTP cookie in the user's browser.
> 2. Subsequent page visits bypass static site generation (SSG) and Data Cache layers.
> 3. Renders unpublished draft content dynamically for CMS content creators.
> 
---

### Exercise 2: Fetching Unpublished CMS Draft Content inside Server Components

**Scenario:**
Inspect `draftMode().isEnabled` inside a Server Component and fetch unpublished CMS draft data if active.

**Requirements:**
1. Check `draftMode().isEnabled` in Server Component.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> // app/blog/[slug]/page.tsx
> import { draftMode } from "next/headers";
> 
> export default async function BlogPostPage({
>   params
> }: {
>   params: Promise<{ slug: string }>;
> }) {
>   const { slug } = await params;
>   const draft = await draftMode();
>   const isDraft = draft.isEnabled;
> 
>   const res = await fetch(`https://cms.example.com/posts/${slug}?preview=${isDraft}`, {
>     cache: isDraft ? "no-store" : "force-cache"
>   });
>   const post = await res.json();
> 
>   return (
>     <article className="p-6">
>       {isDraft && <div className="p-2 bg-amber-200 text-amber-900 mb-4">Draft Preview Mode</div>}
>       <h1>{post.title}</h1>
>     </article>
>   );
> }
> ```
> 
> #### Technical Explanation
>
> 1. `draftMode().isEnabled` returns `true` when the user has the draft mode preview cookie active.
> 2. Disables fetch caching (`cache: 'no-store'`) during draft preview sessions.
> 3. Displays live unpublished draft changes instantly.
> 
---

### Exercise 3: Disabling Draft Mode with `draftMode().disable()`

**Scenario:**
Create a Route Handler `app/api/disable-draft/route.ts` that disables Draft Mode and redirects back to standard view.

**Requirements:**
1. Call `draftMode().disable()`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // app/api/disable-draft/route.ts
> import { draftMode } from "next/headers";
> import { redirect } from "next/navigation";
> 
> export async function GET() {
>   const draft = await draftMode();
>   draft.disable(); // Clears __prerender_bypass cookie!
> 
>   redirect("/");
> }
> ```
> 
> #### Technical Explanation
>
> 1. `draftMode().disable()` clears the `__prerender_bypass` cookie.
> 2. Restores standard static caching behavior for subsequent page visits.
> 3. Allows users to exit draft preview mode cleanly.
> 
---


## 6. Related Terms
- [Route Handlers (`route.ts`)](../level_07/route_handlers.md) — The endpoints used to toggle Draft Mode.
- [Static Site Generation (SSG)](../level_08/ssg.md) — The static caching layer being bypassed.

---

## 7. Key Takeaways
- Draft Mode temporarily bypasses Next.js's static HTML cache.
- It is designed for real-time visual previews of draft CMS contents.
- It operates using a signed browser cookie (`__prerender_bypass`).
- Toggle Draft Mode using `draftMode().enable()` and `draftMode().disable()` inside API routes.
- Access the current status in Server Components via the boolean value `draftMode().isEnabled`.
