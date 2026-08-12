# Access Token vs Refresh Token

> **Level 4 — Security & Authentication**
> Short-lived access token + long-lived refresh token pattern.

---

## 1. Prerequisites
- [Session vs Token Authentication](session_vs_token_auth.md) — The core stateful/stateless auth structures.
- [JWT (JSON Web Tokens)](jwt.md) — The signed token data format.

---

## 2. Term Category

**Security (Universal: Implemented across secure web portals, mobile apps, and single-page apps.)**: Access Token vs Refresh Token is a fundamental concept in this technology stack. **Level 4 — Security & Authentication**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Stateless JWT tokens present a security dilemma:
- If a token is valid for a long time (e.g. 30 days) and is stolen by a hacker, they have open access to the user's account because stateless tokens cannot be easily revoked.
- If a token is valid for a very short time (e.g. 15 minutes) to minimize damage, the user is logged out and forced to re-authenticate every 15 minutes, causing a poor user experience.

To solve this, the security industry developed the **Access Token + Refresh Token** design pattern.

---

### (2) Roles & Properties of the Tokens

#### 1. Access Token (The Door Key)
- **Lifespan:** Very short (typically 10 to 15 minutes).
- **Type:** Stateless signed JWT.
- **Storage:** Client-side memory or local state (never stored permanently).
- **Usage:** Sent in the `Authorization: Bearer <token>` header of every API request. It is checked by the server to authorize resources immediately.

#### 2. Refresh Token (The Voucher)
- **Lifespan:** Long (typically 7 to 30 days).
- **Type:** Stateful string identifier or signed token.
- **Storage:** Stored in a secure, **`HttpOnly` cookie** on the client to prevent access from malicious scripts.
- **Usage:** Kept idle and only sent to the `/api/refresh` endpoint when the client needs to request a new access token.

---

### (3) Request Lifecycle Flow

When the client's short-lived access token expires, the application refreshes it seamlessly behind the scenes:

```text
Client                                                   Server
  │                                                        │
  │ ── 1. GET /profile (Authorization: Expired JWT) ─────> │
  │                                                        │ [Token verification fails]
  │ <─ 2. Response (401 Unauthorized) ──────────────────── │
  │                                                        │
  │ ── 3. POST /refresh (Includes HTTP-Only Refresh Cookie) > │
  │                                                        │ [Verifies refresh token in DB]
  │ <─ 4. Response (New Access Token JWT) ──────────────── │
  │                                                        │
  │ ── 5. GET /profile (Authorization: New JWT) ─────────> │ [Authorized!]
  ▼                                                        ▼
```

#### Refresh Token Rotation (RTR)
To prevent stolen refresh tokens from being used indefinitely, servers use **token rotation**. Every time a client sends a refresh token, the server invalidates it, issuing a new refresh token alongside the new access token. If a refresh token is used twice, the server flags it as a theft attempt and invalidates the entire session family.

---

### (4) Reality Metaphor
- An **Access Token** is like a **plastic hotel room keycard**. It grants immediate entry to your room. However, for security, keycards are programmed to automatically deactivate after 24 hours. If you drop it, the finder only has a short window of time to exploit it.
- A **Refresh Token** is like a **VIP Booking Voucher** locked in your wallet. It cannot open any hotel doors directly, but if you take it to the front desk reception (**the `/refresh` endpoint**), the receptionist checks your voucher (**validates the token**) and hands you a brand-new 24-hour room keycard.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Storing the Refresh Token in `localStorage`

**The mistake:** Storing both the access token and the long-lived refresh token in browser `localStorage`.

**Why it's wrong:** `localStorage` is accessible by any JavaScript running on your page. If your site is compromised by a Cross-Site Scripting (XSS) attack, a hacker's script can read the refresh token and maintain unauthorized access to the user's account for weeks.

*Fix:* Keep the refresh token in an **`HttpOnly`** and **`Secure`** cookie. This prevents client-side JavaScript from accessing it, protecting it from theft.

---

### Mistake 2: Setting Long Lifespans on JWT Access Tokens

**The mistake:** Issuing JWT access tokens with a 30-day expiration time.

**Why it's wrong:** JWT access tokens are stateless and cannot be revoked without custom blacklists. If compromised, a 30-day token gives attackers a 30-day window. Use short-lived access tokens (15 mins) and long-lived refresh tokens.

