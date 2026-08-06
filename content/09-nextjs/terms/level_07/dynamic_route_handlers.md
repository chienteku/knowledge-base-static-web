# Dynamic Route Handlers

> **Level 7 — API & Route Handlers**
> Route Handlers (`route.ts`) that utilize dynamic segments (`[slug]`) in their folder structure, allowing you to build flexible API endpoints like `/api/users/123`.

---

## 1. Prerequisites
- [Route Handlers (`route.ts`)](route_handlers.md) — The foundation of the API.

---

## 2. Term Category

**Server & Edge API** (Dynamic Request Endpoint Processing): Dynamic Route Handlers execute dynamically on every HTTP request when reading cookies, headers, or query parameters.



---

## 3. Explanation

### Environment Context
- **Server Only**

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Parsing Dynamic URL Path Parameters in Route Handlers

**Scenario:**
Extract dynamic path parameter `id` inside `app/api/users/[id]/route.ts`.

**Requirements:**
1. Access `params.id` in `GET(req, { params })`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // app/api/users/[id]/route.ts
> export async function GET(
>   request: Request,
>   { params }: { params: Promise<{ id: string }> }
> ) {
>   const { id } = await params;
>   return Response.json({ userId: id, status: "Active" });
> }
> ```
> 
> #### Technical Explanation
>
> 1. Dynamic Route Handlers receive `params` as a Promise in the second argument context.
> 2. Accessing `params` automatically turns the Route Handler into a dynamic execution endpoint.
> 3. Standard REST API dynamic parameter handling pattern.
> 
---

### Exercise 2: Reading Request Cookies and Headers in Dynamic Handlers

**Scenario:**
Read `NextRequest` cookies and URL search parameters dynamically inside a `GET` Route Handler.

**Requirements:**
1. Use `req.nextUrl.searchParams` and `req.cookies`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // app/api/search/route.ts
> import { NextRequest } from "next/server";
> 
> export async function GET(req: NextRequest) {
>   const query = req.nextUrl.searchParams.get("q");
>   const token = req.cookies.get("auth_token")?.value;
> 
>   if (!token) {
>     return Response.json({ error: "Unauthorized" }, { status: 401 });
>   }
> 
>   return Response.json({ query, tokenPresent: true });
> }
> ```
> 
> #### Technical Explanation
>
> 1. Accessing `req.nextUrl.searchParams` or `req.cookies` opts the Route Handler into dynamic execution.
> 2. Runs on Node.js/edge servers for every incoming request.
> 3. Enables authenticated API endpoint workflows.
> 
---

### Exercise 3: Setting Custom Response Headers and Status Codes

**Scenario:**
Return custom HTTP status `201 Created` and `Location` header upon successful resource creation.

**Requirements:**
1. Construct `Response.json(body, { status: 201, headers: ... })`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> export async function POST(req: Request) {
>   const body = await req.json();
> 
>   return Response.json(
>     { success: true, item: body },
>     {
>       status: 201,
>       headers: {
>         "Location": `/api/items/${body.id}`,
>         "X-Custom-Header": "Processed"
>       }
>     }
>   );
> }
> ```
> 
> #### Technical Explanation
>
> 1. `Response.json()` accepts a standard ResponseInit configuration object as its second argument.
> 2. `status: 201` sets the HTTP response status code.
> 3. Standard REST API response construction.
> 
---


## 6. Related Terms
- [Route Handlers (`route.ts`)](route_handlers.md) — The file utilizing the parameters.
- [Caching Route Handlers](caching_route_handlers.md) — Related concept: Caching Route Handlers.

---

## 7. Key Takeaways
- **Dynamic Route Handlers** use bracket folder syntax (e.g., `[id]`) to create flexible API endpoints.
- The route handler function receives the extracted parameters via the `params` property on the **second** argument (the `context` object).
- The first argument is always the Web `Request` object.
