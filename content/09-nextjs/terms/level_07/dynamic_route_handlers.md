# Dynamic Route Handlers

> **Level 7 — API & Route Handlers**
> Route Handlers (`route.ts`) that utilize dynamic segments (`[slug]`) in their folder structure, allowing you to build flexible API endpoints like `/api/users/123`.

---

## 1. Prerequisites
- [Route Handlers (`route.ts`)](route_handlers.md) — The foundation of the API.
---

## 2. Term Category
- **API Endpoint / Routing**

---

## 3. Environment Context
- **Server Only**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
If you are building a REST API for your Next.js application, you need to be able to target specific resources. You don't just want `GET /api/users`. You need `GET /api/users/1`, `GET /api/users/2`, etc.
Because Next.js uses file-system routing, the exact same bracket syntax `[id]` that works for UI `page.tsx` files also works perfectly for API `route.ts` files!

### (2) The Folder Structure
```text
app/
  api/
    users/
      [id]/
        route.ts   -> Matches /api/users/123
```

### (3) Accessing the `params` object
Just like `page.tsx`, the `route.ts` function receives a context object as its **second** parameter. This object contains the `params` extracted from the URL.

```ts
// app/api/users/[id]/route.ts
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } } // The second argument!
) {
  const userId = params.id; // e.g., "123"

  // Fetch the specific user from the database
  const user = await db.user.findUnique({ where: { id: userId } });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json(user);
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Trying to access `params` as the first argument

**The mistake:** A developer writes:
```ts
export async function GET({ params }: { params: { id: string } }) { // ❌
  console.log(params.id);
}
```

**Why it's wrong:** In `page.tsx`, `params` is passed directly in the first argument (the props object). However, in `route.ts`, the **first** argument is ALWAYS the `Request` object. The `context` object containing the `params` is the **second** argument. If you try to destructure `params` from the first argument, it will be `undefined`.
**Golden Rule:** For dynamic Route Handlers, the signature is always `async function GET(request, context)`.

---

### Mistake 2: Reading `params` Synchronously in Next.js 15 Dynamic Route Handlers

**The mistake:** Writing `export async function GET(request, { params }) { const id = params.id; }` in Next.js 15.

**Why it's wrong:** In Next.js 15+, `params` passed to Route Handlers is a Promise (`{ params: Promise<{ id: string }> }`). Synchronous access causes runtime deprecation warnings.

*Incorrect:*
```typescript
// Next.js 15 sync params access
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const id = params.id; // ❌ Sync params access warning!
}
```

*Fix:*
```typescript
// Next.js 15 async params resolution:
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; // Await params Promise
}
```

---

### Mistake 3: Confusing Dynamic Route Handlers (`route.ts`) with Dynamic Page Routes (`page.tsx`)

**The mistake:** Creating `app/api/users/[id]/page.tsx` for a JSON REST API endpoint.

**Why it's wrong:** `page.tsx` renders HTML user interfaces. Backend REST API endpoints must be named `route.ts` inside an `app/api/...` directory.

*Incorrect:*
```tsx
// app/api/users/[id]/page.tsx ❌ Page file renders HTML, not API JSON!
```

*Fix:*
```typescript
// app/api/users/[id]/route.ts Correct REST API Route Handler filename
```


---

## 6. Practice Exercises

### Exercise 1: The Request parameter

**Problem:** You are building `app/api/posts/[slug]/route.ts`. You don't need to read any headers or query strings, you ONLY need the `slug`. Can you just omit the `request` parameter?

**Expected output:**
> [!check]- Answer
> ```ts
> // You must still accept the request parameter, even if you don't use it!
> // Or, use an underscore convention to mark it as ignored.
> export async function GET(_request: Request, { params }: { params: { slug: string } }) {
>   const post = await fetchPost(params.slug);
>   return Response.json(post);
> }
> ```
> - JavaScript function parameters are positional. If you skip the first one, the second one shifts into the first position!

---

### Exercise 2: Dynamic Route Handler GET Request Pattern

**Problem:** Write dynamic Route Handler `app/api/products/[id]/route.ts` handling `GET` request and returning JSON `{ id, product }`.

**Expected output:**
> [!check]- Answer
> ```typescript
> import { NextResponse } from 'next/server'; export async function GET(req: Request, { params }: { params: { id: string } }) { return NextResponse.json({ id: params.id, name: 'Sample Product' }); }
> ```
> - Dynamic Route Handlers receive route segment parameters via `{ params }`.
> 
> ```typescript
> import { NextResponse } from 'next/server';
> 
> export async function GET(
>   request: Request,
>   { params }: { params: { id: string } }
> ) {
>   const productId = params.id;
>   return NextResponse.json({ id: productId, status: 'Active' });
> }
> ```

---

### Exercise 3: Route Handler 404 Response

**Problem:** Write `NextResponse.json()` line returning 404 Not Found error payload.

**Expected output:**
> [!check]- Answer
> ```typescript
> return NextResponse.json({ error: 'Product Not Found' }, { status: 404 });
> ```
> - Pass options object `{ status: 404 }` to set HTTP response status.
> 
> ```typescript
> return NextResponse.json({ error: 'Not Found' }, { status: 404 });
> ```


---

## 7. Related Terms
- [Route Handlers (`route.ts`)](route_handlers.md) — The file utilizing the parameters.
- [Caching Route Handlers](caching_route_handlers.md) — Related concept: Caching Route Handlers.
---

## 8. Key Takeaways
- **Dynamic Route Handlers** use bracket folder syntax (e.g., `[id]`) to create flexible API endpoints.
- The route handler function receives the extracted parameters via the `params` property on the **second** argument (the `context` object).
- The first argument is always the Web `Request` object.
