# JWT (JSON Web Tokens)

> **Level 10 — Security & Production**
> A secure, digital ID badge used by modern applications to prove a user's identity without forcing the server to remember who is logged in.

---

## 1. Prerequisites
- [REST APIs](../../../04-apis/terms/level_03/rest.md) — JWTs are what allow REST APIs to remain "Stateless".
- [JSON](../../../04-apis/terms/level_01/json.md) — The entire token is just encoded JSON data.

---

## 2. Term Category
- **Security / Authentication Standard**

---

## 3. Environment Context
- **Full Stack (Server creates it, Browser stores it)**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: The Forgery

**Problem:** You are an evil hacker. You steal a regular user's JWT. You decode the Base64 payload, change `"isAdmin": false` to `"isAdmin": true`, and re-encode it. You send it to the server. What happens, and why?

**Expected output:**
```text
The server will throw a "Signature Verification Failed" error and reject the request.
Because you changed the payload, the original signature no longer matches the data. You cannot generate a new, matching signature because you don't know the server's secret `.env` key.
```

> [!check]- Answer
> - What is the 3rd part of the JWT used for?

---



### Exercise 2: Signing JWT Token with Expiration

**Problem:** Sign JWT token containing `{ userId: 101 }` with secret `'secretKey'` expiring in 1 hour.

**Expected output:**
```text
const token = jwt.sign({ userId: 101 }, 'secretKey', { expiresIn: '1h' });
```

> [!check]- Answer
> ```javascript
> const jwt = require('jsonwebtoken');
> const token = jwt.sign({ userId: 101 }, 'secretKey', { expiresIn: '1h' });
> ```
>
> **Explanation:** `jwt.sign` signs payloads with secret keys and sets expiration claims (`exp`).

### Exercise 3: Verifying JWT Token

**Problem:** Verify incoming token string `req.headers.authorization` using `jwt.verify`.

**Expected output:**
```text
const decoded = jwt.verify(token, 'secretKey');
```

> [!check]- Answer
> ```javascript
> try {
>   const decoded = jwt.verify(token, 'secretKey');
>   req.user = decoded;
> } catch (err) {
>   return res.status(401).send('Invalid token');
> }
> ```
>
> **Explanation:** `jwt.verify` checks signature validity and expiration before returning decoded payload.

## 7. Related Terms
- [Environment Variables](../level_10/env_vars.md) — Where you store the Secret Password used to sign the JWTs.
- [Bcrypt](../level_10/bcrypt.md) — The tool used to check the user's password *before* giving them the JWT.

---

## 8. Key Takeaways
- **JWTs** allow servers to be Stateless. The server doesn't remember who is logged in; the client proves who they are on every request.
- A JWT has 3 parts: Header, Payload (JSON data), and Signature (Security seal).
- The Payload is readable by **everyone**. It is not encrypted. Never store passwords in it.
- The Signature prevents hackers from altering the data inside the payload.
