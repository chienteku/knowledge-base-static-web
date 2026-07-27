# JWT (JSON Web Tokens)

> **Level 4 — Security & Authentication**
> A compact, digitally signed JSON object used as a secure token to prove a user's identity to a Stateless API.

---

## 1. Prerequisites
- [Statelessness](../level_03/statelessness.md) — The entire reason JWTs exist is because servers cannot remember who is logged in.
- [JSON](../level_01/json.md) — The format the token is built upon.

---

## 2. Term Category
- **Security / Token Format**

---

## 3. Environment Context
- **Universal Standard** (Pronounced "Jot").

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: The Stolen JWT

**Problem:** A hacker steals a user's valid JWT from an unencrypted Wi-Fi network. Can the hacker use the JWT to access the user's account?

**Expected output:**
```text
Yes! 
A JWT is a "Bearer Token." Whoever bears (holds) the token gets access. The server has no way of knowing the hacker isn't the real user. This is exactly why APIs MUST use HTTPS to encrypt the network so hackers can't steal the token in transit!
```

> [!check]- Answer
> - Does the server check IP addresses, or just the math of the signature?

---

### Exercise 2: JWT 3-Part Structural Component Deconstruction

**Problem:** Identify the 3 dot-separated components of a JSON Web Token (`header.payload.signature`).

**Expected output:**
```text
1. Header (Algorithm & Token Type)
2. Payload (Claims & Expiration)
3. Signature (HMAC or RSA signature verification string)
```

> [!check]- Answer
> ```text
> Part 1 -> Header: {"alg": "HS256", "typ": "JWT"}
> Part 2 -> Payload: {"sub": "123", "exp": 1700000000}
> Part 3 -> Signature: HMACSHA256(base64Url(header) + "." + base64Url(payload), secret)
> ```
> - **Explanation:** JWT tokens consist of header, payload, and cryptographic signature.
---

### Exercise 3: Standard Reserved Claims

**Problem:** Match the JWT claim abbreviation to its name:
1. `sub` 
2. `exp` 
3. `iat` 
4. `iss` 

**Expected output:**
```text
1. Subject (User ID)
2. Expiration Time
3. Issued At
4. Issuer
```

> [!check]- Answer
> ```text
> 1. sub -> Subject (User ID)
> 2. exp -> Expiration Time
> 3. iat -> Issued At timestamp
> 4. iss -> Token Issuer
> ```
> - **Explanation:** Reserved claims provide standard token metadata assertions.
---

## 7. Related Terms
- [Basic & Bearer Authentication](../level_04/basic_bearer_auth.md) — JWTs are sent in the `Authorization: Bearer <token>` header.
- [Web Storage (localStorage)](../level_09/web_storage.md) — The common (though sometimes risky) place to store JWTs on the client.

---

## 8. Key Takeaways
- A **JWT** is a string of characters containing a JSON payload and a cryptographic signature.
- It allows Stateless servers to verify a user's identity without looking up a session in a database.
- The payload is **readable by anyone**. Do not put secrets in it!
- The signature is what makes the JWT impossible to forge.
