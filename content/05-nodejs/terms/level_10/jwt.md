# JWT (JSON Web Tokens)

> **Level 10 — Security & Production**
> A secure, digital ID badge used by modern applications to prove a user's identity without forcing the server to remember who is logged in.

---

## 1. Prerequisites
- [REST (Representational State Transfer)](../../../04-apis/terms/level_03/rest.md) — JWTs are what allow REST APIs to remain "Stateless".
- [JSON (JavaScript Object Notation)](../../../04-apis/terms/level_01/json.md) — The entire token is just encoded JSON data.

---

## 2. Term Category

**Security / Authentication Standard (Full Stack)**: JWT (JSON Web Tokens) is a fundamental concept in this technology stack. **Level 10 — Security & Production**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Historically, servers used "Sessions." When Bob logged in, the server wrote "Bob is logged in" into its RAM. This is fine for one server, but if you have 10 servers, Server #2 doesn't know Bob is logged in!
**JWTs** solve this by making the server **Stateless**.
When Bob logs in, the server generates a cryptographically signed "badge" (a JWT) and hands it to Bob. The server then completely forgets who Bob is. 
Every time Bob wants to view his profile, he sends the JWT to the server. The server verifies the cryptographic signature on the badge, trusts it, and grants access.

### (2) What is inside a JWT?
A JWT looks like a massive string of gibberish separated by two periods: `xxxx.yyyy.zzzz`
It has three parts:
1. **Header (`xxxx`):** Tells the server what algorithm was used to sign the badge (e.g., HMAC SHA256).
2. **Payload (`yyyy`):** The actual JSON data! (e.g., `{ "userId": 12, "role": "admin" }`).
3. **Signature (`zzzz`):** The cryptographic seal. It is created by combining the Header, the Payload, and a **Secret Password** that only the server knows.

### (3) The Magic of the Signature
**ANYONE** can decode the Payload of a JWT. It is just Base64 encoded text. It is NOT encrypted.
However, if a hacker decodes the JWT, changes `"role": "user"` to `"role": "admin"`, and sends it back to the server, the server will reject it! Why? Because altering the payload breaks the mathematical Signature. 
Unless the hacker knows the server's Secret Password, they cannot generate a valid signature for the altered payload.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Storing secrets in the Payload

**The mistake:** A developer stores a user's credit card number or raw password inside the JWT payload: `{ "userId": 12, "cc": "4111-1111..." }`.

**Why it's wrong:** JWTs are **SIGNED**, not **ENCRYPTED**. Anyone who intercepts the token (or steals it from the browser) can simply copy/paste it into `jwt.io` and instantly read the JSON data inside. 
**Golden Rule:** Never put sensitive data inside a JWT. Only put public identifiers (like `userId` or `role`).

---



### Mistake 2: Storing Sensitive Data (Passwords, Social Security Numbers) in JWT Payloads

**The mistake:** Including user passwords or private database keys in JSON Web Token payloads.

**Why it's wrong:** JWT tokens are Base64URL-encoded, NOT encrypted! Anyone with the token can decode and read all payload properties in plain text. Store only non-sensitive identifiers (e.g. `userId`).

*Incorrect:*
```javascript
const token = jwt.sign({ userId: 1, passwordHash: user.hash }, secret); // ❌ Plaintext readable!
```

*Fix:*
```javascript
const token = jwt.sign({ userId: 1, role: user.role }, secret); // Non-sensitive claims only
```

### Mistake 3: Storing JWT Access Tokens in Un-Protected Browser `localStorage` (XSS Attack Vector)

**The mistake:** Storing JWT auth tokens in browser `localStorage.setItem('token', token)`.

**Why it's wrong:** Any XSS vulnerability allows malicious scripts to read `localStorage` and steal user JWT tokens. Store refresh tokens in `httpOnly`, `secure`, `sameSite` cookies.

*Incorrect:*
```javascript
localStorage.setItem('jwt', token); // ❌ Vulnerable to XSS token theft!
```

*Fix:*
```javascript
res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'strict' });
```

## 5. Practice Exercises

### Exercise 1: JWT HMAC-SHA256 Signer & Verifier Engine

**Scenario:** Signs and verifies JSON Web Tokens (JWT) using `crypto.createHmac` for Base64URL encoded `Header.Payload.Signature` strings.

