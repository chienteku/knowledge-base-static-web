# Cookie Attributes (HttpOnly, Secure, SameSite)

> **Level 9 — Browser APIs (Storage & State)**
> The flags that make cookies safe for auth.

---

## 1. Prerequisites
- [Cookies](./cookies.md) — The header-based browser storage state.
- [Session vs Token Authentication](../level_04/session_vs_token_auth.md) — The authentication paradigms utilizing cookies.

---

## 2. Term Category
- **Security**

---

## 3. Environment Context
- **Universal**: Configured on backend application server response headers and processed by client-side browser engines.

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
By default, cookies are simple key-value strings stored in the browser and sent automatically with every matching HTTP request. However, when cookies store session IDs or JWTs, they become high-value targets for attackers:
- **XSS Attacks:** If an attacker injects malicious JavaScript into your site, they can access `document.cookie` to steal authentication tokens.
- **CSRF Attacks:** If a user visits a malicious site, that site can trigger background API calls to your server. The browser automatically appends your site's cookies to the request, executing actions on behalf of the user.

To protect authentication state, servers configure **Cookie Attributes** inside the `Set-Cookie` header to restrict when cookies can be accessed and sent:

#### 1. `HttpOnly`
- **Behavior:** Prevents client-side JavaScript from reading or writing the cookie (e.g. `document.cookie` will not show it).
- **Defense:** Protects the cookie from theft via **XSS (Cross-Site Scripting)**.

#### 2. `Secure`
- **Behavior:** Restricts the browser to sending the cookie only over encrypted connections (**HTTPS**). If you query the site over plain HTTP, the browser blocks the cookie.
- **Defense:** Prevents cookie theft via packet sniffing (Man-in-the-Middle attacks) on public networks.

#### 3. `SameSite`
- **Behavior:** Restricts when cookies are sent along with cross-site requests (e.g. links from external sites).
- **Defense:** The primary browser defense against **CSRF (Cross-Site Request Forgery)**.
- **Values:**
  - **`SameSite=Strict`:** The cookie is never sent on cross-site requests (e.g. even if you click a link from Google to your bank, you will load the page logged out).
  - **`SameSite=Lax` (Default in modern browsers):** The cookie is sent on cross-site requests only during safe, top-level navigations (e.g. clicking a regular `<a>` link), but blocked on background requests (like `<img>` source loads or `fetch()` calls from external pages).
  - **`SameSite=None`:** The cookie is sent on all cross-site requests. **Requires** the `Secure` attribute to be set.

---

### (2) Reality Metaphor
Imagine carrying a physical security badge in your pocket.
- **Default Cookie:** A plain badge. Anyone looking over your shoulder can read it (**XSS**), and if a stranger grabs your arm and pushes you into a building gate, the usher sees the badge in your pocket and lets you in (**CSRF**).
- **`HttpOnly`:** Placing the badge inside a **locked steel box** in your pocket. You cannot take it out to read or show it to anyone on the street, but when you stand at the official gate (**making a network request**), a scanner reads the badge directly through the box steel.
- **`Secure`:** The badge is made of photo-luminescent material that only works under **secure blue lighting (HTTPS)**. If someone tries to inspect it under standard street lights (HTTP), it appears blank.
- **`SameSite=Strict`:** You only show your badge if you walked directly from your own home to the office. If a tour guide from another company led you to the gate, you refuse to show it.

---

### (3) HTTP Configuration Example
The backend server sets these attributes within the `Set-Cookie` response header:

```http
HTTP/1.1 200 OK
Content-Type: application/json
Set-Cookie: session_id=xyz987654321; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Assuming `HttpOnly` protects against CSRF attacks

**The mistake:** Believing that because a cookie has the `HttpOnly` attribute enabled, it is safe from Cross-Site Request Forgery.

**Why it's wrong:** `HttpOnly` only prevents JavaScript from reading the cookie values. However, if a malicious website triggers a background `POST` request to your API, the browser **still appends the cookie automatically** to that request. The server will see the valid session cookie and process the request, completing the CSRF attack.

*Fix:* You must combine `HttpOnly` with the `SameSite` attribute or use anti-CSRF tokens.

---

### Mistake 2: Omitting `Secure` Flag on Production Authentication Cookies

**The mistake:** Setting `Set-Cookie: session=abc123` without the `Secure` flag on production HTTPS sites.

**Why it's wrong:** Without `Secure`, browsers will send the session cookie over unencrypted HTTP requests if a user visits `http://yourdomain.com`, exposing session tokens to network sniffing.

