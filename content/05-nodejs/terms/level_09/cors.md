# CORS

> **Level 9 — REST APIs & Best Practices**
> A strict security feature built into all web browsers that blocks a website from making an API request to a different domain name, unless the API explicitly gives it permission.

---

## 1. Prerequisites
- [Express.js](../level_07/express_js.md) — You usually fix CORS issues using an Express middleware.
- [REST API Design](rest_api.md) — APIs are the target of CORS blocks.

---

## 2. Term Category

**Browser Security / API Configuration (Browser-to-Server Communication)**: CORS is a fundamental concept in this technology stack. **Level 9 — REST APIs & Best Practices**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Imagine you are logged into your bank at `bank.com`. Your browser stores a secret authentication cookie for the bank.
Later, you visit an evil hacker's website: `evil.com`. Behind the scenes, the hacker writes JavaScript that secretly runs `fetch('https://bank.com/transfer_money')`. Because your browser automatically attaches your bank cookie, the bank thinks *you* made the request, and steals your money!
To stop this, browsers invented the **Same-Origin Policy**. The browser says: *"If the JavaScript is running on `evil.com`, it is NOT ALLOWED to fetch data from `bank.com`!"*

### (2) The Problem for Developers
This security feature creates a massive headache for legitimate developers. 
If your React frontend is hosted on `my-app.com`, and your Node.js backend is hosted on `api.my-app.com`, the browser sees two different domains. When React tries to fetch data from the API, the browser blocks it and throws a massive red **CORS Error** in the console.

### (3) The Solution: The CORS Header
To fix this, the backend server must explicitly tell the browser: *"It's okay! I trust `my-app.com`. Let them through."*
In Node.js, we do this by adding a special HTTP Header (`Access-Control-Allow-Origin`) to the response. The easiest way to do this is using the official `cors` middleware package.
```javascript
const express = require('express');
const cors = require('cors'); // The magic package
const app = express();

// Tell the browser that our specific frontend is allowed to access the API
app.use(cors({
  origin: 'https://my-app.com' 
}));

app.get('/data', (req, res) => res.json({ secret: 123 }));
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: The Wildcard CORS (`*`)

**The mistake:** A developer gets a CORS error. They Google the solution and paste `app.use(cors({ origin: '*' }))` into their server. The error goes away.

**Why it's wrong:** The `*` wildcard tells the browser: *"I trust EVERY website on the internet!"* You just disabled the entire security system. Now, `evil.com` can successfully steal your users' data again.
**Golden Rule:** Never use `origin: '*'` in production for an API that requires authentication. Always hardcode your specific frontend URLs. (Note: Public, open APIs like a Weather API *should* use `*` because they want everyone to access the data).

---



### Mistake 2: Using Wildcard CORS `origin: '*'` with Credentials (`credentials: true`)

**The mistake:** Configuring CORS with `origin: '*'` while enabling `credentials: true`.

**Why it's wrong:** Browsers reject CORS requests specifying `credentials: true` when `origin` is a wildcard `'*'`. Specify explicit client domain origins (e.g. `https://myapp.com`).

*Incorrect:*
```javascript
app.use(cors({ origin: '*', credentials: true })); // ❌ Rejected by browser!
```

*Fix:*
```javascript
app.use(cors({ origin: 'https://myapp.com', credentials: true })); // Explicit client origin
```

### Mistake 3: Failing to Handle Preflight OPTIONS Requests in Express Routes

**The mistake:** Omitting OPTIONS HTTP method support when implementing custom CORS headers manually without the `cors` package.

**Why it's wrong:** Browsers issue an automatic `OPTIONS` preflight request before sending complex HTTP requests (e.g. `POST` with `Content-Type: application/json` or custom headers). Unhandled `OPTIONS` requests fail CORS checks.

*Incorrect:*
```javascript
// Manual CORS headers added to GET/POST but omitting OPTIONS handler
```

*Fix:*
```javascript
app.use(cors()); // Use official cors middleware handling OPTIONS preflight automatically
```



### Mistake 4: Using Wildcard CORS `origin: '*'` with Credentials (`credentials: true`)

**The mistake:** Configuring CORS with `origin: '*'` while enabling `credentials: true`.

**Why it's wrong:** Browsers reject CORS requests specifying `credentials: true` when `origin` is a wildcard `'*'`. Specify explicit client domain origins (e.g. `https://myapp.com`).

*Incorrect:*
```javascript
app.use(cors({ origin: '*', credentials: true })); // ❌ Rejected by browser!
```

