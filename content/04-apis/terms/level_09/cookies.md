# Cookies

> **Level 9 — Browser APIs (Storage & State)**
> Small text files stored in the browser that are automatically attached to every single HTTP request sent to the Server.

---

## 1. Prerequisites
- [HTTP Headers](../level_02/http_headers.md) — Cookies are transmitted entirely via headers.
- [Statelessness](../level_03/statelessness.md) — Cookies were the original invention to solve HTTP's amnesia.

---

## 2. Term Category

**Browser API / HTTP Standard (Universal .)**: Cookies is a fundamental concept in this technology stack. **Level 9 — Browser APIs (Storage & State)**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Client-Side Document Cookie Parser & Helper

**Scenario:** A client-side utility parses `document.cookie` strings into key-value objects and provides safe getter/setter methods.

**Requirements:**
1. Write parseDocumentCookies(cookieStr).
2. Implement getCookie(cookieStr, name).
3. Implement setCookie(name, val, days).

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function parseDocumentCookies(cookieStr = "") {
>   const cookies = {};
>   if (!cookieStr || typeof cookieStr !== "string") return cookies;
>
>   const pairs = cookieStr.split(";");
>   for (const pair of pairs) {
>     const idx = pair.indexOf("=");
>     if (idx !== -1) {
>       const key = decodeURIComponent(pair.substring(0, idx).trim());
>       const val = decodeURIComponent(pair.substring(idx + 1).trim());
>       cookies[key] = val;
>     }
>   }
>
>   return cookies;
> }
>
> function getCookie(cookieStr, name) {
>   const parsed = parseDocumentCookies(cookieStr);
>   return parsed[name] || null;
> }
>
> // Verification tests
> const rawCookieStr = "theme=dark; user_id=usr_42; %20custom%20=val";
> const theme = getCookie(rawCookieStr, "theme");
> const userId = getCookie(rawCookieStr, "user_id");
>
> console.assert(theme === "dark", "Test 1 Failed");
> console.assert(userId === "usr_42", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **document.cookie String Representation**: Browsers expose non-HttpOnly cookies as a single semicolon-delimited string (`key1=val1; key2=val2`).
> 2. **URL Decoding**: Cookie keys and values should be URI encoded (encodeURIComponent) to handle special characters.
> 3. **Security Boundary**: Client-side JS cannot read or alter HttpOnly cookies.
> 
---

### Exercise 2: HTTP Response Set-Cookie Header Generator

**Scenario:** An API server response formatter constructs an array of `Set-Cookie` headers for session initialization.

**Requirements:**
1. Write generateSessionSetCookies(sessionId, preferencesObj).
2. Return array of Set-Cookie header strings.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function generateSessionSetCookies(sessionId, preferencesObj = {}) {
>   const headers = [];
>
>   headers.push(`session_id=${encodeURIComponent(sessionId)}; Path=/; HttpOnly; Secure; SameSite=Lax`);
>
>   const prefStr = encodeURIComponent(JSON.stringify(preferencesObj));
>   headers.push(`prefs=${prefStr}; Path=/; SameSite=Lax; Max-Age=31536000`);
>
>   return headers;
> }
>
> // Verification tests
> const cookies = generateSessionSetCookies("sess_999", { theme: "dark" });
> console.assert(cookies.length === 2, "Test 1 Failed");
> console.assert(cookies[0].includes("HttpOnly"), "Test 2 Failed: Session cookie must be HttpOnly");
> console.assert(cookies[1].includes("prefs="), "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Multiple Set-Cookie Headers**: HTTP servers send multiple Set-Cookie headers to set multiple cookies simultaneously.
> 2. **Decoupling Security Boundaries**: Keep authentication tokens HttpOnly while storing non-sensitive UI settings in readable cookies.
> 3. **Max-Age Persistence**: Cookies without Max-Age/Expires are Session Cookies deleted when the browser closes.
> 
---

### Exercise 3: Cookie Storage Limit & Size Warning Inspector

**Scenario:** An API inspector verifies that cookies do not exceed browser size limits (~4096 bytes per cookie) or total domain count limits (~50 cookies).

**Requirements:**
1. Write inspectCookieLimits(cookieName, cookieValue).
2. Calculate byte size.
3. Flag cookies exceeding 4000 bytes.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function inspectCookieLimits(cookieName, cookieValue) {
>   const pairStr = `${encodeURIComponent(cookieName)}=${encodeURIComponent(cookieValue)}`;
>   const byteSize = Buffer.byteLength(pairStr, "utf-8");
>
>   const MAX_BYTES = 4096;
>   const SAFE_BYTES = 4000;
>
>   return {
>     byteSize,
>     isValid: byteSize <= MAX_BYTES,
>     isWarning: byteSize > SAFE_BYTES,
>     remainingBytes: Math.max(0, MAX_BYTES - byteSize)
>   };
> }
>
> // Verification tests
> const small = inspectCookieLimits("user", "alice");
> console.assert(small.isValid === true && small.isWarning === false, "Test 1 Failed");
>
> const hugeVal = "a".repeat(4100);
> const huge = inspectCookieLimits("data", hugeVal);
> console.assert(huge.isValid === false, "Test 2 Failed: Exceeds 4096 byte cookie limit");
> ```
>
> #### Technical Explanation
>
> 1. **Cookie Size Limit**: RFC 6265 specifies browsers MUST support at least 4096 bytes per cookie (name + value + attributes).
> 2. **Browser Rejection**: Over-sized cookies are silently rejected by browsers.
> 3. **HTTP Request Overhead**: Every cookie is sent in EVERY HTTP request header to the domain, consuming bandwidth.
---

## 6. Related Terms
- [localStorage & sessionStorage](web_storage.md) — The frontend alternative to cookies.
- [JWT (JSON Web Tokens)](../level_04/jwt.md) — Modern tokens are often placed inside Cookies for secure, automatic transmission.
- [CSRF (Cross-Site Request Forgery)](../level_04/csrf.md) — Related concept: CSRF (Cross-Site Request Forgery).
- [Session vs Token Authentication](../level_04/session_vs_token_auth.md) — Related concept: Session vs Token Authentication.
- [Storage Serialization](storage_serialization.md) — Related concept: Storage Serialization.
- [Cookie Attributes (HttpOnly, Secure, SameSite)](cookie_attributes.md) — SameSite, Secure, HttpOnly attributes.

---

## 7. Key Takeaways
- **Cookies** are tiny text files used to maintain state (remembering logins) between HTTP requests.
- The browser automatically attaches them to *every* request sent to that specific domain.
- They have a tiny size limit (~4KB).
- **`HttpOnly`** cookies are the most secure way to store authentication tokens because they are invisible to malicious JavaScript.
