# Session vs Token Authentication

> **Level 4 — Security & Authentication**
> Stateful server sessions vs stateless tokens — the core auth trade-off.

---

## 1. Prerequisites
- [Statelessness](../level_03/statelessness.md) — The REST constraint relating to request context.

---

## 2. Term Category
- **Security**

---

## 3. Environment Context
- **Universal**: Governs the authentication architecture design of modern web applications.

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
HTTP is a stateless protocol; every request is treated as a completely new connection. However, web applications must remember who you are after you log in. There are two primary architectural designs for managing logged-in user state across requests: **Stateful Session Authentication** and **Stateless Token Authentication**.

---

### (2) Stateful Session Authentication (The Traditional Way)
In a session-based system, the server takes full responsibility for remembering who is logged in.

```text
Client                                           Server
  │ ─── 1. Login Request (user/password) ───────> │
  │                                               │ [Creates Session in Database/Redis]
  │ <── 2. Response + Set-Cookie (Session ID) ─── │
  │                                               │
  │ ─── 3. Request (Cookie: Session ID) ────────> │ [Looks up Session ID in Database]
  ▼                                               ▼ [Verifies user is logged in]
```

- **How it works:**
  1. The user logs in. The server creates a session record in a fast database (like Redis) and assigns it a unique, random **Session ID**.
  2. The server sends the Session ID back to the browser inside an HTTP cookie (e.g. `Set-Cookie: session_id=abc123xyz`).
  3. On subsequent requests, the browser automatically attaches the cookie. The server receives the ID, looks it up in the database, and retrieves the active user object.
- **Pros:** **Immediate Revocation**. If a user's account is compromised, the server can instantly delete the session record, logging the user out globally.
- **Cons:** **Scaling issues**. As your app grows to millions of users, querying the database on *every single request* becomes a bottleneck. Scaling horizontally across multiple servers requires a centralized session database.

---

### (3) Stateless Token Authentication (The Modern Way)
In a token-based system, the client takes responsibility for holding their own credentials, usually in the form of a **JWT (JSON Web Token)**.

```text
Client                                           Server
  │ ─── 1. Login Request (user/password) ───────> │
  │                                               │ [Generates signed Token containing details]
  │ <── 2. Response (Token) ───────────────────── │
  │                                               │
  │ ─── 3. Request (Header: Bearer <Token>) ────> │ [Validates Token cryptographic signature]
  ▼                                               ▼ [Authorized without DB lookup!]
```

- **How it works:**
  1. The user logs in. The server constructs a data payload (e.g., `{ "userId": 42, "role": "admin" }`), cryptographically signs it with a secret key, and sends the resulting token back to the client.
  2. The client stores the token (in memory or storage) and manually attaches it to the request header (e.g., `Authorization: Bearer <token>`).
  3. The server receives the token, checks the signature using its secret key, and parses the data. It does not look anything up in a database.
- **Pros:** **Scales easily**. Servers do not store session records, allowing any independent server node to validate tokens immediately.
- **Cons:** **Revocation difficulty**. Once a token is issued, it is valid until it expires. Revoking a token early requires implementing a database-backed token blacklist, turning it back into a stateful system.

---

### (4) Reality Metaphor
- **Session Authentication** is like checking your coat at a **club coatroom**. The clerk hangs your coat on a rack (**server memory**) and hands you a plastic number tag (**Session ID**). When you return, they look up the tag to fetch the coat. If the database mapping is lost, your coat cannot be retrieved.
- **Token Authentication** is like putting on a **colored festival wristband**. You show your ID once, and the bouncer attaches a signed wristband to your arm. As you move through different doors, guards look at the wristband and stamp (**signature verification**). They do not look you up in a registry; they trust the wristband itself.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Storing sensitive user data inside a stateless JWT

**The mistake:** Placing user passwords or sensitive credit card details in a JWT payload, thinking that because it is signed, it is hidden.

**Why it's wrong:** JWT payloads are only **signed** (to prevent tampering), they are not **encrypted**. The payload is simply Base64 URL-encoded. Anyone who intercepts the token can decode it in milliseconds to read the plain-text contents.

