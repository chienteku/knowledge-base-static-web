# API Keys

> **Level 4 — Security & Authentication**
> A long, randomly generated string of characters used to identify and authenticate a specific application or developer calling an API.

---

## 1. Prerequisites
- [HTTP Headers](../level_02/http_headers.md) — The most common place to securely attach an API Key.
- [Statelessness](../level_03/statelessness.md) — Because APIs are stateless, the API Key must be sent on every single request.

---

## 2. Term Category

**Security / Authentication (Backend / Server-to-Server .)**: API Keys is a fundamental concept in this technology stack. **Level 4 — Security & Authentication**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
If you build a Weather API, you might want to charge companies $100 a month to use it. But since your API is on the public internet, anyone can send an HTTP request to it. How do you track who is making the request so you can bill them? How do you block hackers who try to send 1,000,000 requests a second and crash your servers?
You require developers to sign up for an **API Key**. It acts as a secret password for their application. The server checks the key on every request: "Oh, this is Netflix's key, let them in. Oh, this key doesn't exist in my database, reject the request with a `401 Unauthorized`."

### (2) Reality Metaphor
An API Key is like a VIP Backstage Pass at a concert. 
The security guard (the Server) doesn't care what your name is or what you are wearing. They only look at the lanyard around your neck. If the barcode on the VIP pass scans correctly, you get to go backstage. If you give your VIP pass to your friend, your friend gets in (which is why you must protect your pass!).

### (3) How it is transmitted
API Keys are usually passed in one of two ways:
1. **As an HTTP Header (Secure):** `x-api-key: 12345-ABCDE`
2. **As a Query Parameter (Less Secure):** `?api_key=12345-ABCDE` (This is less secure because query parameters are saved in server logs and browser histories).

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Hardcoding API Keys in the Frontend

**The mistake:** A developer signs up for a paid Google Maps API Key. They write `fetch('https://maps.googleapis.com?key=MY_SECRET_KEY')` directly in their React code and deploy it to the internet.

**Why it's wrong:** Frontend code runs on the user's computer. *Any* user can open Chrome DevTools, click the "Network" tab, and instantly see your `MY_SECRET_KEY` in plain text. A malicious user can steal your key, put it in their own app, and rack up a $50,000 AWS bill on your credit card!
**Golden Rule:** Never put secret API keys in Frontend code. If your Frontend needs weather data, your Frontend should call *your* secure Backend, and your Backend (which users cannot see) should use the API key to call the Weather API.

---

### Mistake 2: Hardcoding API Keys in Client-Side JavaScript Source Code

**The mistake:** Embedding secret API keys directly inside frontend React or mobile app source code.

**Why it's wrong:** Frontend bundles are compiled into plain text. Anyone can inspect your web app's bundle JS file and extract your secret API keys.

*Incorrect:*
```javascript
const STRIPE_SECRET_KEY = 'sk_live_51Nx...'; // ❌ Leaked in public browser bundle!
```

*Fix:*
```javascript
// Keep secret keys exclusively on backend server. Proxy client requests through your backend API server.
```

---

### Mistake 3: Using API Keys for End-User Authentication Instead of Service Identification

**The mistake:** Using a single API key to authenticate individual end-users logging into a web application.

**Why it's wrong:** API keys identify client applications/projects, not individual human user identities. Use JWT, OAuth2, or Sessions for user authentication.

*Incorrect:*
```http
/* Authenticating human user logins via shared project API Key */
```

*Fix:*
```http
/* Use OAuth2 / JWT bearer tokens for user identity management */
```


---

## 5. Practice Exercises

### Exercise 1: API Key Validation & Rate-Limit Tiering Middleware

**Scenario:** An API gateway authenticates incoming requests using `X-API-Key` headers and enforces rate limits according to subscription tiers.