*Fix:*
```javascript
app.use(cors({ origin: 'https://myapp.com', credentials: true })); // Explicit client origin
```

### Mistake 5: Failing to Handle Preflight OPTIONS Requests in Express Routes

**The mistake:** Omitting OPTIONS HTTP method support when implementing custom CORS headers manually without the `cors` package.

**Why it's wrong:** Browsers issue an automatic `OPTIONS` preflight request before sending complex HTTP requests (e.g. `POST` with `Content-Type: application/json` or custom headers). Unhandled `OPTIONS` requests fail CORS checks.

*Incorrect:*
```javascript
// Manual CORS headers added to GET/POST but omitting OPTIONS handler
```

*Fix:*
```javascript
app.use(cors()); // Use official cors middleware handling OPTIONS preflight automatically
```



### Mistake 6: Using Wildcard CORS `origin: '*'` with Credentials (`credentials: true`)

**The mistake:** Configuring CORS with `origin: '*'` while enabling `credentials: true`.

**Why it's wrong:** Browsers reject CORS requests specifying `credentials: true` when `origin` is a wildcard `'*'`. Specify explicit client domain origins (e.g. `https://myapp.com`).

*Incorrect:*
```javascript
app.use(cors({ origin: '*', credentials: true })); // ❌ Rejected by browser!
```

*Fix:*
```javascript
app.use(cors({ origin: 'https://myapp.com', credentials: true })); // Explicit client origin
```

### Mistake 7: Failing to Handle Preflight OPTIONS Requests in Express Routes

**The mistake:** Omitting OPTIONS HTTP method support when implementing custom CORS headers manually without the `cors` package.

**Why it's wrong:** Browsers issue an automatic `OPTIONS` preflight request before sending complex HTTP requests (e.g. `POST` with `Content-Type: application/json` or custom headers). Unhandled `OPTIONS` requests fail CORS checks.

*Incorrect:*
```javascript
// Manual CORS headers added to GET/POST but omitting OPTIONS handler
```

*Fix:*
```javascript
app.use(cors()); // Use official cors middleware handling OPTIONS preflight automatically
```

## 5. Practice Exercises

### Exercise 1: Who throws the error?

**Problem:** You are building a mobile app using React Native, and your friend is building a website using React JS. Both of you connect to the exact same Node.js API, which currently has no CORS configuration.
Your friend gets a CORS error. You do not. Why?

**Expected output:**
> [!check]- Answer
> ```text
> CORS is a security feature enforced by Web Browsers (like Chrome or Safari). 
> Mobile apps (React Native) are not web browsers, so they completely ignore CORS rules! Only the React JS website will be blocked.
> ```
> - Where does the Same-Origin Policy actually live? (Hint: The user's device).
> 
---



### Exercise 2: Configuring Cors Origin Whitelist

**Problem:** Configure `cors` middleware in Express to allow origins `['https://app.com', 'https://admin.app.com']`.

**Expected output:**
> [!check]- Answer
> ```text
> app.use(cors({ origin: ['https://app.com', 'https://admin.app.com'] }));
> ```
> ```javascript
> const cors = require('cors');
> app.use(cors({
>   origin: ['https://app.com', 'https://admin.app.com']
> }));
> ```
>
> **Explanation:** Passing an array of domain strings restricts CORS access to authorized client domains.
> 
---

### Exercise 3: CORS Preflight Triggering Headers

**Problem:** Which HTTP header sent by frontend clients triggers a CORS preflight `OPTIONS` request?

**Expected output:**
> [!check]- Answer
> ```text
> Content-Type: application/json (or custom headers like Authorization)
> ```
> ```text
> Content-Type: application/json (or custom headers like Authorization)
> ```
>
> **Explanation:** Non-simple content types or custom headers trigger browser `OPTIONS` preflight checks.
> 
## 6. Related Terms
- [Middleware](../level_07/middleware.md) — `cors()` is just a standard Express middleware.
- [REST API Design](rest_api.md) — What the browser is trying to protect.
- [Express.js](../level_07/express_js.md) — Express CORS setup.

---

## 7. Key Takeaways
- **CORS** is a browser security mechanism that blocks scripts on one domain from calling an API on a different domain.
- It exists to prevent malicious websites from making requests on your behalf.
- To bypass it for legitimate frontends, your Node.js API must explicitly whitelist the frontend domain using the `cors` npm package.
- Never use the `*` wildcard on private APIs, as it completely destroys the security mechanism.
