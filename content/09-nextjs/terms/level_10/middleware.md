# Middleware (`middleware.ts`)

> **Level 10 — Advanced Architecture**
> A single file sitting at the very edge of your application that intercepts every incoming HTTP request before it reaches your routes or pages, used primarily for redirects, rewrites, and lightweight authentication.

---

## 1. Prerequisites
- [Middleware vs Route Handlers](../level_07/middleware_vs_route_handlers.md) — The conceptual difference between these two systems.
- [`NextRequest` & `NextResponse`](../level_07/next_request_response.md) — The core API used within this file.
- [Authentication & Session Management](authentication_concepts.md) — The primary purpose of route checkpointing.

---

## 2. Term Category

**Security & Middleware** (Global Server Request Interceptor): Middleware (`middleware.ts`) intercepts incoming server HTTP requests before routing, enforcing authentication, redirects, and headers.



---

## 3. Explanation

### Environment Context
- **Edge Runtime ONLY**

### (1) Design Motivation — "Why did we design this?"
If you want to support internationalization (`/en/about` vs `/fr/about`), you need to check the user's `Accept-Language` browser header and redirect them to the correct subfolder. 
If you want to protect your dashboard, you need to check if they have a valid session cookie before loading the `/dashboard` UI.
Doing this on a page-by-page basis is tedious and slow because the Node.js server has to fully boot up the React component tree just to realize it needs to redirect the user. 
**Middleware** runs on the ultra-fast Edge Runtime. It intercepts the request globally, checks the headers/cookies, and can instantly redirect the user before the Node.js server even knows the request happened.

### (2) The Syntax
You create a single file named `middleware.ts` at the root of your project (or inside `src/` if you use it).

```ts
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 1. Check for an auth cookie
  const token = request.cookies.get('auth_token');

  // 2. If the user is trying to access /admin but has no token...
  if (request.nextUrl.pathname.startsWith('/admin') && !token) {
    // 3. Immediately redirect them to login!
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 4. Otherwise, let the request pass through to the page normally.
  return NextResponse.next();
}
```

### (3) The Config Matcher
By default, `middleware.ts` runs on *every single request*—including requests for images (`/logo.png`), CSS files, and Next.js internal files. This is terrible for performance.
You should ALWAYS export a `config` object with a `matcher` array to limit which routes the Middleware applies to.

```ts
export const config = {
  // Only run Middleware on routes starting with /admin or /dashboard
  matcher: ['/admin/:path*', '/dashboard/:path*'],
};
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Trying to use Node.js Modules

**The mistake:** A developer imports `bcrypt` to verify a password hash inside the `middleware.ts` file. 

**Why it's wrong:** Middleware strictly runs on the **Edge Runtime** (like Cloudflare Workers). It is NOT a Node.js environment. Any library that relies on Node.js native modules (like `fs`, `crypto`, `bcrypt`, or heavy ORMs like `Prisma`) will crash the app.
**Golden Rule:** Middleware must be incredibly lightweight. If you need to do heavy cryptography or database lookups, you must do it in a Route Handler or Server Component, NOT in Middleware. Use lightweight web standard APIs (like `crypto.subtle` for JWT verification).

---

### Mistake 2: Placing `middleware.ts` inside Sub-Folders Instead of Project Root or `src/`

**The mistake:** Creating `app/middleware.ts` or `app/dashboard/middleware.ts`.

**Why it's wrong:** Next.js recognizes ONLY a SINGLE `middleware.ts` file located at the project ROOT directory (or inside `src/`). Placing it inside `app/` causes Next.js to ignore it.

*Incorrect:*
```tsx
// app/middleware.ts ❌ Ignored by Next.js compiler!
```

*Fix:*
```typescript
// middleware.ts (Root directory or src/middleware.ts)
```

---

### Mistake 3: Omitting `config.matcher` Resulting in Middleware Execution on Static Assets

**The mistake:** Writing `middleware.ts` without configuring `config.matcher`.

**Why it's wrong:** Without a matcher filter, middleware executes on EVERY request, including static images (`.png`), favicon, and `_next/static` JS chunks, degrading site performance.

*Incorrect:*
```tsx
// Missing config.matcher ❌ Executes on all static assets!
```

*Fix:*
```typescript
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
```


---

## 5. Practice Exercises

### Exercise 1: Authoring Centralized Server Middleware

**Scenario:**
Create `middleware.ts` to log incoming request paths and attach a custom response header `X-Request-Time`.

**Requirements:**
1. Export `middleware(req: NextRequest)` in project root `middleware.ts`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // middleware.ts
> import { NextResponse } from "next/server";
> import type { NextRequest } from "next/server";
> 
> export function middleware(req: NextRequest) {
>   const res = NextResponse.next();
>   res.headers.set("X-Request-Time", Date.now().toString());
> 
>   console.log(`[Middleware] ${req.method} ${req.nextUrl.pathname}`);
>   return res;
> }
> ```
> 
> #### Technical Explanation
>
> 1. `middleware.ts` placed at the project root executes on every incoming server request before page/route resolution.
> 2. `NextResponse.next()` allows the request to continue to downstream page handlers while attaching custom response headers.
> 3. Central entry point for server request interception.
> 
---

