# HTTP Methods (GET, POST, PUT, DELETE)

> **Level 7 — API & Route Handlers**
> The standard request action verbs used by the Hypertext Transfer Protocol to specify the desired action to be performed on a target web resource.

---

## 1. Prerequisites
- [Next.js Overview](../level_01/nextjs.md) — The parent framework that routes these actions.

---

## 2. Term Category

**Server & Edge API** (HTTP Method Handler Export): Route Handlers export named functions (`GET`, `POST`, `PUT`, `DELETE`, `PATCH`) corresponding to standard HTTP verbs.



---

## 3. Explanation

### Environment Context
- **Universal** (Triggered by client-side browser actions and processed by backend server routing engines).

### (1) Design Motivation — "Why did we design this?"
In early web design, client-server communication lacked structured protocols. If a page wanted to delete a user, it might send a GET request to `/delete-user?id=5`. If a web crawler (like Google's search bot) scanned the page and crawled all links, it would trigger all the delete endpoints, unintentionally wiping database records.

**HTTP Methods** (also known as HTTP Verbs) were created to standardize communication. They define semantic rules indicating the intent and safety of a request, allowing networks, proxies, and routers to handle requests securely and cache them optimized. Next.js maps these verbs directly to function exports inside Route Handlers.

---

### (2) Core HTTP Action Verbs
The most common methods used in web application development are:

-   **`GET`:** Request a representation of a resource. GET requests must be **safe** (they must only read data and make no modifications) and **idempotent** (making multiple identical requests returns the same result).
-   **`POST`:** Submit data to the server to create a new resource or execute a state-changing transaction. POST is neither safe nor idempotent.
-   **`PUT`:** Replace the entire target resource payload with the incoming request data. PUT is idempotent (running it 10 times results in the same state as running it once).
-   **`PATCH`:** Apply partial modifications to an existing resource (e.g., updating only a user's password).
-   **`DELETE`:** Remove the specified resource from the server.

---

### (3) Connection to Next.js Route Handlers
In Next.js, instead of checking `req.method === 'POST'` inside a single handler block, you export separate, capitalized functions named exactly after the HTTP verbs:

```typescript
// app/api/items/route.ts
import { NextResponse } from 'next/server';

// 1. Handles GET requests (Read)
export async function GET() {
  return NextResponse.json({ items: [] });
}

// 2. Handles POST requests (Create)
export async function POST(request: Request) {
  const body = await request.json();
  // Save item...
  return NextResponse.json({ success: true }, { status: 201 });
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using a GET request to mutate data or delete records

**The mistake:** Creating a route handler that deletes data inside a GET export:

```typescript
// app/api/delete-user/route.ts
// BAD: Deletes database records using GET!
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  await db.user.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
```

**Why it's wrong:** According to the HTTP protocol spec, GET requests must be read-only (safe). Because of this rule, web browsers prefetch links, proxies cache responses, and Next.js aggressively caches Route Handlers. If you perform a database write inside a GET handler, the action may trigger unexpectedly during link prefetching or be skipped entirely because Next.js returns a cached response.

**Golden Rule:** Always use `POST`, `PUT`, `PATCH`, or `DELETE` methods for any requests that perform state-changing writes on your database or server.

---

### Mistake 2: Exporting Lowercase HTTP Method Handlers in `route.ts` (`export async function get()`)

**The mistake:** Exporting lowercase handler names like `export async function get()` or `post()`.

**Why it's wrong:** Next.js Route Handlers map functions by exact **UPPERCASE** HTTP verb names (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `OPTIONS`). Lowercase function exports are ignored.

*Incorrect:*
```typescript
// app/api/route.ts
export async function get() {} // ❌ Lowercase function ignored by Next.js router!
```

*Fix:*
```typescript
// app/api/route.ts
export async function GET() {} // Uppercase HTTP verb export
```

---

### Mistake 3: Omitting CORS Handling for Preflight `OPTIONS` Requests in Route Handlers

**The mistake:** Accepting cross-origin `POST` requests without exporting an `OPTIONS` handler returning CORS headers.

**Why it's wrong:** Browsers send preflight `OPTIONS` HTTP requests prior to cross-origin requests. Missing `OPTIONS` handlers cause CORS errors on cross-domain fetch calls.

*Incorrect:*
```tsx
/* Missing OPTIONS handler for cross-origin client requests */
```

*Fix:*
```typescript
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST' }
  });
}
```


---

## 5. Practice Exercises

### Exercise 1: Exporting Multiple HTTP Verbs in a Single Route File

**Scenario:**
Export `GET`, `POST`, and `DELETE` handlers inside `app/api/products/route.ts`.

**Requirements:**
1. Export uppercase named functions (`GET`, `POST`, `DELETE`).

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // app/api/products/route.ts
> export async function GET() {
>   return Response.json([{ id: "1", title: "Product 1" }]);
> }

export async function POST(req: Request) {
  const body = await req.json();
  return Response.json({ created: body }, { status: 201 });
}

export async function DELETE(req: Request) {
  return Response.json({ message: "Product deleted" });
}
```

> #### Technical Explanation
>
> 1. Route Handlers export named functions matching HTTP verbs (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`).
> 2. Next.js automatically routes incoming requests to the matching exported function based on HTTP method.
> 3. Requests to unexported methods (e.g. `PUT`) automatically return HTTP `405 Method Not Allowed`.

---

### Exercise 2: Handling Preflight OPTIONS Requests

**Scenario:**
Export an `OPTIONS` handler to configure CORS (Cross-Origin Resource Sharing) headers for API clients.

**Requirements:**
1. Export `OPTIONS` handler setting `Access-Control-Allow-Origin`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> export async function OPTIONS() {
>   return new Response(null, {
>     status: 204,
>     headers: {
>       "Access-Control-Allow-Origin": "*",
>       "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
>       "Access-Control-Allow-Headers": "Content-Type, Authorization"
>     }
>   });
> }
> ```

> #### Technical Explanation
>
> 1. `OPTIONS` handlers respond to browser CORS preflight requests before cross-origin POST/PUT requests execute.
> 2. `status: 204` returns a No Content response with attached CORS header options.
> 3. Essential for public cross-origin API endpoints.

---

### Exercise 3: Validating HTTP Method Signatures with TypeScript

**Scenario:**
Type Route Handler HTTP methods using standard `NextRequest` and `Response` types.

**Requirements:**
1. Type parameters as `(req: NextRequest) => Promise<Response>`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const body = await req.json();
  return NextResponse.json({ updated: body });
}
```

> #### Technical Explanation
>
> 1. `NextRequest` extends standard Web `Request` with Next.js specific helper properties (`nextUrl`, `cookies`).
> 2. `NextResponse.json()` is the Next.js helper wrapper for constructing JSON responses.
> 3. Type-safe Route Handler declaration pattern.

---




---

## 6. Related Terms
- [Route Handlers (`route.ts`)](route_handlers.md) — The Next.js API endpoints that export these methods.
- [`NextRequest` & `NextResponse`](next_request_response.md) — The HTTP transaction objects.

---

## 7. Key Takeaways
- HTTP Methods indicate the semantic intent of client-server requests.
- `GET` requests must be safe, idempotent, and are cached by default.
- Use `POST` to submit data for resource creation or payment processing.
- `PUT` replaces a resource entirely; `PATCH` updates it partially.
- Next.js Route Handlers map HTTP methods directly to capitalized function exports.