*Incorrect:*
```javascript
// Generating access token with 30-day lifespan
jwt.sign({ userId: 123 }, SECRET, { expiresIn: '30d' }); // ❌ High vulnerability window!
```

*Fix:*
```javascript
// Short access token (15m) + secure refresh token strategy
jwt.sign({ userId: 123 }, ACCESS_SECRET, { expiresIn: '15m' });
```

---

### Mistake 3: Storing Refresh Tokens in LocalStorage (XSS Vulnerability)

**The mistake:** Saving refresh tokens in browser `localStorage` or `sessionStorage`.

**Why it's wrong:** Any Cross-Site Scripting (XSS) vulnerability allows malicious scripts to extract refresh tokens from `localStorage`. Store refresh tokens in `HttpOnly`, `SameSite=Strict` cookies.

*Incorrect:*
```javascript
localStorage.setItem('refreshToken', token); // ❌ Vulnerable to XSS token theft!
```

*Fix:*
```javascript
res.cookie('refreshToken', token, {
  httpOnly: true, // Prevents JS access
  secure: true,   // Requires HTTPS
  sameSite: 'strict'
});
```


---

## 5. Practice Exercises

### Exercise 1: Dual Token Generation & Rotation Handler

**Scenario:** An authentication server issues short-lived access tokens and long-lived refresh tokens, rotating refresh tokens on each refresh cycle.