**Requirements:**
1. Write authenticateApiKey(apiKeyHeader, keyRegistry).
2. Validate API Key existence.
3. Check subscription tier (BASIC vs ENTERPRISE).
4. Return client metadata.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function authenticateApiKey(apiKeyHeader, keyRegistry = new Map()) {
>   if (!apiKeyHeader || typeof apiKeyHeader !== "string") {
>     return { authenticated: false, status: 401, error: "Missing X-API-Key header" };
>   }
>
>   const keyData = keyRegistry.get(apiKeyHeader.trim());
>   if (!keyData || !keyData.active) {
>     return { authenticated: false, status: 403, error: "Invalid or inactive API Key" };
>   }
>
>   return {
>     authenticated: true,
>     status: 200,
>     client: {
>       clientId: keyData.clientId,
>       tier: keyData.tier,
>       rateLimitReqPerMin: keyData.tier === "ENTERPRISE" ? 1000 : 60
>     }
>   };
> }
>
> // Verification tests
> const registry = new Map([
>   ["key_basic_123", { clientId: "c1", tier: "BASIC", active: true }],
>   ["key_ent_999", { clientId: "c2", tier: "ENTERPRISE", active: true }]
> ]);
>
> const res1 = authenticateApiKey("key_basic_123", registry);
> console.assert(res1.authenticated === true && res1.client.rateLimitReqPerMin === 60, "Test 1 Failed");
>
> const res2 = authenticateApiKey("key_ent_999", registry);
> console.assert(res2.client.rateLimitReqPerMin === 1000, "Test 2 Failed");
>
> const res3 = authenticateApiKey("invalid_key", registry);
> console.assert(res3.status === 403, "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **API Key Purpose**: Identifies calling project/client rather than an individual logged-in human user.
> 2. **Header Transport**: API keys should be sent in HTTP headers (X-API-Key) rather than query parameters to prevent log leaks.
> 3. **Service Level Tiers**: Associates API keys with client quotas, rate limits, and access permissions.
> 
---

### Exercise 2: Constant-Time API Key Comparison Guard

**Scenario:** A security library uses constant-time string comparison to prevent timing side-channel attacks during API key validation.

**Requirements:**
1. Write timingSafeEqual(a, b).
2. Compare character by character without early return.
3. Return comparison boolean.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function timingSafeEqual(a, b) {
>   if (typeof a !== "string" || typeof b !== "string") return false;
>
>   let mismatch = a.length ^ b.length;
>   const len = Math.min(a.length, b.length);
>
>   for (let i = 0; i < len; i++) {
>     mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
>   }
>
>   return mismatch === 0;
> }
>
> // Verification tests
> console.assert(timingSafeEqual("secret123", "secret123") === true, "Test 1 Failed");
> console.assert(timingSafeEqual("secret123", "secret999") === false, "Test 2 Failed");
> console.assert(timingSafeEqual("short", "longerstring") === false, "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Timing Attack Vulnerability**: Standard `===` returns early on first byte mismatch, allowing attackers to guess secret keys by measuring response times.
> 2. **Constant-Time Comparison**: Processes all characters regardless of mismatches, ensuring constant execution time.
> 3. **Cryptographic Safety**: Mandatory practice in authentication verification functions to prevent side-channel leaks.
> 
---

### Exercise 3: Client vs Server API Key Exposure Auditor

**Scenario:** An API linter checks codebase configurations to ensure secret API keys are never exposed in browser frontend code.

**Requirements:**
1. Write auditApiKeyExposure(envVars).
2. Identify keys prefixed with `PUBLIC_` (safe for browser) vs `SECRET_` (backend only).

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function auditApiKeyExposure(envVarsObj) {
>   const violations = [];
>
>   for (const [key, value] of Object.entries(envVarsObj || {})) {
>     if (key.includes("SECRET") || key.includes("PRIVATE")) {
>       if (key.startsWith("NEXT_PUBLIC_") || key.startsWith("REACT_APP_")) {
>         violations.push({
>           key,
>           error: "CRITICAL: Secret key exposed in frontend bundle via public prefix!"
>         });
>       }
>     }
>   }
>
>   return {
>     safe: violations.length === 0,
>     violations
>   };
> }
>
> // Verification tests
> const unsafeEnv = {
>   "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY": "pk_test_123",
>   "NEXT_PUBLIC_STRIPE_SECRET_KEY": "sk_test_999"
> };
>
> const audit = auditApiKeyExposure(unsafeEnv);
> console.assert(audit.safe === false, "Test 1 Failed: Must flag secret key in public prefix");
> console.assert(audit.violations.length === 1, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Browser Key Exposure**: Anything compiled into frontend bundles (React, Vue, Next.js) can be extracted by users in DevTools.
> 2. **Publishable vs Secret Keys**: Publishable keys (e.g. Stripe PK) are safe for frontend; Secret keys (SK) must remain strictly on backend servers.
> 3. **Proxy Architecture**: Frontend apps call backend API routes which attach secret API keys server-side before forwarding requests.
---

## 6. Related Terms
- [Basic & Bearer Authentication](basic_bearer_auth.md) — Other methods of sending secrets in HTTP Headers.
- [JWT (JSON Web Tokens)](jwt.md) — While API Keys authenticate *Applications*, JWTs usually authenticate individual *Users*.
- [SSL/TLS & the Handshake](../level_01/ssl_tls_handshake.md) — Related concept: SSL/TLS & the Handshake.
- [OAuth Scopes](oauth_scopes.md) — Related concept: OAuth Scopes.

---

## 7. Key Takeaways
- An **API Key** is a secret string used to identify a program calling an API.
- It is primarily used for tracking usage, rate limiting, and billing.
- It must be sent on every request (usually via HTTP Headers).
- **NEVER** expose an API Key in frontend (React/Vue/Vanilla JS) code!
