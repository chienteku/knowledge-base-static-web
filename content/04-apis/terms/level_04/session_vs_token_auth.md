# Session vs Token Authentication

> **Level 4 — Security & Authentication**
> Stateful server sessions vs stateless tokens — the core auth trade-off.

---

## 1. Prerequisites
- [Statelessness](../level_03/statelessness.md) — The REST constraint relating to request context.
- [JWT (JSON Web Tokens)](jwt.md) — JSON Web Token (JWT) vs session cookie authentication.

---

## 2. Term Category

**Security (Universal: Governs the authentication architecture design of modern web applications.)**: Session vs Token Authentication is a fundamental concept in this technology stack. **Level 4 — Security & Authentication**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Stateful Session vs Stateless Token Authenticator

**Scenario:** An API architecture benchmark evaluates stateful session lookup vs stateless JWT token validation.

**Requirements:**
1. Write authenticateStatefulSession(sessionId, sessionStore).
2. Write authenticateStatelessToken(jwtToken, secret).

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function authenticateStatefulSession(sessionId, sessionStore) {
>   if (!sessionId || !sessionStore.has(sessionId)) {
>     return { authenticated: false, type: "SESSION" };
>   }
>   return { authenticated: true, type: "SESSION", user: sessionStore.get(sessionId) };
> }
>
> function authenticateStatelessToken(jwtPayload) {
>   if (!jwtPayload || !jwtPayload.sub) {
>     return { authenticated: false, type: "TOKEN" };
>   }
>   return { authenticated: true, type: "TOKEN", userId: jwtPayload.sub };
> }
>
> // Verification tests
> const store = new Map([["sess_123", { userId: "usr-1" }]]);
> console.assert(authenticateStatefulSession("sess_123", store).authenticated === true, "Test 1 Failed");
> console.assert(authenticateStatelessToken({ sub: "usr-1" }).authenticated === true, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Stateful Session Auth**: Server stores session state in DB/Redis; client holds session ID cookie.
> 2. **Stateless Token Auth**: Server stores no state; client holds signed token (JWT) containing user claims.
> 3. **Revocation Comparison**: Sessions allow instant server-side revocation; JWT tokens require revocation blacklists until expiration.
> 
---

### Exercise 2: Session Invalidation Manager

**Scenario:** A backend session store implements instant session revocation across single or all user devices.

**Requirements:**
1. Write revokeUserSessions(userId, sessionStore).
2. Delete all sessions associated with userId.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function revokeUserSessions(userId, sessionStore = new Map()) {
>   let count = 0;
>   for (const [sessId, session] of sessionStore.entries()) {
>     if (session.userId === userId) {
>       sessionStore.delete(sessId);
>       count++;
>     }
>   }
>   return { revokedCount: count };
> }
>
> // Verification tests
> const store = new Map([
>   ["s1", { userId: "u1" }],
>   ["s2", { userId: "u1" }],
>   ["s3", { userId: "u2" }]
> ]);
>
> const res = revokeUserSessions("u1", store);
> console.assert(res.revokedCount === 2, "Test 1 Failed");
> console.assert(store.has("s3") === true, "Test 2 Failed: Other user sessions preserved");
> ```
>
> #### Technical Explanation
>
> 1. **Instant Revocation Advantage**: Stateful session stores allow instant revocation of compromised user sessions.
> 2. **Logout Functionality**: Deleting session record server-side immediately invalidates future client requests.
> 3. **Centralized Session Store**: Redis or Memcached centralize session storage across microservices.
> 
---

### Exercise 3: Memory & Scalability Trade-off Evaluator

**Scenario:** An API architect tool computes memory footprint overhead for 1 Million active sessions vs 1 Million JWT tokens.

**Requirements:**
1. Write estimateAuthOverhead(activeUserCount, sessionByteSize).
2. Calculate server RAM required for session store.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function estimateAuthOverhead(activeUserCount, sessionByteSize = 1024) {
>   const totalSessionBytes = activeUserCount * sessionByteSize;
>   const totalSessionMb = totalSessionBytes / (1024 * 1024);
>
>   return {
>     activeUsers: activeUserCount,
>     serverRamRequiredMb: Number(totalSessionMb.toFixed(2)),
>     jwtServerRamRequiredMb: 0
>   };
> }
>
> // Verification tests
> const res = estimateAuthOverhead(1_000_000);
> console.assert(res.serverRamRequiredMb > 950, "Test 1 Failed: ~976 MB RAM required for sessions");
> console.assert(res.jwtServerRamRequiredMb === 0, "Test 2 Failed: JWT server RAM is 0");
> ```
>
> #### Technical Explanation
>
> 1. **Scalability Trade-off**: Stateful sessions require server RAM (e.g. 1GB for 1M users); JWT requires 0 server RAM.
> 2. **Bandwidth Trade-off**: JWT tokens are larger (sent in every request header); Session cookies are small (32 bytes).
> 3. **Architecture Selection**: Use sessions for traditional web monoliths; use tokens for distributed microservices and mobile APIs.
---

## 6. Related Terms
- [JWT (JSON Web Tokens)](jwt.md) — The standard format for stateless tokens.
- [Cookies](../level_09/cookies.md) — The browser storage mechanism typically used to store session IDs.
- [Load Balancing](../level_10/load_balancing.md) — Related concept: Load Balancing.

---

## 7. Key Takeaways
- Session authentication is stateful; the server stores sessions and references them via a random cookie ID.
- Token authentication is stateless; the server signs user data into a token stored on the client.
- Sessions are easy to revoke immediately but hard to scale horizontally.
- Tokens scale easily and are CORS-friendly but are difficult to revoke before they expire.
- Never place passwords or sensitive secrets inside a JWT payload since the payload is only encoded, not encrypted.
