# Basic & Bearer Authentication

> **Level 4 — Security & Authentication**
> The two most standard ways to format the HTTP `Authorization` header when sending secrets to an API.

---

## 1. Prerequisites
- [HTTP Headers](../level_02/http_headers.md) — These authentication schemes dictate exactly how to format the `Authorization` header.

---

## 2. Term Category

**Security / HTTP Standard (Universal Standard)**: Basic & Bearer Authentication is a fundamental concept in this technology stack. **Level 4 — Security & Authentication**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
When building a secure API, you need a way for the Client to say "Here is my password/token."
You *could* invent your own custom header, like `X-My-Super-Secret-Token: 12345`. But if every developer invents their own headers, tools like Postman and browser security systems can't standardize how they handle logins.
The W3C established the `Authorization` header as the single, universal place to put credentials. To tell the server *what kind* of credential you are sending, they created standard "Schemes": **Basic** and **Bearer**.

### (2) Basic Authentication
Basic Auth is the oldest and simplest form of web authentication. 
You take the user's `username` and `password`, combine them with a colon (`username:password`), and encode the result using Base64 (a simple algorithm that turns text into gibberish). 
The header looks like this:
```http
Authorization: Basic dXNlcm5hbWU6cGFzc3dvcmQ=
```
**Warning:** Base64 is *not* encryption. Anyone can instantly decode it back into plain text. Basic Auth is incredibly dangerous unless used over a secure HTTPS connection!

### (3) Bearer Authentication
Bearer Auth is the modern standard for APIs. 
Instead of sending a username and password on every request, the user logs in *once*. The Server hands back a complex, encrypted Token (like a [JWT](../level_04/jwt.md)).
For all future requests, the Client sends the token using the `Bearer` scheme. It literally translates to: "Give access to the *bearer* (the person holding) this token."
The header looks like this:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting the space after the Scheme word

**The mistake:** A developer writes their fetch request like this:
`headers: { "Authorization": "Bearer" + myToken }`

**Why it's wrong:** Because there is no space between the word and the variable, the header will look like `Authorization: BearereyJhb...`. The Server's security middleware will crash because it doesn't recognize the scheme "BearereyJhb". 
**Golden Rule:** Always use a template literal with a space: ``Authorization: `Bearer ${myToken}` ``.

---

### Mistake 2: Confusing HTTP Basic Auth Base64 Encoding with Encryption

**The mistake:** Believing `Authorization: Basic dXNlcjpwYXNz` encrypts credentials on the wire.

**Why it's wrong:** Base64 is a reversible encoding, NOT encryption. Anyone can decode `dXNlcjpwYXNz` into `user:pass` instantly using `atob()`. Always combine Basic Auth with HTTPS.

*Incorrect:*
```http
// Transmitting Basic Auth header over HTTP
Authorization: Basic dXNlcjpwYXNz ; ❌ Plaintext decoding yields 'user:pass'!
```

*Fix:*
```http
// Transmit over HTTPS encrypted channel exclusively:
https://api.example.com (Authorization: Basic dXNlcjpwYXNz)
```

---

### Mistake 3: Omitting `Bearer` Prefix Keyword in Token Authorization Headers

**The mistake:** Sending raw token string in header: `Authorization: eyJhbGciOi...`.

**Why it's wrong:** The `Authorization` header expects a scheme prefix (`Bearer <token>`). Omitting `Bearer` causes server header parsers to fail token extraction.

*Incorrect:*
```http
Authorization: eyJhbGciOi... ; ❌ Missing Bearer scheme prefix!
```

*Fix:*
```http
Authorization: Bearer eyJhbGciOi... ; Standard OAuth2 Bearer token header
```


---

## 5. Practice Exercises

### Exercise 1: HTTP Basic Authorization Header Parser

**Scenario:** A backend service parses HTTP `Authorization: Basic <base64>` headers, decoding credentials into username and password.

