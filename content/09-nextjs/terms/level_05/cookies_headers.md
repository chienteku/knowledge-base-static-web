# `cookies()` and `headers()` from `next/headers`

> **Level 5 — Data Fetching**
> Server-only Next.js utility APIs used to inspect the incoming request's HTTP headers and cookies, dynamically opting the route into Server-Side Rendering (SSR).

---

## 1. Prerequisites
- [Dynamic Rendering (SSR)](../level_08/ssr.md) — The dynamic rendering strategy triggered by these APIs.
- [JavaScript Fetch API](js_fetch.md) — The request/response header context.

---

## 2. Term Category

**Server & Edge API** (Server Request Cookies & Headers): `cookies()` and `headers()` from `next/headers` read incoming HTTP request metadata inside Server Components and Server Actions.



---

## 3. Explanation

### Environment Context
- **Server Only** (HTTP headers and cookies are read exclusively on the server prior to HTML serialization).

### (1) Design Motivation — "Why did we design this?"
During build time, Next.js attempts to compile as many pages as possible into static HTML files to ensure fast delivery. However, websites frequently need to respond to request-specific data, such as:
-   Checking if a user is logged in by inspecting a session cookie.
-   Serving desktop vs. mobile layouts by reading the `User-Agent` header.
-   Redirecting users based on geo-location headers.

The **`cookies()`** and **`headers()`** utility functions were designed to allow Server Components to inspect this request data. 

Because HTTP headers change for every visitor and cannot be predicted in advance, calling either of these functions acts as a **Dynamic API**. When Next.js detects a call to `cookies()` or `headers()`, it dynamically opts the route out of Static optimization (SSG) and switches to Server-Side Rendering (SSR) at request time.

---

### (2) Core Concept — Reading Cookies and Headers
Both functions are imported from `next/headers` and can be called directly inside Server Components:

```typescript
// app/account/page.tsx (Server Component)
import { cookies, headers } from 'next/headers';
import React from 'react';

export default async function AccountPage() {
  // 1. Read cookies from incoming request
  const cookieStore = cookies();
  const sessionToken = cookieStore.get('session-token')?.value;

  // 2. Read headers from incoming request
  const headersList = headers();
  const userAgent = headersList.get('user-agent') || 'unknown';

  if (!sessionToken) {
    return <p>Access Denied. Please log in.</p>;
  }

  return (
    <main>
      <h1>Your Profile</h1>
      <p>Session Active: {sessionToken.substring(0, 8)}...</p>
      <p>Browser User-Agent: {userAgent}</p>
    </main>
  );
}
```

---

### (3) Read-Only Rule During Rendering
When rendering a component, the HTTP response headers have already been sent to the client's browser. Therefore, you can only **read** cookies and headers during component rendering. You cannot write or modify them.

If you need to **write** a cookie (e.g. log a user out or set a theme selection), you must do so inside a **Server Action** or **Middleware** where header manipulation is allowed.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Trying to write cookies inside a Server Component render loop

**The mistake:** Writing to `cookies()` during the component render phase:

```typescript
// app/theme/page.tsx (Server Component)
import { cookies } from 'next/headers';

export default function ThemePage() {
  // BAD: Throws a runtime error because headers are already sent!
  cookies().set('theme', 'dark'); 
  
  return <div>Theme saved!</div>;
}
```

**Why it's wrong:** React renders components after the HTTP response headers are locked. You cannot modify cookies or response headers during layout construction, throwing a runtime exception.

**Golden Rule:** Only read cookies and headers during component rendering. Use Server Actions or Middleware to write or delete them.

---

### Mistake 2: Attempting to Set Cookies via `cookies().set()` inside a Read-Only Server Component

**The mistake:** Calling `cookies().set('token', val)` inside an async Server Component page.

**Why it's wrong:** In Next.js App Router, cookies can be read (`cookies().get()`) inside Server Components, but can ONLY be written/mutated inside **Server Actions** or **Route Handlers**.

*Incorrect:*
```typescript
// app/page.tsx (Server Component)
import { cookies } from 'next/headers';
export default async function Page() {
  cookies().set('theme', 'dark'); // ❌ Error: Cookies can only be modified in Server Actions or Route Handlers!
}
```

