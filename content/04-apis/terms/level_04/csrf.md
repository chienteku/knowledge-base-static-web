# CSRF (Cross-Site Request Forgery)

> **Level 4 — Security & Authentication**
> Attack that rides a logged-in user's cookies; why tokens/SameSite exist.

---

## 1. Prerequisites
- [Session vs Token Authentication](./session_vs_token_auth.md) — The auth architectures utilizing cookies or tokens.
- [Cookies](../level_09/cookies.md) — The browser storage mechanism that attaches credentials automatically.

---

## 2. Term Category
- **Security**

---

## 3. Environment Context
- **Browser-Specific**: Relies entirely on the browser's automatic cookie-handling behavior.

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Browsers are designed to be convenient. By default, when a browser makes a request to a website, it **automatically attaches all cookies** associated with that domain, regardless of which website initiated the request. 

This behavior is exploited by **Cross-Site Request Forgery (CSRF)**:
1. You log into your bank at `https://mybank.com`. The bank stores a session ID in your browser cookies.
2. In another tab, you visit a malicious site `https://evil-hacker.com`.
3. The malicious site contains a hidden form or a script that triggers a request to `POST https://mybank.com/api/transfer?to=hacker&amount=5000`.
4. The browser sees a request going to `mybank.com`, automatically attaches your bank session cookie, and sends it.
5. The bank server receives the request, reads your valid session cookie, and transfers the money. You have been hacked without your knowledge.

#### Why Same-Origin Policy (SOP) does not prevent CSRF
The Same-Origin Policy blocks scripts on Domain A from *reading* the response data returned from Domain B. However, SOP **does not prevent Domain A from sending the request** and triggering write operations on Domain B. CSRF is a "write-only" exploit—the attacker does not need to read the response; they only want the action to execute.

---

### (2) Defenses against CSRF

#### 1. SameSite Cookie Attribute
This modern cookie configuration tells the browser when it is permitted to attach cookies to cross-site requests:
- **`SameSite=Strict`:** The browser never attaches the cookie to cross-site requests (even if you click a link to the site from an email or external forum).
- **`SameSite=Lax`:** (Default in modern browsers). The browser sends the cookie for "safe" top-level navigations (like clicking a standard link), but blocks it for subrequests like cross-site `POST` forms, images, or `fetch` calls.
- **`SameSite=None`:** Cookies are sent on all cross-site requests (requires the `Secure` flag, meaning it only works over HTTPS).

#### 2. Anti-CSRF Tokens (Synchronizer Token Pattern)
For older browsers or highly secure routes, servers generate a unique, random secret token for the user's session and embed it in the page HTML/metadata.
- When making a request, the client must read this token and attach it as a header (e.g. `X-CSRF-Token`) or form parameter.
- The server compares the submitted token against the session copy.
- Because a cross-site malicious script cannot read the token from your page's DOM (thanks to the Same-Origin Policy), the attacker's request lacks this token and is rejected by the server.

---

### (3) Reality Metaphor
- A **Session Cookie** is like a **physical security badge** pinned to your coat. Whenever you walk through a gateway, the guard sees the badge and lets you pass.
- **CSRF** is like a **thief hiding behind a bush** at the gateway. As you walk past, the thief pushes you toward the door and yells: *"Send all luggage to storage!"* The guard sees the badge pinned to your chest and opens the door, thinking you ordered it.
- **SameSite=Strict** is like keeping your badge in an **inner pocket**. It is only visible when you are walking inside your own facility; if you approach from an outside street, the badge is hidden.
- **Anti-CSRF Tokens** are like the guard demanding a **changing daily password**. The thief behind the bush cannot read the password notebook inside your pocket, so their attempt to push you through fails.

---

### (4) Code Example: Configuring SameSite Cookies in Node.js

```javascript
import express from 'express';
const app = express();

app.post('/api/login', (req, res) => {
  // Set session ID cookie with secure flags
  res.cookie('sessionId', 'abc123xyz', {
    httpOnly: true, // Prevents XSS scripts from reading the cookie
    secure: true,   // Forces cookie transport only over HTTPS
    sameSite: 'lax' // Blocks CSRF on cross-site POST form requests!
  });
  
  res.send('Logged in successfully!');
});
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Believing stateless JWT token APIs are naturally immune to CSRF

**The mistake:** Storing your stateless JWT access token inside a cookie, and assuming that because you are using tokens instead of sessions, you are safe from CSRF.

**Why it's wrong:** The browser does not care if the cookie contains a session ID or a JWT token. If the credential is in a cookie, the browser will attach it to cross-site requests automatically.

*Fix:* If you store JWTs in cookies, configure `SameSite=Lax` or `Strict` and implement anti-CSRF headers. If you store the JWT in client memory or `localStorage`, the app is immune to CSRF (since JavaScript must attach the token manually, and cross-site forms cannot access it), but it becomes vulnerable to XSS theft.

---

### Mistake 2: Relying Solely on Cookies for Authentication Without Anti-CSRF Tokens

**The mistake:** Authenticating state-changing POST requests using standard session cookies without CSRF protection.

**Why it's wrong:** Browsers automatically attach cookies to cross-site requests. A malicious website can submit a hidden form POST to `bank.com/transfer` and browser sends session cookies automatically.

*Incorrect:*
```html
<!-- Malicious site HTML -->
<form action="https://bank.com/transfer" method="POST">
  <input type="hidden" name="amount" value="1000">