**Requirements:**
1. Write parseBasicAuthHeader(headerStr).
2. Extract Base64 string.
3. Decode ASCII string `username:password`.
4. Return credentials object.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function parseBasicAuthHeader(headerStr) {
>   if (!headerStr || typeof headerStr !== "string" || !headerStr.startsWith("Basic ")) {
>     return { valid: false, error: "Invalid Basic Auth header format" };
>   }
>
>   const base64Str = headerStr.substring(6).trim();
>   try {
>     const decoded = Buffer.from(base64Str, "base64").toString("utf-8");
>     const separatorIdx = decoded.indexOf(":");
>     if (separatorIdx === -1) {
>       return { valid: false, error: "Malformed credentials string" };
>     }
>
>     const username = decoded.substring(0, separatorIdx);
>     const password = decoded.substring(separatorIdx + 1);
>
>     return { valid: true, username, password };
>   } catch (err) {
>     return { valid: false, error: "Failed to decode base64" };
>   }
> }
>
> // Verification tests
> const header = "Basic YWRtaW46c2VjcmV0MTIz";
> const parsed = parseBasicAuthHeader(header);
>
> console.assert(parsed.valid === true, "Test 1 Failed");
> console.assert(parsed.username === "admin" && parsed.password === "secret123", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **HTTP Basic Auth Scheme**: Transmits credentials as Base64 encoded string (`username:password`).
> 2. **Base64 is NOT Encryption**: Base64 is simple encoding, easily decoded by anyone; MUST be used over HTTPS.
> 3. **RFC 7617 Specification**: Standard format for legacy server-to-server and web tool authentication.
> 
---

### Exercise 2: HTTP Bearer Token Authorization Extractor

**Scenario:** An API middleware extracts and validates `Authorization: Bearer <token>` headers.

**Requirements:**
1. Write extractBearerToken(headerStr).
2. Verify header begins with 'Bearer '.
3. Return raw opaque or JWT token string.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function extractBearerToken(headerStr) {
>   if (!headerStr || typeof headerStr !== "string") {
>     return { valid: false, error: "Missing Authorization header" };
>   }
>
>   const parts = headerStr.trim().split(" ");
>   if (parts.length !== 2 || parts[0] !== "Bearer") {
>     return { valid: false, error: "Header must be in format 'Bearer <token>'" };
>   }
>
>   const token = parts[1].trim();
>   if (!token) {
>     return { valid: false, error: "Token string is empty" };
>   }
>
>   return { valid: true, token };
> }
>
> // Verification tests
> const res1 = extractBearerToken("Bearer token_abc123");
> console.assert(res1.valid === true && res1.token === "token_abc123", "Test 1 Failed");
>
> const res2 = extractBearerToken("Basic YWRtaW4=");
> console.assert(res2.valid === false, "Test 2 Failed: Basic header rejected");
> ```
>
> #### Technical Explanation
>
> 1. **Bearer Auth Scheme**: Client presents opaque or JWT token string as proof of authorization.
> 2. **Bearer Meaning**: 'Bearer' means whoever holds the token is granted access.
> 3. **Token Confidentiality**: Bearer tokens must be stored securely (HttpOnly cookies or encrypted storage) and sent over HTTPS.
> 
---

### Exercise 3: Authentication Scheme Router & Auditor

**Scenario:** An API gateway routes incoming requests to Basic or Bearer authenticators based on Authorization header scheme.

**Requirements:**
1. Write routeAuthScheme(headerStr, basicHandler, bearerHandler).
2. Dispatch to appropriate handler.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function routeAuthScheme(headerStr, basicHandler, bearerHandler) {
>   if (!headerStr || typeof headerStr !== "string") {
>     return { status: 401, error: "Missing Authorization header" };
>   }
>
>   if (headerStr.startsWith("Basic ")) {
>     return basicHandler(headerStr);
>   }
>   if (headerStr.startsWith("Bearer ")) {
>     return bearerHandler(headerStr);
>   }
>
>   return { status: 401, error: "Unsupported authentication scheme" };
> }
>
> // Verification tests
> const mockBasic = () => ({ status: 200, scheme: "BASIC" });
> const mockBearer = () => ({ status: 200, scheme: "BEARER" });
>
> console.assert(routeAuthScheme("Basic xyz", mockBasic, mockBearer).scheme === "BASIC", "Test 1 Failed");
> console.assert(routeAuthScheme("Bearer xyz", mockBasic, mockBearer).scheme === "BEARER", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Multi-Scheme Support**: API gateways support legacy Basic Auth for machine clients and Bearer Auth for user web clients.
> 2. **WWW-Authenticate Challenge**: Server returns `WWW-Authenticate: Bearer` on 401 to signal expected auth scheme.
> 3. **Extensible Auth Pipeline**: Allows adding OAuth or Digest authentication schemes easily.
---

## 6. Related Terms
- [JWT (JSON Web Tokens)](jwt.md) — The most common type of token placed inside a Bearer header.
- [Statelessness](../level_03/statelessness.md) — The reason we have to send the Bearer token on every single request.
- [Access Token vs Refresh Token](access_refresh_tokens.md) — Related concept: Access Token vs Refresh Token.
- [API Keys](api_keys.md) — Related concept: API Keys.
- [OAuth 2.0](oauth.md) — Related concept: OAuth 2.0.
- [Secrets & Environment Variables](secrets_env.md) — Related concept: Secrets & Environment Variables.
- [Base64 Encoding](../level_07/base64.md) — Related concept: Base64 Encoding.

---

## 7. Key Takeaways
- The **`Authorization`** header is the standard place to send credentials.
- **Basic Auth**: Used for sending a Base64 encoded `username:password`.
- **Bearer Auth**: Used for sending an encrypted Token (like a JWT or OAuth token).
- Always include a space between the scheme name and the credential!
