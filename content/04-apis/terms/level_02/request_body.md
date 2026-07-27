# Request Body & Payloads

> **Level 2 — HTTP Anatomy**
> The actual data (like a JSON object, a file, or form inputs) sent inside an HTTP Request or returned in an HTTP Response.

---

## 1. Prerequisites
- [HTTP Methods](../level_02/http_methods.md) — Not all methods are allowed to have a body!
- [JSON](../level_01/json.md) — The most common format for a payload.

---

## 2. Term Category
- **HTTP Standard / Data Transfer**

---

## 3. Environment Context
- **Universal Standard**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
If you want to read a user's profile, you can just put their ID in the URL (`/users/5`). But what if you are submitting a massive registration form with a username, password, biography, profile picture, and home address? 
You cannot put all of that data into the URL. URLs have character limits, and URLs are saved in browser histories (so your password would be visible to anyone looking at your history!). 
To solve this, HTTP allows you to attach a **Body** (also called a **Payload**) to your request. It is a secure, theoretically unlimited-size block of data sent "inside the envelope" of the HTTP message, completely hidden from the URL.

### (2) Reality Metaphor
When you send a package in the mail:
- The **URL** is the address printed on the outside of the box.
- The **Headers** are the "Fragile" stickers and postage stamps on the outside.
- The **Body (Payload)** is the actual gift sitting inside the box.

### (3) The Strict Rule: `GET` vs `POST`
- **`POST`, `PUT`, `PATCH`**: These methods are designed to send data to the server, so they **ALLOW** a Body.
- **`GET`, `DELETE`**: These methods are designed to just point at a URL and say "Read this" or "Destroy this". According to the HTTP specification, **`GET` requests CANNOT have a Body.** (If you try to attach a body to a `GET` request using `fetch()`, the browser will throw a fatal error and crash your code).

### (4) Code Examples

#### Sending a JSON Body
```javascript
const userData = {
  username: "chienteku",
  password: "supersecretpassword123"
};

fetch('https://api.example.com/register', {
  method: 'POST', // Must be POST/PUT/PATCH to have a body!
  headers: {
    'Content-Type': 'application/json' // Telling the server what's inside the box
  },
  // The Body MUST be converted to a raw string!
  body: JSON.stringify(userData) 
});
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Trying to send a body in a GET request

**The mistake:** A developer has a very complex search filter (Price: $10-50, Color: Red, Size: M). They want to send this data to the server to get a list of products, so they put it in the `body` of a `GET` request.

**Why it's wrong:** The HTTP/1.1 specification explicitly forbids `GET` requests from having a body. `fetch()` enforces this strictly and will instantly throw a `TypeError`. 
**Solution:** If you are reading data (GET), you must put all your filters into the URL as [Query Parameters](../level_02/query_params.md) instead! If the data is truly too massive for a URL, you must compromise and use a `POST` request instead, even though you are technically just "reading" data.

---

### Mistake 2: Attaching a Request Body to HTTP `GET` or `DELETE` Requests

**The mistake:** Sending a JSON payload inside a `GET` request body.

**Why it's wrong:** HTTP/1.1 and HTTP/2 specifications state that request bodies on `GET` requests have no defined semantics. Many proxies, firewalls, and CDNs drop GET request bodies completely.

*Incorrect:*
```http
GET /api/search HTTP/1.1
Content-Type: application/json

{"query": "shoes"} // ❌ Proxies drop GET request bodies!
```

*Fix:*
```http
GET /api/search?q=shoes HTTP/1.1 ; Pass parameters in query string or use POST for complex queries
```

---

### Mistake 3: Failing to Enforce Payload Size Limits on Incoming Server Request Bodies

**The mistake:** Configuring backend body parsers without setting a maximum `limit` parameter.

**Why it's wrong:** Unrestricted request body parsers allow malicious clients to send 500MB JSON payloads, causing server out-of-memory crashes (Denial of Service).

*Incorrect:*
```javascript
// Express without size limit
app.use(express.json()); // ❌ Vulnerable to payload memory crashes!
```

*Fix:*
```javascript
// Enforce strict payload limit
app.use(express.json({ limit: '100kb' }));
```


---

## 6. Practice Exercises

### Exercise 1: The Secure Password

**Problem:** You are building a login form. You need to send the user's password to the backend to verify it. Should you put the password in the URL (e.g., `/login?password=123`), or in the Body?

**Expected output:**
```text
In the Body! 
If you put it in the URL, it will be saved in the browser history, server access logs, and will be visible to anyone standing behind the user looking at their screen.
```

> [!check]- Answer
> - Which part of the HTTP request is hidden "inside the envelope"?

---

### Exercise 2: Request Body Parsing Error Status

**Problem:** If a client sends malformed invalid JSON in a POST request body, what HTTP status code should the server return?

**Expected output:**
```text
HTTP 400 Bad Request
```

> [!check]- Answer
> ```http
> HTTP/1.1 400 Bad Request
> Content-Type: application/json
> {"error": "Invalid JSON syntax in request body"}
> ```
> - **Explanation:** HTTP 400 signals client-side syntax or payload parsing failure.
---

### Exercise 3: Chunked Transfer Encoding

**Problem:** Which header informs the client that a large request body is being streamed in dynamic chunks without a known initial `Content-Length`?

**Expected output:**
```text
Transfer-Encoding: chunked
```

> [!check]- Answer
> ```http
> Transfer-Encoding: chunked
> ```
> - **Explanation:** `Transfer-Encoding: chunked` streams dynamic data payloads in size-delimited blocks.
---

## 7. Related Terms
- [HTTP Headers](../level_02/http_headers.md) — How you tell the server what format the body is in (e.g., `Content-Type`).
- [JSON](../level_01/json.md) — The format you must convert your payload into.

---

## 8. Key Takeaways
- The **Body (Payload)** is the actual data you are sending or receiving.
- **`POST`, `PUT`, and `PATCH`** use bodies to send data to the server.
- **`GET` and `DELETE`** are generally forbidden from having bodies.
- You must convert your JavaScript objects into strings (via `JSON.stringify()`) before putting them in the body.
- Highly sensitive data (passwords, tokens) must ALWAYS go in the Body or Headers, never in the URL.