---

### Mistake 2: Attempting to Store Session IDs in JWT Tokens (Hybrid Anti-Pattern)

**The mistake:** Wrapping a server-side session ID inside a JWT token payload.

**Why it's wrong:** Combines the worst of both worlds: adds JWT payload overhead while still requiring database session lookup on every request, defeating JWT statelessness.

*Incorrect:*
```http
/* Storing session ID in JWT while maintaining server database session table */
```

*Fix:*
```http
/* Choose Stateless JWT (verify signature) OR Stateful Session ID (lookup in Redis/DB) */
```

---

### Mistake 3: Failing to Provide Revocation Mechanisms for Stateless JWT Tokens

**The mistake:** Relying on stateless JWT tokens for security-critical admin actions without a revocation blacklist.

**Why it's wrong:** Stateless JWT tokens cannot be revoked before expiry. If an admin user is revoked or password changed, their active JWT remains valid until `exp` time.

*Incorrect:*
```http
/* No token revocation check on admin user deletion */
```

*Fix:*
```javascript
// Maintain token revocation blacklist in Redis for emergency token invalidation:
if (await redis.sismember('blacklisted_tokens', jti)) return res.status(401).send();
```


---

## 6. Practice Exercises

### Exercise 1: Architectural Analyst

**Problem:** Determine whether the application scenario is best suited for **Session-Based** or **Token-Based** authentication:

1. A high-security banking API where administrators must have the ability to instantly lock accounts and terminate active user sessions.
2. A microservices-based video platform where dozens of independent background servers must authorize user playback requests without hitting a main database.
3. A simple static website where users log in to read a blog dashboard.

> [!check]- Answer
> - 1. **Session-Based** (Stateless tokens cannot be revoked instantly without adding database checks).
> - 2. **Token-Based** (Saves massive database query overhead across independent service nodes).
> - 3. **Session-Based** (Simple, cookie-based, standard security).


---

### Exercise 2: Session vs Token Architectural Trade-Off Matrix

**Problem:** Compare Stateful Sessions vs Stateless Tokens across:
1. Server Memory Overhead
2. Instant Revocation Support
3. Cross-Domain Mobile API Support

**Expected output:**
```text
1. Sessions require DB/RAM storage; Tokens require zero server memory
2. Sessions support instant revocation; Tokens require expiration or blacklist
3. Tokens easily support mobile/cross-domain APIs; Sessions require cookie domain alignment
```

> [!check]- Answer
> ```text
> 1. Server Memory -> Sessions: High (DB/Redis), Tokens: Zero (Stateless)
> 2. Revocation      -> Sessions: Instant (Delete row), Tokens: Difficult (Wait for exp)
> 3. API Flexibility  -> Sessions: Cookie bound, Tokens: Authorization header friendly
> ```
> - **Explanation:** Sessions trade scalability for revocation control; Tokens trade revocation for stateless scaling.
---

### Exercise 3: Cookie-Based Session Security

**Problem:** Which 3 cookie security flags should be applied to session cookies in production?

**Expected output:**
```text
HttpOnly, Secure, SameSite=Strict (or Lax)
```

> [!check]- Answer
> ```http
> Set-Cookie: sid=abc123; HttpOnly; Secure; SameSite=Strict
> ```
> - **Explanation:** These 3 flags mitigate XSS token theft and CSRF attacks.
---

## 7. Related Terms
- [JWT (JSON Web Tokens)](./jwt.md) — The standard format for stateless tokens.
- [Cookies](../level_09/cookies.md) — The browser storage mechanism typically used to store session IDs.

---

## 8. Key Takeaways
- Session authentication is stateful; the server stores sessions and references them via a random cookie ID.
- Token authentication is stateless; the server signs user data into a token stored on the client.
- Sessions are easy to revoke immediately but hard to scale horizontally.
- Tokens scale easily and are CORS-friendly but are difficult to revoke before they expire.
- Never place passwords or sensitive secrets inside a JWT payload since the payload is only encoded, not encrypted.
