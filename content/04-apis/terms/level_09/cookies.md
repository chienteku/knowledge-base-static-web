# Cookies

> **Level 9 — Browser APIs (Storage & State)**
> Small text files stored in the browser that are automatically attached to every single HTTP request sent to the Server.

---

## 1. Prerequisites
- [HTTP Headers](../level_02/http_headers.md) — Cookies are transmitted entirely via headers.
- [Statelessness](../level_03/statelessness.md) — Cookies were the original invention to solve HTTP's amnesia.

---

## 2. Term Category
- **Browser API / HTTP Standard**

---

## 3. Environment Context
- **Universal** (Managed by the Browser, but heavily manipulated by the Server).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Because HTTP is [Stateless](../level_03/statelessness.md), the Server has amnesia. If you log into Amazon, and then click "Cart," the Server forgets who you are and asks you to log in again.
In 1994, Netscape invented the **Cookie**. When you log in, the Server sends back a special HTTP Header: `Set-Cookie: sessionId=123`. 
The Browser intercepts this header and saves `sessionId=123` into a tiny, hidden text file on your hard drive. 
The magic of cookies is the **Automatic Attachment**. On every single future request you make to Amazon.com, the browser reaches into that text file and automatically adds `Cookie: sessionId=123` to the HTTP Headers. The Server reads the header, remembers who you are, and loads your cart!

### (2) Cookies vs LocalStorage
If [localStorage](../level_09/web_storage.md) exists, why do we still use Cookies?
- `localStorage` is for the **Frontend**. The server cannot see it. You have to manually write JavaScript to extract the data and put it in a `fetch()` body.
- `Cookies` are for the **Backend**. They are designed to be read by the Server. They are sent *automatically* by the browser on every request, even requests for images (`<img src="...">`) where you cannot use `fetch()`.

### (3) Security Flags (The Superpower of Cookies)
The Server can lock down Cookies using powerful security flags:
- `HttpOnly`: The cookie is completely invisible to Frontend JavaScript. Hackers cannot steal it using `console.log(document.cookie)`.
- `Secure`: The cookie will ONLY be sent over an encrypted HTTPS connection.
- `SameSite`: The cookie will not be sent if the request originates from a malicious third-party site (prevents CSRF attacks).

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Trying to store massive JSON objects in Cookies

**The mistake:** A developer decides to store the user's entire profile (Name, Address, 50 previous orders) inside a Cookie so the server always has it.

**Why it's wrong:** Cookies have a strict maximum size of **4 Kilobytes** (which is tiny). Furthermore, because Cookies are attached to *every single HTTP request*, if you store 4KB of data in a cookie, you are adding 4KB of wasted bandwidth to every single image, CSS file, and API call your app makes! 
**Golden Rule:** Cookies should only hold tiny identifiers (like a 30-character Session ID or JWT). The actual heavy data should live in the Server's database.

---

### Mistake 2: Exceeding the 4KB Cookie Size Storage Limit

**The mistake:** Storing large JWT tokens or user preferences exceeding 4096 bytes inside a cookie.

**Why it's wrong:** Browsers enforce a strict 4KB (4096 bytes) maximum limit per cookie. Storing oversized data causes browsers to silently drop the cookie or truncate headers.

*Incorrect:*
```http
/* Storing 8KB JSON state inside a single Set-Cookie header */
```

*Fix:*
```http
/* Store minimal session ID in cookie (32 bytes) and keep data in Redis / IndexedDB */
```

---

### Mistake 3: Using `document.cookie` String Parsing Manually (Buggy Regex Parsing)

**The mistake:** Parsing `document.cookie` manually with custom split string operations.

**Why it's wrong:** `document.cookie` returns a semi-colon separated string that is error-prone to parse manually. Use `cookieStore.get('token')` or a tested cookie library.

*Incorrect:*
```javascript
const token = document.cookie.split('; ').find(row => row.startsWith('token=')).split('=')[1]; // ❌ Fragile!
```

*Fix:*
```javascript
// Use modern Cookie Store API:
const cookie = await cookieStore.get('token');
console.log(cookie.value);
```


---

## 6. Practice Exercises

### Exercise 1: The Invisible Token

**Problem:** You are building an ultra-secure banking app. When the user logs in, the Server returns a JWT token. You need to store it in the browser. Do you put it in `localStorage` or an `HttpOnly` Cookie?

**Expected output:**
> [!check]- Answer
> ```text
> An `HttpOnly` Cookie!
> If you put it in `localStorage`, any malicious JavaScript code (perhaps from a compromised NPM package or a browser extension) can easily read `localStorage.getItem('token')` and steal the user's bank access. An `HttpOnly` Cookie is physically hidden from JavaScript, making it immune to XSS (Cross-Site Scripting) theft.
> ```
> - Which storage mechanism can be hidden from Frontend JavaScript entirely?

---

### Exercise 2: Set-Cookie Response Header Syntax

**Problem:** Write HTTP `Set-Cookie` header for session ID `sid123`, expiring in 86400s, HttpOnly, Secure, SameSite Lax.

**Expected output:**
> [!check]- Answer
> ```text
> Set-Cookie: sid=sid123; Max-Age=86400; HttpOnly; Secure; SameSite=Lax
> ```
> ```http
> Set-Cookie: sid=sid123; Max-Age=86400; HttpOnly; Secure; SameSite=Lax
> ```
> - **Explanation:** `Set-Cookie` response headers instruct browsers to store key-value cookies with attributes.
---

### Exercise 3: Cookie Transmission Overhead

**Problem:** Why can storing multiple large cookies degrade HTTP request performance?

**Expected output:**
> [!check]- Answer
> ```text
> Browsers send ALL matching cookies in the `Cookie` header on EVERY SINGLE HTTP request (including images, CSS, JS), swelling request header size.
> ```
> ```text
> Browsers send ALL matching cookies in the `Cookie` header on EVERY SINGLE HTTP request (including images, CSS, JS), swelling request header size.
> ```
> - **Explanation:** Unnecessary cookies add network header bloat to all outbound requests.
---

## 7. Related Terms
- [`localStorage`](../level_09/web_storage.md) — The frontend alternative to cookies.
- [JWT](../level_04/jwt.md) — Modern tokens are often placed inside Cookies for secure, automatic transmission.

---

## 8. Key Takeaways
- **Cookies** are tiny text files used to maintain state (remembering logins) between HTTP requests.
- The browser automatically attaches them to *every* request sent to that specific domain.
- They have a tiny size limit (~4KB).
- **`HttpOnly`** cookies are the most secure way to store authentication tokens because they are invisible to malicious JavaScript.