**Requirements:**
1. Write signJwt(payload, secretKey).
2. Write verifyJwt(token, secretKey).
3. Enforce expiration check.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function base64UrlEncode(str) {
>   return Buffer.from(str).toString("base64url");
> }
>
> function signJwt(payload, secretKey) {
>   const cryptoLib = require("crypto");
>   const header = { alg: "HS256", typ: "JWT" };
>
>   const encodedHeader = base64UrlEncode(JSON.stringify(header));
>   const encodedPayload = base64UrlEncode(JSON.stringify(payload));
>
>   const signature = cryptoLib
>     .createHmac("sha256", secretKey)
>     .update(`${encodedHeader}.${encodedPayload}`)
>     .digest("base64url");
>
>   return `${encodedHeader}.${encodedPayload}.${signature}`;
> }
>
> function verifyJwt(token, secretKey) {
>   const cryptoLib = require("crypto");
>   const parts = token.split(".");
>   if (parts.length !== 3) throw new Error("INVALID_JWT_FORMAT");
>
>   const [encodedHeader, encodedPayload, signature] = parts;
>   const expectedSig = cryptoLib
>     .createHmac("sha256", secretKey)
>     .update(`${encodedHeader}.${encodedPayload}`)
>     .digest("base64url");
>
>   if (signature !== expectedSig) {
>     throw new Error("INVALID_JWT_SIGNATURE");
>   }
>
>   const payloadStr = Buffer.from(encodedPayload, "base64url").toString("utf-8");
>   return JSON.parse(payloadStr);
> }
>
> // Verification tests
> const token = signJwt({ sub: "user123", role: "admin" }, "my_secret_key");
> const payload = verifyJwt(token, "my_secret_key");
>
> console.assert(payload.sub === "user123", "Test 1 Failed: Decoded valid JWT payload");
> try {
>   verifyJwt(token, "wrong_secret");
>   console.assert(false, "Test 2 Failed");
> } catch (err) {
>   console.assert(err.message === "INVALID_JWT_SIGNATURE", "Test 2 Passed: Rejected invalid signature");
> }
> ```
>
> #### Technical Explanation
>
> 1. **JWT Structure**: 3 Base64URL parts separated by dots: `Header.Payload.Signature`.
> 2. **HMAC-SHA256 Algorithm**: Generates cryptographic signature using secret key to prevent payload tampering.
> 3. **Stateless Authentication**: JWTs allow servers to authenticate requests without performing session lookup queries in Redis/DB.
> 
---

### Exercise 2: JWT Refresh Token Rotation System

**Scenario:** Implements JWT refresh token rotation where consuming a refresh token issues a new short-lived Access Token and new Refresh Token.

**Requirements:**
1. Write rotateJwtRefreshToken(refreshToken, secretKey, refreshTokenStore).
2. Verify refresh token.
3. Issue new access & refresh tokens.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function rotateJwtRefreshToken(refreshToken, secretKey, refreshTokenStore = new Set()) {
>   if (!refreshTokenStore.has(refreshToken)) {
>     throw new Error("REFRESH_TOKEN_REUSE_OR_REVOKED");
>   }
>
>   const cryptoLib = require("crypto");
>   // Revoke old refresh token (Single-use token rotation!)
>   refreshTokenStore.delete(refreshToken);
>
>   const newAccessToken = "access_" + cryptoLib.randomBytes(8).toString("hex");
>   const newRefreshToken = "refresh_" + cryptoLib.randomBytes(8).toString("hex");
>
>   refreshTokenStore.add(newRefreshToken);
>
>   return {
>     accessToken: newAccessToken,
>     refreshToken: newRefreshToken
>   };
> }
>
> // Verification tests
> const store = new Set(["old_refresh_123"]);
> const result = rotateJwtRefreshToken("old_refresh_123", "secret", store);
>
> console.assert(store.has("old_refresh_123") === false, "Test 1 Failed: Old refresh token revoked");
> console.assert(store.has(result.refreshToken) === true, "Test 2 Failed: New refresh token stored");
> ```
>
> #### Technical Explanation
>
> 1. **Refresh Token Rotation**: Each refresh token can be used exactly ONCE to issue a new access token; old token is immediately invalidated.
> 2. **Re-use Detection Defense**: If an already-used refresh token is presented again, invalidate ALL tokens in family to stop token theft attacks.
> 3. **Short-Lived Access Tokens**: Access tokens expire quickly (15 min) while Refresh tokens remain valid longer (7 days).
> 
---

### Exercise 3: JWT Revocation Blacklist Store

**Scenario:** Checks incoming JWT unique identifiers (`jti` claim) against a Redis/memory revocation blacklist to support immediate token logout.

**Requirements:**
1. Write isJwtRevoked(jwtPayload, blacklistStore).
2. Extract `jti` claim.
3. Check if `jti` exists in blacklist.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function isJwtRevoked(jwtPayload = {}, blacklistStore = new Set()) {
>   const jti = jwtPayload.jti;
>   if (!jti) return false;
>
>   return blacklistStore.has(jti);
> }
>
> // Verification tests
> const blacklist = new Set(["revoked_token_999"]);
> console.assert(isJwtRevoked({ jti: "revoked_token_999" }, blacklist) === true, "Test 1 Failed: Token is revoked");
> console.assert(isJwtRevoked({ jti: "valid_token_111" }, blacklist) === false, "Test 2 Failed: Token is valid");
> ```
>
> #### Technical Explanation
>
> 1. **JWT `jti` (JWT ID) Claim**: Unique string identifier assigned to each issued JWT to support individual token tracking.
> 2. **Token Blacklisting**: Allows revoking specific stateless JWTs prior to their natural expiration time (e.g. on user logout).
> 3. **TTL Auto-Expiry in Redis**: Blacklist entries in Redis should be stored with a TTL matching the token's remaining lifespan.
## 6. Related Terms
- [Environment Variables (dotenv)](env_vars.md) — Where you store the Secret Password used to sign the JWTs.
- [Bcrypt (Password Hashing)](bcrypt.md) — The tool used to check the user's password *before* giving them the JWT.

---

## 7. Key Takeaways
- **JWTs** allow servers to be Stateless. The server doesn't remember who is logged in; the client proves who they are on every request.
- A JWT has 3 parts: Header, Payload (JSON data), and Signature (Security seal).
- The Payload is readable by **everyone**. It is not encrypted. Never store passwords in it.
- The Signature prevents hackers from altering the data inside the payload.