### Exercise 2: Filtering Middleware Execution with `config.matcher`

**Scenario:**
Restrict `middleware.ts` execution strictly to `/dashboard/**` and `/api/protected/**` paths using `config.matcher`.

**Requirements:**
1. Export `const config = { matcher: [...] }`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> import { NextResponse } from "next/server";
> import type { NextRequest } from "next/server";
> 
> export function middleware(req: NextRequest) {
>   return NextResponse.next();
> }
> 
> export const config = {
>   matcher: ["/dashboard/:path*", "/api/protected/:path*"]
> };
> ```
> 
> #### Technical Explanation
>
> 1. `config.matcher` filters which URL paths trigger middleware execution.
> 2. Bypasses middleware execution for static assets (`/_next/static`, images, favicons).
> 3. Essential performance optimization to avoid unnecessary middleware runs on static files.
> 
---

### Exercise 3: Performing Conditional Redirects in Middleware

**Scenario:**
Redirect users attempting to access `/admin` without a `role=admin` cookie to `/unauthorized`.

**Requirements:**
1. Check `req.cookies.get('role')` and call `NextResponse.redirect()`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> import { NextResponse } from "next/server";
> import type { NextRequest } from "next/server";
> 
> export function middleware(req: NextRequest) {
>   const role = req.cookies.get("role")?.value;
> 
>   if (req.nextUrl.pathname.startsWith("/admin") && role !== "admin") {
>     return NextResponse.redirect(new URL("/unauthorized", req.url));
>   }
> }
> ```
> 
> #### Technical Explanation
>
> 1. `NextResponse.redirect()` issues an immediate HTTP 307 temporary redirect response.
> 2. Intercepts unauthorized requests before server rendering or database querying begins.
> 3. High performance server security guard.
> 
---


## 6. Related Terms
- [Edge Runtime vs Node.js Runtime](edge_runtime.md) — The restricted environment where Middleware runs.
- [`NextRequest` & `NextResponse`](../level_07/next_request_response.md) — The object used to trigger the redirects and rewrites.
- [`cookies()` and `headers()` from `next/headers`](../level_05/cookies_headers.md) — Related concept: `cookies()` and `headers()` from `next/headers`.
- [Middleware vs Route Handlers](../level_07/middleware_vs_route_handlers.md) — Related concept: Middleware vs Route Handlers.
- [Authentication & Session Management](authentication_concepts.md) — Related concept: Authentication & Session Management.
- [Internationalization (i18n)](i18n.md) — Related concept: Internationalization (i18n).
- [Route Handlers (`route.ts`)](../level_07/route_handlers.md) — Route Handlers.

---

## 7. Key Takeaways
- **Middleware** (`middleware.ts`) is a single, global interceptor for incoming HTTP requests.
- It is primarily used for Authentication checks, Internationalization routing, Redirects, and Rewrites.
- It runs on the **Edge Runtime**, meaning it is ultra-fast but CANNOT use Node.js modules or databases.
- You must export a `config.matcher` to prevent Middleware from running on static assets like images and CSS.
