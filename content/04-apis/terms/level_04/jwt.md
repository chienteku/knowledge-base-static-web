# JWT (JSON Web Tokens)

> **Level 4 — Security & Authentication**
> A compact, digitally signed JSON object used as a secure token to prove a user's identity to a Stateless API.

---

## 1. Prerequisites
- [Statelessness](../level_03/statelessness.md) — The entire reason JWTs exist is because servers cannot remember who is logged in.
- [JSON (JavaScript Object Notation)](../level_01/json.md) — The format the token is built upon.

---

## 2. Term Category

**Security / Token Format (Universal Standard .)**: JWT (JSON Web Tokens) is a fundamental concept in this technology stack. **Level 4 — Security & Authentication**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In a [Stateless](../level_03/statelessness.md) architecture, the server has amnesia. If User Bob logs in, the Server doesn't save a session in its memory. Instead, the Server needs to hand Bob a "Movie Ticket" that Bob can show to the Server on all future requests.
But how does the Server know Bob didn't just forge the ticket? How does the Server know the ticket hasn't expired? 
We need a ticket that contains data (like `userId: 5`), but is mathematically impossible to forge. The industry standard solution is the **JSON Web Token (JWT)**.

### (2) Reality Metaphor
A JWT is like a Driver's License issued by the DMV.
1. It contains public information about you (Name, DOB).
2. It has an expiration date.
3. It has a holographic, cryptographic signature from the DMV. 
When a bouncer looks at your ID, they don't have to call the DMV to verify it. They just look at the holographic signature. If the signature is valid, they trust the public information printed on the card. 

### (3) The Anatomy of a JWT
A JWT looks like a long string of gibberish separated by two periods: `xxxx.yyyy.zzzz`. It has 3 parts:
1. **Header (`xxxx`)**: Tells the server what algorithm was used to sign the token.
2. **Payload (`yyyy`)**: The actual JSON data (e.g., `{"userId": 5, "role": "admin"}`). **This is NOT encrypted!** Anyone can decode this and read the JSON.
3. **Signature (`zzzz`)**: The Server takes the Header, the Payload, and a *Top Secret Password* (only known to the Server), and hashes them together. 

### (4) How it prevents forgery
Because the Payload is not encrypted, Bob can easily decode his JWT and change `"role": "user"` to `"role": "admin"`. 
However, when Bob sends the forged token to the Server, the Server will recalculate the Signature using its Top Secret Password. Because Bob changed the Payload but didn't know the Server's Secret Password to generate a new matching Signature, the math will fail. The Server will instantly know the token was tampered with and reject it!

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Putting sensitive data in the Payload

**The mistake:** A developer puts the user's password or credit card number inside the JWT payload: `{ "userId": 5, "password": "123" }`.

**Why it's wrong:** The Payload of a JWT is simply Base64 encoded, **not encrypted**. Anyone who intercepts the token (or even the user themselves looking in their own `localStorage`) can instantly read the payload. 
**Golden Rule:** NEVER put sensitive data in a JWT. Only put non-sensitive identifiers (like `userId` or `role`) that the server needs to quickly identify the user.

---

### Mistake 2: Storing Sensitive Passwords or PII Inside Unencrypted JWT Payloads

**The mistake:** Storing user passwords or credit card numbers in a JWT payload string.

**Why it's wrong:** JWT payload claims are **Base64URL encoded**, NOT encrypted! Anyone who intercepts the JWT token can decode payload claims using `atob()`.

*Incorrect:*
```javascript
// JWT payload containing secret password
jwt.sign({ userId: 5, password: 'mySecretPassword' }, SECRET); // ❌ Anyone can decode Base64 payload!
```

*Fix:*
```javascript
// Store non-sensitive identifier claims only:
jwt.sign({ userId: 5, role: 'user' }, SECRET, { expiresIn: '15m' });
```

---

### Mistake 3: Accepting `"alg": "none"` Signature Bypass in JWT Verification

**The mistake:** Using vulnerable JWT libraries that accept unsigned tokens with `"alg": "none"`.

**Why it's wrong:** Attackers modify JWT headers to `"alg": "none"` and strip the signature, bypassing signature validation and forging admin access.

*Incorrect:*
```javascript
// Vulnerable JWT verification accepting any algorithm
jwt.verify(token, key, { algorithms: ['HS256', 'none'] }); // ❌ Accepts forged unsigned tokens!
```

*Fix:*
```javascript
// Enforce explicit trusted algorithm whitelist
jwt.verify(token, key, { algorithms: ['HS256'] });
```


---

## 5. Practice Exercises

### Exercise 1: JSON Web Token (JWT) Encoder & Base64URL Sanitizer

**Scenario:** A lightweight JWT utility encodes JSON headers and payloads into base64url-encoded string pairs.