</form> <!-- ❌ Executes using victim's auto-attached cookies! -->
```

*Fix:*
```javascript
// Require Anti-CSRF token in custom request header OR use SameSite=Strict cookies:
res.cookie('session', id, { sameSite: 'strict', httpOnly: true });
```

---

### Mistake 3: Assuming CORS Settings Protect Server Endpoints from CSRF Form Submissions

**The mistake:** Believing CORS restrictions prevent malicious sites from submitting HTML forms to your server.

**Why it's wrong:** CORS prevents malicious sites from *reading* the response, but simple HTML form `<form method="POST">` submissions still *execute* on the server!

*Incorrect:*
```http
/* Relying on CORS to block CSRF state-changing attacks */
```

*Fix:*
```http
/* Implement CSRF tokens or SameSite cookie attributes */
```


---

## 6. Practice Exercises

### Exercise 1: CSRF Risk Assessor

**Problem:** Evaluate the vulnerability of the API endpoint setup:

1. A GET request (`GET /api/profile`) returning profile details, using session cookies with no SameSite config.
2. A POST request (`POST /api/settings`) updating user settings, using session cookies with no SameSite config.
3. A POST request (`POST /api/settings`) where the client reads a custom header `X-CSRF-Token` from the page DOM and attaches it.
4. An API using JWT tokens stored strictly in browser `localStorage`.

> [!check]- Answer
> - 1. **Low Risk** (GET is read-only. While the request runs, SOP prevents the hacker from reading the returned profile data).
> - 2. **High Risk** (State-mutating POST request. Browser attaches the cookie automatically, executing the settings change).
> - 3. **No Risk** (The hacker's cross-site script cannot read the token from your DOM, so the server rejects the request).
> - 4. **No Risk** (The browser does not attach localStorage contents automatically; they must be attached manually by the app code).


---

### Exercise 2: SameSite Cookie Attribute Defense

**Problem:** Compare `SameSite=Strict`, `SameSite=Lax`, and `SameSite=None` cookie settings for CSRF mitigation.

**Expected output:**
> [!check]- Answer
> ```text
> Strict: Cookie never sent in cross-site requests.
> Lax: Cookie sent on top-level GET navigation only (default).
> None: Cookie sent on all cross-site requests (requires Secure).
> ```
> ```text
> Strict -> Blocks all cross-site cookie transmission.
> Lax -> Permits cookies on top-level GET links only.
> None -> Disables CSRF cookie protection (requires Secure).
> ```
> - **Explanation:** `SameSite=Strict` or `Lax` blocks automatic cross-site form cookie attachments.
---

### Exercise 3: Custom Header CSRF Mitigation

**Problem:** Why does sending custom headers (e.g. `X-Requested-With` or `Authorization: Bearer`) prevent HTML form CSRF attacks?

**Expected output:**
> [!check]- Answer
> ```text
> Standard HTML forms cannot set custom headers. Adding custom headers forces browsers to issue a CORS preflight OPTIONS request, which is blocked if cross-site origins are disallowed.
> ```
> ```text
> Standard HTML forms cannot set custom headers. Adding custom headers forces browsers to issue a CORS preflight OPTIONS request, which is blocked if cross-site origins are disallowed.
> ```
> - **Explanation:** Custom headers trigger CORS preflights, thwarting simple form CSRF exploits.
---

## 7. Related Terms
- [XSS (Cross-Site Scripting)](./xss.md) — The script injection attack that can steal credentials directly.
- [Cookies](../level_09/cookies.md) — The browser storage mechanism targeted by CSRF.

---

## 8. Key Takeaways
- CSRF forces a user's browser to send authenticated requests to a target website using cached cookies.
- SOP does not prevent CSRF because it blocks reading responses, not sending requests.
- Configure `SameSite=Lax` or `Strict` on cookies to prevent browsers from sending them on cross-site POST requests.
- Anti-CSRF tokens verify that requests originated from your application's user interface.
- Storing credentials in localStorage blocks CSRF but leaves them vulnerable to XSS theft.
