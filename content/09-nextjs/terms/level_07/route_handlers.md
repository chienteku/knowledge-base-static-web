# Route Handlers (`route.ts`)

> **Level 7 — API & Route Handlers**
> The App Router equivalent of an API endpoint. They allow you to create custom request handlers for a given route using the Web Request and Response APIs.

---

## 1. Prerequisites
- [App Router vs Pages Router](../level_01/app_router_vs_pages.md) — The routing system.
- [HTTP Methods (GET, POST, PUT, DELETE)](http_methods.md) — GET, POST, PUT, DELETE.

---

## 2. Term Category

**Server & Edge API** (App Router REST API Endpoints): Route Handlers (`route.ts`) define custom backend REST/JSON API endpoints inside the App Router directory structure.



---

## 3. Explanation

### Environment Context
- **Server Only**

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Authoring App Router REST API Endpoints

**Scenario:**
Create a JSON API endpoint `app/api/health/route.ts` returning system status.

**Requirements:**
1. Export `GET` handler in `app/api/health/route.ts`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // app/api/health/route.ts
> export async function GET() {
>   return Response.json({
>     status: "ok",
>     uptime: process.uptime(),
>     timestamp: new Date().toISOString()
>   });
> }
> ```

> #### Technical Explanation
>
> 1. `route.ts` files define backend REST API endpoints in the App Router directory structure.
> 2. Replaces legacy `pages/api/` handlers.
> 3. Must be placed in a directory containing NO `page.tsx` file to avoid route collisions.

---

### Exercise 2: Processing JSON Request Payloads in `POST` Route Handlers

**Scenario:**
Read and validate incoming JSON body payloads in `app/api/feedback/route.ts`.

**Requirements:**
1. Execute `await req.json()` inside `POST` handler.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // app/api/feedback/route.ts
> export async function POST(req: Request) {
>   const body = await req.json();

  if (!body.email || !body.message) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Save feedback...

  return Response.json({ success: true, received: body }, { status: 201 });
}
```

> #### Technical Explanation
>
> 1. `await req.json()` parses the incoming HTTP request stream body into a JavaScript object.
> 2. Returning `Response.json(..., { status: 400 })` sets custom status code headers.
> 3. Standard REST API POST handler pattern.

---

### Exercise 3: Webhook Endpoint Signature Verification

**Scenario:**
Read raw text request bodies in a Stripe webhook Route Handler using `req.text()` for HMAC signature verification.

**Requirements:**
1. Call `await req.text()` to get raw unparsed body.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // app/api/webhooks/stripe/route.ts
> export async function POST(req: Request) {
>   const rawBody = await req.text();
>   const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return Response.json({ error: "Missing signature" }, { status: 400 });
  }

  // Verify HMAC signature against rawBody...

  return Response.json({ received: true });
}
```

> #### Technical Explanation
>
> 1. Webhook signature verification requires the UNPARSED raw string payload buffer (`req.text()`).
> 2. Calling `req.json()` alters string formatting and invalidates cryptographic HMAC signatures.
> 3. Critical pattern for payment gateway webhooks (Stripe, GitHub, Shopify).

---




---

## 6. Related Terms
- [`NextRequest` & `NextResponse`](next_request_response.md) — The Next.js specific extensions to the standard Web Request/Response objects.
- [Server Actions Overview (`"use server"`)](../level_06/server_actions.md) — The alternative to Route Handlers for internal app mutations.
- [Client-side Fetching (SWR / React Query)](../level_05/client_fetching.md) — Related concept: Client-side Fetching (SWR / React Query).
- [Dynamic Route Handlers](dynamic_route_handlers.md) — Related concept: Dynamic Route Handlers.
- [HTTP Methods (GET, POST, PUT, DELETE)](http_methods.md) — Related concept: HTTP Methods (GET, POST, PUT, DELETE).
- [Middleware vs Route Handlers](middleware_vs_route_handlers.md) — Related concept: Middleware vs Route Handlers.
- [Draft Mode](../level_10/draft_mode.md) — Related concept: Draft Mode.
- [Edge Runtime vs Node.js Runtime](../level_10/edge_runtime.md) — Related concept: Edge Runtime vs Node.js Runtime.
- [Caching Route Handlers](caching_route_handlers.md) — Caching Route Handlers.
- [Middleware (`middleware.ts`)](../level_10/middleware.md) — Related concept: Middleware (`middleware.ts`).

---

## 7. Key Takeaways
- **Route Handlers** (`route.ts`) are the App Router's way of creating API endpoints.
- You define them by exporting named HTTP methods (`GET`, `POST`, `DELETE`, etc.).
- They rely entirely on standard Web APIs (`Request` and `Response`) rather than Node-specific objects.
- A folder cannot contain both a `route.ts` and a `page.tsx` because a single URL cannot resolve to two different things.
