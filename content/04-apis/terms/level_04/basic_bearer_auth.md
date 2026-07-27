# Basic & Bearer Authentication

> **Level 4 — Security & Authentication**
> The two most standard ways to format the HTTP `Authorization` header when sending secrets to an API.

---

## 1. Prerequisites
- [HTTP Headers](../level_02/http_headers.md) — These authentication schemes dictate exactly how to format the `Authorization` header.

---

## 2. Term Category
- **Security / HTTP Standard**

---

## 3. Environment Context
- **Universal Standard**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Which Scheme?

**Problem:** You are building a frontend app. The user types their email and password into a login form and clicks submit. You need to send these credentials to `/api/login`. Which scheme should you use in the `Authorization` header?

**Expected output:**
```text
Basic Authentication.
You are sending the raw username and password. Once the server verifies it, it will return a Token, which you will then use for *Bearer* Authentication on all future requests!
```

> [!check]- Answer
> - Are you sending a raw password, or a generated token?

---

### Exercise 2: Basic Auth String Encoding

**Problem:** Encode username `admin` and password `secret` into an HTTP Basic Auth header string format.

**Expected output:**
```text
Authorization: Basic YWRtaW46c2VjcmV0
```

> [!check]- Answer
> ```javascript
> const credentials = btoa('admin:secret'); // 'YWRtaW46c2VjcmV0'
> const header = `Authorization: Basic ${credentials}`;
> ```
> - **Explanation:** Basic Auth formats `btoa('username:password')` appended after `Basic `.
---

### Exercise 3: Bearer Token RFC Specification

**Problem:** Which RFC specification defines the HTTP Bearer Token authentication scheme?

**Expected output:**
```text
RFC 6750 (The OAuth 2.0 Authorization Framework: Bearer Token Usage).
```

> [!check]- Answer
> ```text
> RFC 6750 (OAuth 2.0 Bearer Token Usage).
> ```
> - **Explanation:** RFC 6750 standardizes Bearer token transport in HTTP Authorization headers.
---

## 7. Related Terms
- [JWT](../level_04/jwt.md) — The most common type of token placed inside a Bearer header.
- [Statelessness](../level_03/statelessness.md) — The reason we have to send the Bearer token on every single request.

---

## 8. Key Takeaways
- The **`Authorization`** header is the standard place to send credentials.
- **Basic Auth**: Used for sending a Base64 encoded `username:password`.
- **Bearer Auth**: Used for sending an encrypted Token (like a JWT or OAuth token).
- Always include a space between the scheme name and the credential!
