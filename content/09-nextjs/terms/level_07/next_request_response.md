# `NextRequest` & `NextResponse`

> **Level 7 — API & Route Handlers**
> Next.js specific extensions of the native Web `Request` and `Response` objects that provide helper methods for reading cookies, redirecting, and manipulating URLs.

---

## 1. Prerequisites
- [Route Handlers (`route.ts`)](../level_07/route_handlers.md) — The primary place these objects are used.
- [JavaScript Fetch API](../level_05/js_fetch.md) — The standard interface being extended.

---

## 2. Term Category
- **API Helpers**

---

## 3. Environment Context
- **Server Only (Route Handlers & Middleware)**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Setting Cookies

**Problem:** How do you set a cookie inside a Route Handler response?

**Expected output:**
> [!check]- Answer
> ```ts
> export async function POST() {
>   // Create a base response
>   const response = NextResponse.json({ success: true });
>   
>   // Use the cookies API to attach the Set-Cookie header!
>   response.cookies.set('theme', 'dark', { secure: true });
>   
>   return response;
> }
> ```
> - Just like `NextRequest.cookies.get`, `NextResponse` has a `.cookies.set` method.

---

### Exercise 2: NextResponse Cookie Setting Pattern

**Problem:** Write Route Handler setting HttpOnly cookie `'token'` using `NextResponse` response cookies helper.

**Expected output:**
> [!check]- Answer
> ```typescript
> import { NextResponse } from 'next/server'; const res = NextResponse.json({ success: true }); res.cookies.set('token', 'val', { httpOnly: true, secure: true }); return res;
> ```
> - `NextResponse` provides `.cookies.set()` helper methods.
> 
> ```typescript
> import { NextResponse } from 'next/server';
> 
> export async function POST() {
>   const response = NextResponse.json({ success: true });
>   response.cookies.set('token', 'secret-val', {
>     httpOnly: true,
>     secure: true,
>     sameSite: 'strict'
>   });
>   return response;
> }
> ```

---

### Exercise 3: NextResponse.rewrite Method

**Problem:** What is the difference between `NextResponse.redirect()` and `NextResponse.rewrite()`?

**Expected output:**
> [!check]- Answer
> ```text
> redirect() changes the browser URL location; rewrite() serves target content while preserving the original browser URL location.
> ```
> - `redirect()` -> Updates browser URL address.
> - `rewrite()` -> Proxies content while keeping browser URL intact.
> 
> ```typescript
> return NextResponse.rewrite(new URL('/proxy-path', req.url));
> ```


---

## 7. Related Terms
- [Route Handlers (`route.ts`)](../level_07/route_handlers.md) — Where these objects are used.
- [Middleware](../level_10/middleware.md) — The other Next.js feature that heavily relies on `NextRequest` and `NextResponse`.

---

## 8. Key Takeaways
- **`NextRequest`** extends the native Web Request object, adding easy access to `.cookies` and `.nextUrl`.
- **`NextResponse`** extends the native Web Response object, adding helper methods like `NextResponse.json()` and `NextResponse.redirect()`.
- They are imported from `next/server`.
- They are primarily used in Route Handlers (`route.ts`) and Middleware, NOT in React Components or Server Actions.
