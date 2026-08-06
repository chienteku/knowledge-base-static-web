# `NextRequest` & `NextResponse`

> **Level 7 — API & Route Handlers**
> Next.js specific extensions of the native Web `Request` and `Response` objects that provide helper methods for reading cookies, redirecting, and manipulating URLs.

---

## 1. Prerequisites
- [Route Handlers (`route.ts`)](route_handlers.md) — The primary place these objects are used.
- [JavaScript Fetch API](../level_05/js_fetch.md) — The standard interface being extended.

---

## 2. Term Category

**Server & Edge API** (NextRequest & NextResponse Extensions): `NextRequest` and `NextResponse` extend standard Web Request/Response objects with cookie helpers and URL rewriting.



---

## 3. Explanation

### Environment Context
- **Server Only (Route Handlers & Middleware)**

### (1) Design Motivation — "Why did we design this?"
Route Handlers use the standard Web `Request` object. If you want to read a cookie named "session" from a standard `Request`, you have to get the `Cookie` string header, split it by semicolons, loop through it, and find the key. It's tedious.
Similarly, if you want to redirect the user to a new URL, returning a standard `Response` requires you to manually set the `Location` header and HTTP 307 status code.
**`NextRequest`** and **`NextResponse`** extend the standard Web APIs with high-level convenience methods specifically designed for Next.js routing.

### (2) `NextRequest`
You can type the incoming request parameter as `NextRequest` to gain access to `.cookies` and `.nextUrl`.

```ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // 1. Easy Cookie Access
  const sessionToken = request.cookies.get('session')?.value;

  // 2. Easy URL Parsing (nextUrl is an advanced URL object)
  const searchParams = request.nextUrl.searchParams;
  const page = searchParams.get('page');

  return NextResponse.json({ session: sessionToken, page });
}
```

### (3) `NextResponse`
You use `NextResponse` to easily construct specific types of responses, like JSON, Redirects, or Rewrites.

```ts
import { NextResponse } from 'next/server';

export async function POST() {
  const success = false;

  if (!success) {
    // Easily redirect the user to a different URL
    // (Next.js automatically handles the 307 status and Location header)
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Easily return JSON (automatically sets Content-Type header)
  return NextResponse.json({ success: true });
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using `NextResponse.redirect()` instead of `redirect()` in Server Actions

**The mistake:** A developer tries to use `return NextResponse.redirect('/home')` inside a Server Action or a `page.tsx`.

**Why it's wrong:** `NextResponse` is specifically designed for **Route Handlers** (`route.ts`) and **Middleware**. If you return a `NextResponse` object from a React Component (`page.tsx`) or a Server Action, React will crash because it doesn't know how to render an HTTP Response object into the UI!
**Golden Rule:** In `page.tsx` or Server Actions, use `redirect()` from `next/navigation`. In `route.ts` or Middleware, return `NextResponse.redirect()` from `next/server`.

---

### Mistake 2: Using Standard Web `Request` Object Methods When Reading Next.js Specific Properties

**The mistake:** Parsing URL search parameters manually using string split operations on standard `req.url`.

**Why it's wrong:** `NextRequest` extends Web `Request` and provides helper properties like `req.nextUrl` (`req.nextUrl.searchParams`, `req.nextUrl.pathname`, `req.cookies`).

*Incorrect:*
```typescript
export async function GET(req: Request) {
  const query = req.url.split('?')[1].split('=')[1]; // ❌ Fragile string parsing!
}
```

*Fix:*
```typescript
import { NextRequest } from 'next/server';
export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q'); // Clean NextRequest API
}
```

---

### Mistake 3: Constructing Manual JSON Strings Instead of Using `NextResponse.json()`

**The mistake:** Writing `return new Response(JSON.stringify(data))` without specifying `Content-Type: application/json` headers.

**Why it's wrong:** `NextResponse.json(data)` automatically sets `Content-Type: application/json` headers and serializes object payloads cleanly.

*Incorrect:*
```typescript
return new Response(JSON.stringify({ status: 'ok' })); // ❌ Missing Content-Type header!
```

*Fix:*
```typescript
import { NextResponse } from 'next/server';
return NextResponse.json({ status: 'ok' }); // Sets headers & serializes JSON automatically
```


---

## 5. Practice Exercises

### Exercise 1: URL Rewriting with `NextResponse.rewrite()`

**Scenario:**
Rewrite request URL `/old-path` to `/new-path` without changing the visible browser URL bar using `NextResponse.rewrite()`.

**Requirements:**
1. Call `NextResponse.rewrite(new URL('/new-path', req.url))`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // middleware.ts
> import { NextResponse } from "next/server";
> import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname === "/old-docs") {
    return NextResponse.rewrite(new URL("/docs/v2", req.url));
  }
}
```

> #### Technical Explanation
>
> 1. `NextResponse.rewrite()` changes the destination target page while preserving the original URL in the browser bar.
> 2. Distinct from `NextResponse.redirect()` which changes the visible browser URL.
> 3. Useful for A/B testing, feature flags, and multi-tenant domain routing.

---

### Exercise 2: Reading and Writing Cookies with `NextRequest` & `NextResponse`

**Scenario:**
Read request cookie `token` and set response cookie `visited=true` in Middleware.

**Requirements:**
1. Access `req.cookies` and call `res.cookies.set()`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> import { NextResponse } from "next/server";
> import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("session_token")?.value;
  const res = NextResponse.next();

  res.cookies.set("visited", "true", {
    path: "/",
    httpOnly: true
  });

  return res;
}
```

> #### Technical Explanation
>
> 1. `NextRequest.cookies` reads incoming request cookie headers.
> 2. `NextResponse.cookies.set()` appends `Set-Cookie` headers to outgoing responses.
> 3. Simplifies HTTP cookie management in server interceptors.

---

### Exercise 3: Accessing Parsed URL Properties with `req.nextUrl`

**Scenario:**
Inspect query parameters `req.nextUrl.searchParams` and hostname `req.nextUrl.hostname` in `NextRequest`.

**Requirements:**
1. Access `req.nextUrl` properties.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const searchParam = req.nextUrl.searchParams.get("ref");
  const host = req.nextUrl.hostname;

  console.log(`[Middleware Log] ${host}${pathname}?ref=${searchParam}`);

  return NextResponse.next();
}
```

> #### Technical Explanation
>
> 1. `NextRequest.nextUrl` is an extended `URL` object with pre-parsed query string parameters and path segments.
> 2. Avoids manual string splitting or regex parsing of `req.url`.
> 3. Idiomatic Next.js URL inspection object.

---




---

## 6. Related Terms
- [Route Handlers (`route.ts`)](route_handlers.md) — Where these objects are used.
- [Middleware (`middleware.ts`)](../level_10/middleware.md) — The other Next.js feature that heavily relies on `NextRequest` and `NextResponse`.
- [HTTP Methods (GET, POST, PUT, DELETE)](http_methods.md) — Related concept: HTTP Methods (GET, POST, PUT, DELETE).

---

## 7. Key Takeaways
- **`NextRequest`** extends the native Web Request object, adding easy access to `.cookies` and `.nextUrl`.
- **`NextResponse`** extends the native Web Response object, adding helper methods like `NextResponse.json()` and `NextResponse.redirect()`.
- They are imported from `next/server`.
- They are primarily used in Route Handlers (`route.ts`) and Middleware, NOT in React Components or Server Actions.