*Incorrect:*
```http
Set-Cookie: sid=abc123; HttpOnly ; ❌ Missing Secure flag on HTTPS site!
```

*Fix:*
```http
Set-Cookie: sid=abc123; HttpOnly; Secure; SameSite=Strict
```

---

### Mistake 3: Setting `SameSite=None` Without the `Secure` Flag

**The mistake:** Writing `Set-Cookie: token=xyz; SameSite=None` without adding `Secure`.

**Why it's wrong:** Modern browsers reject `SameSite=None` cookies unless accompanied by the `Secure` attribute flag.

*Incorrect:*
```http
Set-Cookie: token=xyz; SameSite=None ; ❌ Rejected by modern browsers!
```

*Fix:*
```http
Set-Cookie: token=xyz; SameSite=None; Secure
```


---

## 6. Practice Exercises

### Exercise 1: Header Auditor

**Problem:** Review this response header from a production login API. Identify the security vulnerability present:

`Set-Cookie: auth_token=jwt_value_here; SameSite=Strict; Path=/;`

- **A.** The cookie is missing the `SameSite` flag.
- **B.** JavaScript can steal this cookie because it is missing `HttpOnly`, and it can be intercepted over unsecured HTTP because it is missing `Secure`.
- **C.** The cookie path scope is too narrow.

> [!check]- Answer
> - **B** (The header is missing the `HttpOnly` and `Secure` attributes, leaving it vulnerable to XSS theft and packet sniffing).


---

### Exercise 2: Cookie Security Attribute Matrix

**Problem:** Match cookie attribute to protection function:
1. `HttpOnly` 
2. `Secure` 
3. `SameSite=Strict` 
4. `Domain` 

**Expected output:**
> [!check]- Answer
> ```text
> 1. Blocks JavaScript access (document.cookie) to prevent XSS theft
> 2. Restricts cookie transmission to HTTPS requests only
> 3. Blocks cross-site cookie transmission to prevent CSRF
> 4. Defines hostnames permitted to receive the cookie
> ```
> ```text
> 1. HttpOnly -> Protects against XSS token extraction.
> 2. Secure -> Protects against HTTP plaintext packet sniffing.
> 3. SameSite=Strict -> Protects against cross-site CSRF attacks.
> 4. Domain -> Restricts cookie scope to specified hosts.
> ```
> - **Explanation:** Combining cookie attributes creates defense-in-depth security.
---

### Exercise 3: Cookie Max-Age vs Expires

**Problem:** Which attribute parameter takes precedence if both `Expires` and `Max-Age` are present on a cookie?

**Expected output:**
> [!check]- Answer
> ```text
> Max-Age takes precedence in modern browsers.
> ```
> ```text
> Max-Age (takes relative lifetime in seconds and overrides Expires).
> ```
> - **Explanation:** `Max-Age` is the modern relative lifespan parameter in seconds.
---

## 7. Related Terms
- [CSRF (Cross-Site Request Forgery)](../level_04/csrf.md) — The cross-origin vulnerability mitigated by SameSite attributes.
- [XSS (Cross-Site Scripting)](../level_04/xss.md) — The injection vulnerability mitigated by HttpOnly.

---

## 8. Key Takeaways
- Cookie attributes configure security parameters directly inside `Set-Cookie` headers.
- `HttpOnly` blocks JavaScript access, protecting cookies from XSS script theft.
- `Secure` restricts cookie transmission to encrypted HTTPS connections.
- `SameSite` controls cookie sending on cross-site requests, mitigating CSRF attacks.
- `Lax` is the browser default, allowing cookie sends only on top-level safe navigations.
- `HttpOnly` does not defend against CSRF; it must be paired with `SameSite` configurations.