*Fix:*
```typescript
// Mutate cookies in Server Actions ('use server') or Route Handlers (route.ts):
'use server';
import { cookies } from 'next/headers';
export async function updateTheme(theme: string) {
  cookies().set('theme', theme);
}
```

---

### Mistake 3: Importing `cookies()` or `headers()` from `next/router` or `next/navigation`

**The mistake:** Writing `import { cookies } from 'next/navigation'`.

**Why it's wrong:** `cookies()` and `headers()` MUST be imported from `next/headers`. Importing from incorrect modules throws build errors.

*Incorrect:*
```typescript
import { cookies } from 'next/navigation'; // ❌ Incorrect module import!
```

*Fix:*
```typescript
import { cookies, headers } from 'next/headers'; // Correct import
```


---

## 5. Practice Exercises

### Exercise 1: Reading Request Cookies in Server Components

**Scenario:**
Read session token cookies inside an async Server Component using `cookies()`.

**Requirements:**
1. Import `cookies` from `next/headers`.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> // app/dashboard/page.tsx
> import { cookies } from "next/headers";

export default async function Dashboard() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_id");

  return (
    <main className="p-6">
      <p>Session Cookie: {token?.value ?? "Not Logged In"}</p>
    </main>
  );
}
```

> #### Technical Explanation
>
> 1. `cookies()` reads incoming request HTTP cookie headers on the Node.js server.
> 2. In Next.js 15, `cookies()` returns a Promise that is resolved via `await cookies()`.
> 3. Invoking `cookies()` opts the route segment into dynamic SSR rendering.

---

### Exercise 2: Setting Cookies inside Server Actions

**Scenario:**
Set a secure HTTP-only session cookie inside a login Server Action using `cookies().set()`.

**Requirements:**
1. Execute `cookies().set(name, value, options)` in Server Action.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // app/actions/auth.ts
> "use server";

import { cookies } from "next/headers";

export async function loginAction(formData: FormData) {
  const email = formData.get("email");
  // Validate credentials...

  const cookieStore = await cookies();
  cookieStore.set("session_token", "sec_token_999", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/"
  });
}
```

> #### Technical Explanation
>
> 1. `cookies().set()` appends `Set-Cookie` response headers to HTTP responses.
> 2. `httpOnly: true` prevents browser client-side JavaScript access to sensitive cookies.
> 3. Can ONLY be called inside Server Actions or Route Handlers (read-only inside Server Components).

---

### Exercise 3: Inspecting Request Headers in Route Handlers

**Scenario:**
Inspect `Authorization` and `User-Agent` headers inside an API Route Handler using `headers()`.

**Requirements:**
1. Import `headers` from `next/headers`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // app/api/secure-data/route.ts
> import { headers } from "next/headers";

export async function GET() {
  const headersList = await headers();
  const authHeader = headersList.get("authorization");
  const userAgent = headersList.get("user-agent");

  if (!authHeader?.startsWith("Bearer ")) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  return Response.json({ userAgent, status: "Authorized" });
}
```

> #### Technical Explanation
>
> 1. `headers()` from `next/headers` exposes read-only incoming HTTP request headers.
> 2. `headersList.get('header-name')` performs case-insensitive header lookup.
> 3. Standard method for validating authorization tokens in Route Handlers.

---




---

## 6. Related Terms
- [Dynamic Rendering (SSR)](../level_08/ssr.md) — The dynamic rendering strategy triggered by these APIs.
- [Middleware (`middleware.ts`)](../level_10/middleware.md) — The router proxy where cookies and headers can be written.
- [JavaScript Fetch API](js_fetch.md) — Related concept: JavaScript Fetch API.
- [Authentication & Session Management](../level_10/authentication_concepts.md) — Related concept: Authentication & Session Management.

---

## 7. Key Takeaways
- `cookies()` and `headers()` let Server Components inspect request-specific metadata.
- Calling them dynamically opts the route out of Static rendering (SSG) and into SSR.
- During rendering, cookies and headers are read-only.
- Modifying cookies or headers must occur in Server Actions or Middleware.
