# CORS (Cross-Origin Resource Sharing)

> **Level 4 — Security & Authentication**
> A strict security mechanism built into modern web browsers that blocks frontend code from making API requests to a different domain, unless the API explicitly allows it.

---

## 1. Prerequisites
- [HTTP Headers](../level_02/http_headers.md) — CORS relies entirely on specific HTTP headers to work.
- [URL / URI](../level_01/url_uri.md) — A "Origin" is just the Domain/Port part of a URL.

---

## 2. Term Category
- **Security / Browser Policy**

---

## 3. Environment Context
- **Browser Only** (CORS does NOT exist in Node.js, Python, or mobile apps!).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Imagine you are logged into your bank (`bank.com`). Your browser has a secret login cookie saved. 
You then open a new tab and visit `evil-hacker.com`. The hacker wrote JavaScript on their site that says `fetch('https://bank.com/api/transferMoney')`. Because your browser automatically attaches your login cookie, the hacker successfully steals your money!
To stop this, browsers invented the **Same-Origin Policy**. It strictly says: JavaScript running on `evil-hacker.com` is ONLY allowed to make API requests to `evil-hacker.com`. If it tries to request `bank.com`, the browser will physically block the request and throw a massive red error in the console.

### (2) The Problem: Legitimate Cross-Origin Requests
What if you build your frontend at `my-react-app.com` and your backend at `api.my-backend.com`? They are different domains! The browser will block your own frontend from talking to your own backend!
To fix this, we need a way to punch a safe hole in the Same-Origin Policy. That hole is **CORS (Cross-Origin Resource Sharing)**.

### (3) How CORS works
CORS is a conversation of **HTTP Headers** between the Browser and the Server.
1. The Browser asks the Server: "Hey, my frontend is `my-react-app.com`. Are you okay with me making a request?"
2. The Server replies with a specific header: `Access-Control-Allow-Origin: https://my-react-app.com`
3. The Browser sees the header, says "Okay, the Server trusts this frontend," and lets the data through.

If the Server replies with `Access-Control-Allow-Origin: *`, it means "I allow ANY website on the internet to call my API" (Common for public APIs like weather data).

### (4) The Preflight Request (The `OPTIONS` Method)
If you try to send a complex request (like a `POST` with a JSON body), the browser doesn't just send it blindly. It pauses, and sends an invisible "Preflight" request using the `OPTIONS` HTTP method. 
It basically asks the Server: "Hey, I'm about to send a POST request with JSON. Is that cool?" The Server must reply "Yes, POST is allowed" before the browser will actually send your real `POST` request.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Trying to "fix" CORS on the Frontend

**The mistake:** A frontend developer sees a red CORS error in their Chrome console. They spend 3 hours tweaking their React `fetch()` code, adding weird headers like `mode: 'no-cors'`.

**Why it's wrong:** You **cannot** fix a CORS error from the frontend. Period. 
CORS is a security policy enforced by the Browser to protect the Server. The only way to fix a CORS error is to open the Backend code (Node, Python, Java) and configure the server to return the correct `Access-Control-Allow-Origin` headers. 
**Golden Rule:** If you get a CORS error, you must call the Backend engineer.

---

### Mistake 2: Configuring `Access-Control-Allow-Origin: *` Alongside `Access-Control-Allow-Credentials: true`

**The mistake:** Setting wildcard origin `*` on an API that accepts cookies or credentials.

**Why it's wrong:** Browsers strictly reject CORS responses that combine wildcard `*` origins with `Access-Control-Allow-Credentials: true`. Server must reflect the exact requesting origin.

*Incorrect:*
```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Credentials: true ; ❌ Blocked by browser security rules!
```

*Fix:*
```http
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Credentials: true
```

---

### Mistake 3: Attempting to Solve CORS Bugs by Modifying Frontend Request Headers

**The mistake:** Adding `headers: { 'Access-Control-Allow-Origin': '*' }` inside frontend `fetch()` calls.

**Why it's wrong:** `Access-Control-Allow-Origin` is a **RESPONSE header** set by the BACKEND server. Setting CORS response headers inside client requests has zero effect.

*Incorrect:*
```javascript
// Frontend fetch
fetch('https://api.com/data', {
  headers: { 'Access-Control-Allow-Origin': '*' } // ❌ Response header in request!
});
```

*Fix:*
```javascript
// Configure CORS headers in backend server middleware (Express CORS plugin):
app.use(cors({ origin: 'https://app.example.com' }));
```


---

## 6. Practice Exercises

### Exercise 1: Why did it work in Postman?

**Problem:** You build an API. You test it in Postman, and it works perfectly! You then write a React app to call the API, and you immediately get a `CORS error`. Why did Postman work, but React failed?

**Expected output:**
> [!check]- Answer
> ```text
> Because CORS is a *Browser* security feature! 
> Postman is a desktop application; it doesn't care about the Same-Origin Policy. It just sends raw HTTP text over the network. Only web browsers (Chrome, Safari, Firefox) actively enforce CORS rules to protect users from malicious websites.
> ```
> - Who enforces CORS? The server, the network, or the browser?

---

### Exercise 2: CORS Preflight Trigger Identification

**Problem:** Which 2 requests trigger a CORS Preflight (`OPTIONS`) request?
1. `GET /api/items` with `Content-Type: text/plain`
2. `POST /api/items` with `Content-Type: application/json`
3. `DELETE /api/items/5` with `Authorization: Bearer xyz`

**Expected output:**
> [!check]- Answer
> ```text
> Requests 2 and 3 trigger preflight OPTIONS requests.
> ```
> ```text
> Request 2 -> Content-Type application/json is not a simple Content-Type.
> Request 3 -> DELETE verb and custom Authorization header trigger preflight.
> ```
> - **Explanation:** Non-simple HTTP verbs, custom headers, and application/json trigger preflight OPTIONS calls.
---

### Exercise 3: Same-Origin Definition

**Problem:** Do `https://example.com:443` and `http://example.com:443` share the same origin?

**Expected output:**
> [!check]- Answer
> ```text
> No. Origin comparison checks Protocol, Hostname, AND Port. Different protocol schemes mean different origins.
> ```
> ```text
> No. Origin requires exact match of Scheme (https vs http), Hostname, and Port.
> ```
> - **Explanation:** A difference in any 1 of the 3 components constitutes a cross-origin request.
---

## 7. Related Terms
- [HTTP Methods](../level_02/http_methods.md) — The Preflight request uses the obscure `OPTIONS` method.
- [HTTP Headers](../level_02/http_headers.md) — CORS is entirely driven by `Access-Control` headers.

---

## 8. Key Takeaways
- **CORS** is a browser security mechanism that blocks websites from calling APIs on different domains.
- It protects users from malicious scripts making unauthorized background requests.
- To allow communication between different domains, the **Server** must send back specific `Access-Control-Allow-Origin` headers.
- CORS errors can ONLY be fixed on the Backend. You cannot bypass them with Frontend code.
