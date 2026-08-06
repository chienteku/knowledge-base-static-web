# Authentication & Session Management

> **Level 10 — Advanced Architecture**
> The design patterns and secure storage mechanisms (like secure cookies and JWTs) used to verify user identities and maintain logged-in states across page requests.

---

## 1. Prerequisites
- [`cookies()` and `headers()` from `next/headers`](../level_05/cookies_headers.md) — The mechanism used to read session identifiers.

---

## 2. Term Category

**Security & Middleware** (App Router Auth Patterns): Authentication in Next.js App Router combines middleware token validation, session cookies, and Server Action guards.



---

## 3. Explanation

### Environment Context
- **Universal** (Authentication credentials are submitted by the client browser, while session validation occurs on the server).

### (1) Design Motivation — "Why did we design this?"
HTTP is a **stateless** protocol. The server treats every incoming page request as completely independent. If a user logs in on `/login` and then clicks a link to visit `/dashboard`, the server has no memory of the previous login transaction.

**Session Management** solves this by establishing a persistent state bridge:
1.  **Authentication:** The user submits credentials (username/password), and the server validates them.
2.  **Session Creation:** The server generates a secure token (such as a session ID or signed JWT) and attaches it to the HTTP response using the `Set-Cookie` header.
3.  **Automatic Submission:** The browser receives the cookie and automatically attaches it to all subsequent requests to that domain. The server inspects the cookie on every request to resolve the user's identity.

In Next.js, this check commonly occurs inside `middleware.ts` to redirect unauthenticated visitors away from private routes.

---

### (2) Cookie-based Sessions vs. JWTs
Two main patterns exist for maintaining session states:

-   **Session ID (Stateful):** The server generates a random string and stores it in a fast database cache (like Redis). The cookie only holds the ID string. The server queries the database on every request to look up user details.
-   **JSON Web Token / JWT (Stateless):** The server encodes user details (e.g., user ID, username) into a signed cryptographic token. The token string is stored inside the browser's cookie. The server validates the cryptographic signature on every request to verify integrity, skipping database lookups.

---

### (3) Security Constraints: XSS and CSRF
To secure session tokens in production, cookies must be configured with specific attributes:
-   **`httpOnly`:** Prevents client-side JavaScript from reading the cookie. This protects the session token from being stolen via Cross-Site Scripting (XSS) script injections.
-   **`secure`:** Enforces that the cookie is only transmitted over encrypted HTTPS connections, protecting it from network eavesdropping.
-   **`sameSite="lax"` or `"strict"`:** Limits cookie transmission on cross-site requests, protecting the user from Cross-Site Request Forgery (CSRF) click attacks.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Storing session tokens inside browser `localStorage`

**The mistake:** Storing JWT tokens in local storage and sending them manually inside HTTP fetch header request bodies:

```typescript
// BAD: Accessible to malicious scripts!
localStorage.setItem('token', token);
```

**Why it's wrong:** `localStorage` has no security boundaries. Any JavaScript running on the page (including third-party scripts, Google Tag Manager scripts, or injected malicious code) can call `localStorage.getItem('token')` and send the token to an attacker.

**Golden Rule:** Always store session tokens inside **`httpOnly` secure cookies** to protect them from browser script access.

---

### Mistake 2: Storing JWT Session Tokens inside Browser `localStorage` (XSS Security Vulnerability)

**The mistake:** Writing `localStorage.setItem('token', jwtToken)` in Client Components.

**Why it's wrong:** `localStorage` is accessible to all client-side JavaScript. Cross-Site Scripting (XSS) attacks can extract tokens from localStorage. Store session tokens in `HttpOnly`, `SameSite=Strict`, `Secure` cookies.

*Incorrect:*
```typescript
localStorage.setItem('session', token); // ❌ Vulnerable to XSS token theft!
```

*Fix:*
```typescript
// Set token in HttpOnly cookie inside Server Action or Route Handler:
cookies().set('session', token, { httpOnly: true, secure: true, sameSite: 'strict' });
```

---

### Mistake 3: Relying Exclusively on Middleware for Route Authorization (Security Bypass Trap)

**The mistake:** Guarding `/api/delete-user` route inside `middleware.ts` only, omitting session checks inside the Route Handler itself.

**Why it's wrong:** Misconfigured middleware matchers or path encoding bypasses can allow un-authenticated requests to reach backend Route Handlers or Server Actions. ALWAYS re-verify sessions inside actions/handlers.

*Incorrect:*
```tsx
/* Relying solely on middleware.ts without checking session in Server Action */
```

*Fix:*
```tsx
/* Verify user session INSIDE Server Actions and Route Handlers directly */
```


---

## 5. Practice Exercises

### Exercise 1: Protecting Private Routes in Middleware

**Scenario:**
Create `middleware.ts` to redirect unauthenticated requests to `/login` when accessing `/dashboard/**`.

**Requirements:**
1. Check session cookie and call `NextResponse.redirect()`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // middleware.ts
> import { NextResponse } from "next/server";
> import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("session_token")?.value;

  if (!token && req.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}
```

> #### Technical Explanation
>
> 1. `middleware.ts` executes on every request before routing logic or page rendering begins.
> 2. Inspecting session cookies in middleware prevents unauthorized users from downloading dynamic route code chunks.
> 3. Centralized authentication guard pattern.

---

### Exercise 2: Validating Auth State in Server Components

**Scenario:**
Verify user session state inside a Server Component and redirect if session token is expired.

**Requirements:**
1. Import `cookies` from `next/headers` and `redirect` from `next/navigation`.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> import { cookies } from "next/headers";
> import { redirect } from "next/navigation";
> import { verifySession } from "@/lib/auth";

export default async function ProtectedPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;
  const user = token ? await verifySession(token) : null;

  if (!user) {
    redirect("/login");
  }

  return <h1>Welcome back, {user.name}</h1>;
}
```

> #### Technical Explanation
>
> 1. Server Components inspect session cookies and database user roles on the Node.js server.
> 2. `redirect()` halts execution immediately if session validation fails.
> 3. Double-layer defense in depth security strategy.

---

### Exercise 3: Handling Auth Tokens in Server Actions

**Scenario:**
Verify user authentication and authorization roles before executing a database mutation inside a Server Action.

**Requirements:**
1. Validate auth token inside Server Action before mutation.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> "use server";

import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";

export async function deletePostAction(postId: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;
  const user = token ? await verifySession(token) : null;

  if (!user || user.role !== "ADMIN") {
    throw new Error("Unauthorized: Admin privileges required.");
  }

  // Delete post from database...
}
```

> #### Technical Explanation
>
> 1. Server Actions are public HTTP endpoints; ALWAYS validate authentication and authorization roles inside action bodies.
> 2. Never trust client-sent parameters without server-side validation.
> 3. Essential secure action mutation pattern.

---




---

## 6. Related Terms
- [`cookies()` and `headers()` from `next/headers`](../level_05/cookies_headers.md) — The server-side cookies reader API.
- [Middleware (`middleware.ts`)](middleware.md) — The global routing checkpoint.

---

## 7. Key Takeaways
- Session Management bridges the stateless gap of HTTP communication.
- Authentication verifies credentials; Session Management maintains logged-in state.
- Stateful sessions store session metadata on the database; Stateless JWTs sign and store data in the cookie.
- Set `httpOnly` and `secure` cookie flags to prevent XSS script thefts.
- Never store sensitive authentication tokens inside browser `localStorage`.
