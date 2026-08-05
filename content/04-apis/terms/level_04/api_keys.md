# API Keys

> **Level 4 — Security & Authentication**
> A long, randomly generated string of characters used to identify and authenticate a specific application or developer calling an API.

---

## 1. Prerequisites
- [HTTP Headers](../level_02/http_headers.md) — The most common place to securely attach an API Key.
- [Statelessness](../level_03/statelessness.md) — Because APIs are stateless, the API Key must be sent on every single request.
---

## 2. Term Category
- **Security / Authentication**

---

## 3. Environment Context
- **Backend / Server-to-Server** (It is extremely dangerous to use API Keys in frontend browser code!).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: The Stolen Key

**Problem:** You accidentally pushed your Stripe API Key to a public GitHub repository. Within 5 minutes, hackers found it and started making fraudulent charges. What is the immediate technical solution?

**Expected output:**
> [!check]- Answer
> ```text
> You must log into your Stripe dashboard and "Revoke" or "Roll" the API key. 
> This instantly invalidates the old string of characters, meaning any API requests using the stolen key will now receive a `401 Unauthorized` error. You will then be issued a brand new key to put in your backend code.
> ```
> - Just like a stolen credit card, what do you ask the bank to do?

---

### Exercise 2: API Key Storage Location Matrix

**Problem:** Determine if storing an API key is Safe (Yes/No):
1. Frontend React `.env` file (`REACT_APP_API_KEY`)
2. Backend Node.js `.env` file (`process.env.DB_PASS`)
3. Public GitHub repository

**Expected output:**
> [!check]- Answer
> ```text
> 1. No (Bundled into public frontend code)
> 2. Yes (Stays on private server)
> 3. No (Publicly exposed)
> ```
> ```text
> 1. No -> Frontend build tools bundle environment variables directly into client JS.
> 2. Yes -> Backend environment variables remain private on the server.
> 3. No -> GitHub repositories index secrets publicly.
> ```
> - **Explanation:** Public code bundles and Git repositories leak API secrets.
---

### Exercise 3: API Key Rotation Pattern

**Problem:** What architectural feature should an API key management system support to prevent downtime during key leaks?

**Expected output:**
> [!check]- Answer
> ```text
> Dual-key rotation support (allowing an old key and a new key to remain active simultaneously during migration).
> ```
> ```text
> Dual-key rotation support (allowing an old key and a new key to remain active simultaneously during migration).
> ```
> - **Explanation:** Dual-key rotation allows zero-downtime key rotation.
---

## 7. Related Terms
- [Basic & Bearer Authentication](basic_bearer_auth.md) — Other methods of sending secrets in HTTP Headers.
- [JWT (JSON Web Tokens)](jwt.md) — While API Keys authenticate *Applications*, JWTs usually authenticate individual *Users*.
- [SSL/TLS & the Handshake](../level_01/ssl_tls_handshake.md) — Related concept: SSL/TLS & the Handshake.
- [OAuth Scopes](oauth_scopes.md) — Related concept: OAuth Scopes.
---

## 8. Key Takeaways
- An **API Key** is a secret string used to identify a program calling an API.
- It is primarily used for tracking usage, rate limiting, and billing.
- It must be sent on every request (usually via HTTP Headers).
- **NEVER** expose an API Key in frontend (React/Vue/Vanilla JS) code!
