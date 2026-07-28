# Route Handlers (`route.ts`)

> **Level 7 — API & Route Handlers**
> The App Router equivalent of an API endpoint. They allow you to create custom request handlers for a given route using the Web Request and Response APIs.

---

## 1. Prerequisites
- [App Router vs Pages Router](../level_01/app_router_vs_pages.md) — The routing system.
- [HTTP Methods](../level_07/http_methods.md) — GET, POST, PUT, DELETE.

---

## 2. Term Category
- **API Endpoint**

---

## 3. Environment Context
- **Server Only**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In the legacy Pages Router, you created API endpoints in the `pages/api/` folder. They used the Node.js `req` and `res` objects (like Express.js).
In the App Router, Next.js wanted to fully embrace standard Web APIs (the `fetch` API) and edge computing. They introduced **Route Handlers** via the `route.ts` file convention.
If `page.tsx` returns HTML for the browser, `route.ts` returns JSON, XML, or raw data for API clients (like mobile apps, external services, or client-side fetches).

### (2) The `route.ts` Syntax
You create a `route.ts` file inside a folder. Inside it, you export an `async` function named exactly after the HTTP method you want to support: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, or `OPTIONS`.

```ts
// app/api/hello/route.ts

// This handles a GET request to /api/hello
export async function GET() {
  return Response.json({ message: 'Hello, World!' });
}

// This handles a POST request to /api/hello
export async function POST(request: Request) {
  const data = await request.json();
  
  // Save to DB
  await saveUser(data);

  return Response.json({ success: true }, { status: 201 });
}
```

### (3) The Web Standard `Response`
Notice that we return a standard Web `Response` object. In the old Pages router, you would mutate a response object (`res.status(200).json(data)`). In the App Router, you simply **return** a new `Response` object. This makes the code much cleaner and compatible with Edge runtimes like Cloudflare Workers.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Placing `route.ts` and `page.tsx` in the same folder

**The mistake:** A developer creates `app/users/page.tsx` to show the UI, and then creates `app/users/route.ts` to provide an API endpoint for the same URL.

**Why it's wrong:** A single URL path (like `/users`) cannot return *both* a React HTML page AND a JSON API response at the exact same time! Next.js will throw a build error complaining about a Route Conflict.
**Golden Rule:** Keep your API routes structurally separated from your UI routes. A common convention is to place all your Route Handlers inside an `app/api/` folder (e.g., `app/api/users/route.ts`).

---

### Mistake 2: Placing `route.ts` and `page.tsx` in the Exact Same Route Folder (Routing Conflict)

**The mistake:** Creating both `app/dashboard/page.tsx` and `app/dashboard/route.ts` in the same directory.

**Why it's wrong:** A single route folder cannot contain both `page.tsx` and `route.ts`. Next.js will throw a build collision error. Move API handlers into an `api/` sub-folder (`app/api/dashboard/route.ts`).

*Incorrect:*
```tsx
// app/dashboard/page.tsx AND app/dashboard/route.ts in same folder ❌ Build Error!
```

*Fix:*
```typescript
// Separate UI page and API handler:
// UI Page: app/dashboard/page.tsx
// API Handler: app/api/dashboard/route.ts
```

---

### Mistake 3: Forgetting `await req.json()` When Reading Request Body Payloads

**The mistake:** Writing `const data = req.json()` without `await`.

**Why it's wrong:** `req.json()` returns a Promise. Reading `req.json()` synchronously causes `data` to resolve as a Promise object rather than the parsed JSON payload.

*Incorrect:*
```typescript
export async function POST(req: Request) {
  const data = req.json(); // ❌ Missing await! data is a Promise!
}
```

*Fix:*
```typescript
export async function POST(req: Request) {
  const data = await req.json(); // Await JSON parsing
}
```


---

## 6. Practice Exercises

### Exercise 1: Server Actions vs Route Handlers

**Problem:** You have a "Contact Us" form on your website. Should you build a `POST` Route Handler for it, or use a Server Action?

**Expected output:**
> [!check]- Answer
> ```text
> You should use a Server Action!
> In the App Router era, Route Handlers (`route.ts`) should primarily be used for interacting with EXTERNAL systems (like webhooks from Stripe, or building an API for a mobile app). 
> If you are just mutating data from your own Next.js React UI, Server Actions are the officially recommended and vastly superior approach.
> ```
> - Think about what we learned in Level 6 regarding form submissions.

---

### Exercise 2: Complete REST POST Route Handler Pattern

**Problem:** Write complete `app/api/items/route.ts` handling `POST` request, reading JSON body `{ title }`, creating item in DB, returning HTTP 201 response.

**Expected output:**
> [!check]- Answer
> ```typescript
> import { NextResponse } from 'next/server'; export async function POST(req: Request) { const body = await req.json(); const item = await db.item.create({ data: { title: body.title } }); return NextResponse.json(item, { status: 201 }); }
> ```
> - Route Handlers parse JSON bodies and return `NextResponse.json()`.
> 
> ```typescript
> import { NextResponse } from 'next/server';
> import { db } from '@/lib/db';
> 
> export async function POST(request: Request) {
>   try {
>     const body = await request.json();
>     const newItem = await db.item.create({
>       data: { title: body.title }
>     });
>     return NextResponse.json(newItem, { status: 201 });
>   } catch (error) {
>     return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
>   }
> }
> ```

---

### Exercise 3: Route Handler File Naming Convention

**Problem:** What is the mandatory reserved filename for Route Handlers in Next.js App Router?

**Expected output:**
> [!check]- Answer
> ```text
> route.ts (or route.js)
> ```
> - `route.ts` defines backend API endpoints in the App Router.
> 
> ```text
> app/api/v1/users/route.ts
> ```


---

## 7. Related Terms
- [`NextRequest` & `NextResponse`](../level_07/next_request_response.md) — The Next.js specific extensions to the standard Web Request/Response objects.
- [Server Actions](../level_06/server_actions.md) — The alternative to Route Handlers for internal app mutations.

---

## 8. Key Takeaways
- **Route Handlers** (`route.ts`) are the App Router's way of creating API endpoints.
- You define them by exporting named HTTP methods (`GET`, `POST`, `DELETE`, etc.).
- They rely entirely on standard Web APIs (`Request` and `Response`) rather than Node-specific objects.
- A folder cannot contain both a `route.ts` and a `page.tsx` because a single URL cannot resolve to two different things.