**Requirements:**
1. Write encodeJwtParts(headerObj, payloadObj).
2. Convert objects to base64url strings.
3. Return `header.payload` string.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function base64UrlEncode(obj) {
>   const jsonStr = JSON.stringify(obj);
>   const base64 = Buffer.from(jsonStr).toString("base64");
>   return base64
>     .replace(/=/g, "")
>     .replace(/\+/g, "-")
>     .replace(/\//g, "_");
> }
>
> function encodeJwtParts(headerObj, payloadObj) {
>   const encHeader = base64UrlEncode(headerObj || { alg: "HS256", typ: "JWT" });
>   const encPayload = base64UrlEncode(payloadObj || {});
>   return `${encHeader}.${encPayload}`;
> }
>
> // Verification tests
> const header = { alg: "HS256", typ: "JWT" };
> const payload = { sub: "usr-42", name: "Alice" };
>
> const jwtStr = encodeJwtParts(header, payload);
> console.assert(jwtStr.split(".").length === 2, "Test 1 Failed");
> console.assert(!jwtStr.includes("+") && !jwtStr.includes("/"), "Test 2 Failed: Base64URL must sanitize + and /");
> ```
>
> #### Technical Explanation
>
> 1. **JWT Structure**: JSON Web Tokens consist of 3 dot-separated parts: Header.Payload.Signature.
> 2. **Base64URL Encoding**: Variant of Base64 that replaces + with -, / with _, and omits = padding for URL safety.
> 3. **Payload Visibility**: JWT payloads are encoded, NOT encrypted; anyone can decode and read claims without secret key.
> 
---

### Exercise 2: JWT Signature Verification & Expiry Inspector

**Scenario:** A JWT parser verifies token expiration claims (`exp`) and signature match before granting API access.

**Requirements:**
1. Write verifyJwtClaims(jwtToken, mockSecret, mockCrypto).
2. Check exp claim.
3. Verify signature match.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function verifyJwtClaims(jwtToken, secret, mockCrypto) {
>   if (!jwtToken || typeof jwtToken !== "string") {
>     return { valid: false, error: "Malformed JWT" };
>   }
>
>   const parts = jwtToken.split(".");
>   if (parts.length !== 3) {
>     return { valid: false, error: "JWT must have 3 parts" };
>   }
>
>   const [encHeader, encPayload, signature] = parts;
>
>   const expectedSig = mockCrypto 
>     ? mockCrypto.sign(`${encHeader}.${encPayload}`, secret)
>     : `sig_${secret}`;
>
>   if (signature !== expectedSig) {
>     return { valid: false, error: "Invalid JWT Signature" };
>   }
>
>   const jsonStr = Buffer.from(encPayload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8");
>   const payload = JSON.parse(jsonStr);
>
>   const nowSeconds = Math.floor(Date.now() / 1000);
>   if (payload.exp && nowSeconds > payload.exp) {
>     return { valid: false, error: "JWT Expired" };
>   }
>
>   return { valid: true, payload };
> }
>
> // Verification tests
> const mockPayload = { sub: "u1", exp: Math.floor(Date.now() / 1000) + 3600 };
> const encPayload = Buffer.from(JSON.stringify(mockPayload)).toString("base64").replace(/=/g, "");
> const jwt = `header.${encPayload}.sig_mysecret`;
>
> const res = verifyJwtClaims(jwt, "mysecret");
> console.assert(res.valid === true && res.payload.sub === "u1", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Signature Verification**: Signature prevents tampering; modifying payload invalidates signature check.
> 2. **exp Claim**: Expiration time in Unix epoch seconds dictates token validity window.
> 3. **Algorithm Choice**: HMAC (HS256) uses shared symmetric key; RSA (RS256) uses public/private key pairs.
> 
---

### Exercise 3: JWT Permission Claim Extractor & RBAC Guard

**Scenario:** An API authorization guard inspects decoded JWT claims (`roles`, `permissions`) to control endpoint access.

**Requirements:**
1. Write authorizeJwtRoles(jwtPayload, requiredRole).
2. Check payload.roles array for requiredRole.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function authorizeJwtRoles(jwtPayload, requiredRole) {
>   if (!jwtPayload || !Array.isArray(jwtPayload.roles)) {
>     return { authorized: false, status: 403, error: "Missing roles in JWT" };
>   }
>
>   if (!jwtPayload.roles.includes(requiredRole)) {
>     return { authorized: false, status: 403, error: `Requires role: ${requiredRole}` };
>   }
>
>   return { authorized: true, status: 200 };
> }
>
> // Verification tests
> const payload = { sub: "u1", roles: ["USER", "ADMIN"] };
>
> console.assert(authorizeJwtRoles(payload, "ADMIN").authorized === true, "Test 1 Failed");
> console.assert(authorizeJwtRoles(payload, "SUPERADMIN").authorized === false, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Stateless Authorization**: JWT contains user roles directly, eliminating database queries per request.
> 2. **Role-Based Access Control (RBAC)**: Mapping claims (roles/permissions) to endpoint permissions.
> 3. **Claim Standard Names**: RFC 7519 defines standard claims: sub (subject), iss (issuer), exp (expiry), iat (issued at).
---

## 6. Related Terms
- [Basic & Bearer Authentication](basic_bearer_auth.md) — JWTs are sent in the `Authorization: Bearer <token>` header.
- [localStorage & sessionStorage](../level_09/web_storage.md) — The common (though sometimes risky) place to store JWTs on the client.
- [HTTP Headers](../level_02/http_headers.md) — Related concept: HTTP Headers.
- [Statelessness](../level_03/statelessness.md) — Related concept: Statelessness.
- [API Keys](api_keys.md) — Related concept: API Keys.
- [OAuth 2.0](oauth.md) — Related concept: OAuth 2.0.
- [OAuth Scopes](oauth_scopes.md) — Related concept: OAuth Scopes.
- [Session vs Token Authentication](session_vs_token_auth.md) — Related concept: Session vs Token Authentication.
- [Base64 Encoding](../level_07/base64.md) — Related concept: Base64 Encoding.
- [Cookies](../level_09/cookies.md) — Related concept: Cookies.

---

## 7. Key Takeaways
- A **JWT** is a string of characters containing a JSON payload and a cryptographic signature.
- It allows Stateless servers to verify a user's identity without looking up a session in a database.
- The payload is **readable by anyone**. Do not put secrets in it!
- The signature is what makes the JWT impossible to forge.