**Requirements:**
1. Write refreshTokens(providedRefreshToken, tokenStore).
2. Verify refresh token validity.
3. Issue new access token and new refresh token.
4. Invalidate old refresh token.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function refreshTokens(providedRefreshToken, tokenStore = new Map()) {
>   if (!providedRefreshToken || !tokenStore.has(providedRefreshToken)) {
>     return { success: false, status: 401, error: "Invalid or revoked refresh token" };
>   }
>
>   const session = tokenStore.get(providedRefreshToken);
>   const now = Date.now();
>
>   if (now > session.expiresAt) {
>     tokenStore.delete(providedRefreshToken);
>     return { success: false, status: 401, error: "Refresh token expired" };
>   }
>
>   tokenStore.delete(providedRefreshToken);
>
>   const newAccessToken = `access_${session.userId}_${Date.now()}`;
>   const newRefreshToken = `refresh_${session.userId}_${Date.now()}`;
>
>   tokenStore.set(newRefreshToken, {
>     userId: session.userId,
>     expiresAt: now + 7 * 24 * 60 * 60 * 1000
>   });
>
>   return {
>     success: true,
>     status: 200,
>     accessToken: newAccessToken,
>     refreshToken: newRefreshToken,
>     expiresInSeconds: 900
>   };
> }
>
> // Verification tests
> const store = new Map([
>   ["valid_ref_123", { userId: "usr-42", expiresAt: Date.now() + 10000 }]
> ]);
>
> const res1 = refreshTokens("valid_ref_123", store);
> console.assert(res1.success === true && res1.accessToken.includes("usr-42"), "Test 1 Failed");
> console.assert(store.has("valid_ref_123") === false, "Test 2 Failed: Old refresh token must be revoked");
> console.assert(store.has(res1.refreshToken) === true, "Test 3 Failed: New refresh token must be stored");
> ```
>
> #### Technical Explanation
>
> 1. **Access Token Lifespan**: Short-lived access tokens (15 mins) minimize damage if intercepted.
> 2. **Refresh Token Lifespan**: Long-lived refresh tokens (7-30 days) allow seamless re-authentication without password re-entry.
> 3. **Refresh Token Rotation**: Issuing a new refresh token on every exchange invalidates stolen tokens if reused.
> 
---

### Exercise 2: Automatic Token Refresh Client Interceptor

**Scenario:** An API client automatically intercepts 401 Unauthorized responses, uses the refresh token to acquire a new access token, and retries original request.

**Requirements:**
1. Write makeAuthenticatedRequest(fetchFn, getAccessToken, refreshTokensFn).
2. Execute request.
3. If 401, refresh token and retry request once.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function makeAuthenticatedRequest(url, fetchFn, authState, refreshFn) {
>   let response = await fetchFn(url, authState.accessToken);
>
>   if (response.status === 401 && authState.refreshToken) {
>     const refreshRes = await refreshFn(authState.refreshToken);
>     if (refreshRes.success) {
>       authState.accessToken = refreshRes.accessToken;
>       authState.refreshToken = refreshRes.refreshToken;
>       response = await fetchFn(url, authState.accessToken);
>     }
>   }
>
>   return response;
> }
>
> // Verification tests
> const authState = { accessToken: "exp_token", refreshToken: "valid_ref" };
> let fetchCalls = 0;
>
> const mockFetch = async (url, token) => {
>   fetchCalls++;
>   if (token === "exp_token") return { status: 401 };
>   return { status: 200, data: "success" };
> };
>
> const mockRefresh = async (ref) => ({
>   success: true,
>   accessToken: "new_token",
>   refreshToken: "new_ref"
> });
>
> makeAuthenticatedRequest("/api/user", mockFetch, authState, mockRefresh).then(res => {
>   console.assert(res.status === 200, "Test 1 Failed");
>   console.assert(fetchCalls === 2, "Test 2 Failed: Request should retry once");
>   console.assert(authState.accessToken === "new_token", "Test 3 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Silent Auth Interception**: Interceptors handle token expiration transparently without interrupting user workflow.
> 2. **Single Retry Guard**: Retrying once prevents infinite loop request storms when refresh token is invalid.
> 3. **Token Synchronization**: Updates central client state with newly rotated tokens.
> 
---

### Exercise 3: Refresh Token Reuse Detection & Nuclear Revocation Guard

**Scenario:** A security monitor detects when a previously rotated refresh token is presented again, indicating potential theft, and revokes all user sessions.

**Requirements:**
1. Write handleRefreshTokenUsage(token, tokenStore, revokedSet).
2. If token is in revokedSet, revoke ALL active sessions for that user.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function handleRefreshTokenUsage(token, tokenStore, revokedTokensSet) {
>   if (revokedTokensSet.has(token)) {
>     const userId = revokedTokensSet.get(token);
>     for (const [k, session] of tokenStore.entries()) {
>       if (session.userId === userId) {
>         tokenStore.delete(k);
>       }
>     }
>     return { success: false, status: 403, error: "Security Alert: Refresh token reuse detected. All sessions revoked." };
>   }
>
>   if (!tokenStore.has(token)) {
>     return { success: false, status: 401, error: "Invalid token" };
>   }
>
>   const session = tokenStore.get(token);
>   tokenStore.delete(token);
>   revokedTokensSet.set(token, session.userId);
>
>   const newRef = `new_ref_${session.userId}_${Date.now()}`;
>   tokenStore.set(newRef, { userId: session.userId });
>
>   return { success: true, refreshToken: newRef };
> }
>
> // Verification tests
> const activeStore = new Map([["ref_1", { userId: "usr-99" }]]);
> const revokedMap = new Map();
>
> const step1 = handleRefreshTokenUsage("ref_1", activeStore, revokedMap);
> console.assert(step1.success === true, "Test 1 Failed");
>
> const step2 = handleRefreshTokenUsage("ref_1", activeStore, revokedMap);
> console.assert(step2.status === 403, "Test 2 Failed: Reuse must trigger security alert");
> console.assert(activeStore.size === 0, "Test 3 Failed: All sessions for user must be nuked");
> ```
>
> #### Technical Explanation
>
> 1. **Token Reuse Detection**: Tracking spent refresh tokens enables detecting theft when both legitimate user and attacker present tokens.
> 2. **Session Termination**: Revoking all user sessions forces re-authentication, protecting account integrity.
> 3. **OAuth 2.0 Security Best Practice**: Mandatory requirement in RFC 6819 for OAuth 2.0 refresh token rotation implementations.
---

## 6. Related Terms
- [Basic & Bearer Authentication](basic_bearer_auth.md) — The HTTP headers formatting access tokens.
- [OAuth 2.0](oauth.md) — The authorization framework standardizing access and refresh flows.

---

## 7. Key Takeaways
- The access/refresh pattern balances API performance with account security.
- Access tokens are short-lived, stateless JWTs used for every API call.
- Refresh tokens are long-lived, stateful strings stored in secure cookies to obtain new access tokens.
- Token rotation invalidates used refresh tokens to mitigate theft.
- Never store long-lived tokens in localStorage; use `HttpOnly` cookies to protect them from XSS scripts.
