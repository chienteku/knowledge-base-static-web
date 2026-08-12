# Same-Origin Policy

> **Level 4 — Security & Authentication**
> The default browser rule isolating one origin from another.

---

## 1. Prerequisites
- [URL / URI (Uniform Resource Identifier)](../level_01/url_uri.md) — The address containing protocol, host, and port parts.
- [Client-Server Model](../level_01/client_server_model.md) — The network request-response architecture.

---

## 2. Term Category

**Security (Browser-Specific: Enforced strictly by web browsers . It does not apply to server-to-server calls or tools like Postman.)**: Same-Origin Policy is a fundamental concept in this technology stack. **Level 4 — Security & Authentication**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Web browsers run code from untrusted servers simultaneously in separate tabs. Imagine you have two tabs open in your browser:
- Tab 1 is logged into your bank account (`https://mybank.com`).
- Tab 2 is viewing a malicious forum (`https://evil-hacker.com`).

If the browser allowed scripts from one tab to read or modify data in other tabs, the script running on `evil-hacker.com` could inspect the bank tab's HTML, steal your password, or copy your session cookies. 

To prevent this cross-site data theft, browsers enforce a foundational security boundary called the **Same-Origin Policy (SOP)**.

---

### (2) What constitutes an "Origin"?
An origin is defined by the combination of three components:
$$\text{Origin} = \text{Protocol (Scheme)} + \text{Host (Domain)} + \text{Port}$$

If any of these three parts differ between two URLs, they are considered **Cross-Origin**, and the browser blocks scripts on one origin from reading data on the other.

#### Origin Comparison Table (Target: `https://example.com`)
Assuming a script is running on a page loaded from **`https://example.com`** (which implicitly uses HTTPS standard port `443`):

| URL being queried | Same Origin? | Reason |
|---|---|---|
| `https://example.com/about` | **Yes** | Same protocol, host, and port. |
| `http://example.com` | **No** | Different protocol (`http` vs `https`). |
| `https://api.example.com` | **No** | Different host (`api.example.com` vs `example.com`). |
| `https://example.com:8080` | **No** | Different port (`8080` vs `443`). |

---

### (3) SOP Restrictions & Relaxations
The Same-Origin Policy controls what scripts can do across origins:
- **What it Blocks:** A script from Origin A cannot read the DOM of Origin B, cannot read cookies or localStorage belonging to Origin B, and cannot read raw response text from `fetch()` or `XMLHttpRequest` requests sent to Origin B.
- **What it Allows:** Embedding cross-origin media is permitted. Your page can load stylesheets (`<link href="...">`), images (`<img src="...">`), and scripts (`<script src="...">`) hosted on other domains.
- **How to bypass it safely:** When you intentionally want to allow cross-origin API queries, the server must implement **CORS (Cross-Origin Resource Sharing)**.

### (4) Reality Metaphor
Imagine a high-security hotel.
- Each room represents a unique **Origin** (e.g. `Room 204`).
- **SOP** is the hotel's lock policy: guests in `Room 204` are sandboxed to their own room. They cannot walk into `Room 205` to read private documents or take items out of drawers.
- If the guest in `Room 204` wants to borrow a hairdryer from `Room 205`, they cannot just take it. The guest in `Room 205` must hand it to them through the door explicitly (**CORS consent**).

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Believing SOP prevents a cross-origin request from hitting your server

**The mistake:** Assuming that because SOP is active, a malicious script on `evil.com` cannot trigger a database write operation on your backend at `api.com`.

**Why it's wrong:** SOP is a **client-side browser check**, not a network firewall. When a script makes a cross-origin request, the browser **does send** the request to the server, and the server **does process** it and write to the database. However, when the response returns, the browser inspects the origin and blocks the client script from *reading* the returned data. If the request was state-mutating, the damage is already done.

*Fix:* Implement proper authentication tokens (CSRF tokens) and state verification checks on the server; never rely on SOP to protect write routes.

---

### Mistake 2: Believing Same-Origin Policy (SOP) Applies to Backend Server-to-Server Requests

**The mistake:** Expecting Node.js `axios` backend requests to fail due to SOP browser security rules.

**Why it's wrong:** The Same-Origin Policy is enforced EXCLUSIVELY by web browsers. Backend server environments (Node.js, Python, Go) ignore SOP and CORS completely.

*Incorrect:*
```http
/* Trying to debug CORS/SOP errors on backend Node.js server scripts */
```

*Fix:*
```http
/* Understand SOP applies only inside web browser sandbox environments */
```

---

### Mistake 3: Confusing Subdomains as Being the Same Origin

**The mistake:** Expecting `https://app.example.com` and `https://api.example.com` to share the same origin.

**Why it's wrong:** Subdomains (`app.` vs `api.`) are distinct hostnames. Different hostnames constitute a Cross-Origin request requiring CORS headers.

*Incorrect:*
```http
/* Assuming app.example.com and api.example.com are Same-Origin */
```

*Fix:*
```http
/* Configure CORS headers on api.example.com to allow app.example.com origin */
```


---

## 5. Practice Exercises

### Exercise 1: Same-Origin Policy (SOP) Tuple Evaluator

**Scenario:** A browser security engine evaluates two URLs to check if they share the exact same Origin tuple (Protocol, Host, Port).

**Requirements:**
1. Write isSameOrigin(urlA, urlB).
2. Compare protocol, hostname, and port.
3. Return boolean.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function isSameOrigin(urlA, urlB) {
>   try {
>     const a = new URL(urlA);
>     const b = new URL(urlB);
>
>     const portA = a.port || (a.protocol === "https:" ? "443" : "80");
>     const portB = b.port || (b.protocol === "https:" ? "443" : "80");
>
>     return (
>       a.protocol === b.protocol &&
>       a.hostname === b.hostname &&
>       portA === portB
>     );
>   } catch (err) {
>     return false;
>   }
> }
>
> // Verification tests
> console.assert(isSameOrigin("https://example.com/page1", "https://example.com/page2") === true, "Test 1 Failed");
> console.assert(isSameOrigin("http://example.com", "https://example.com") === false, "Test 2 Failed: Protocol mismatch");
> console.assert(isSameOrigin("https://api.example.com", "https://example.com") === false, "Test 3 Failed: Subdomain mismatch");
> console.assert(isSameOrigin("https://example.com:8080", "https://example.com:443") === false, "Test 4 Failed: Port mismatch");
> ```
>
> #### Technical Explanation
>
> 1. **Origin Definition**: Origin tuple consists of Protocol + Hostname + Port.
> 2. **Same-Origin Policy Core Rule**: Browsers restrict scripts on Origin A from reading DOM or response data from Origin B.
> 3. **Port & Protocol Strictness**: Even minor differences (http vs https, port 80 vs 8080) constitute cross-origin isolation.
> 
---

### Exercise 2: Cross-Origin Read Restriction Auditor

**Scenario:** Demonstrates SOP restriction rules: Cross-Origin Writes/Embeds are permitted, but Cross-Origin Reads are blocked.

**Requirements:**
1. Write auditSopOperation(opType, targetUrl, currentOrigin).
2. Classify operation as EMBED (allowed), WRITE (allowed), or READ (blocked by SOP).

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function auditSopOperation(opType, targetUrl, currentOrigin) {
>   const same = isSameOrigin(targetUrl, currentOrigin);
>   if (same) {
>     return { allowed: true, reason: "Same Origin" };
>   }
>
>   if (opType === "EMBED") {
>     return { allowed: true, reason: "Cross-Origin Embed allowed" };
>   }
>   if (opType === "WRITE") {
>     return { allowed: true, reason: "Cross-Origin Write allowed" };
>   }
>   if (opType === "READ") {
>     return { allowed: false, reason: "Blocked by Same-Origin Policy (Requires CORS)" };
>   }
>
>   return { allowed: false, reason: "Disallowed operation" };
> }
>
> // Verification tests
> const cur = "https://app.com";
> console.assert(auditSopOperation("EMBED", "https://cdn.com/image.png", cur).allowed === true, "Test 1 Failed");
> console.assert(auditSopOperation("READ", "https://api.com/data", cur).allowed === false, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **SOP Read Isolation**: SOP prevents attacker sites from reading private user data from banking APIs via fetch/XHR.
> 2. **Embedding Exceptions**: Browsers permit embedding cross-origin images (<img>), scripts (<script>), and stylesheets (<link>).
> 3. **CORS as SOP Exemption**: CORS provides an explicit mechanism for servers to opt out of SOP read restrictions.
> 
---

### Exercise 3: postMessage Cross-Origin Window Communication Guard

**Scenario:** A web application uses `window.postMessage` to communicate securely across iframe origin boundaries, validating `event.origin`.

**Requirements:**
1. Write handlePostMessage(event, trustedOrigin, handlerFn).
2. Verify event.origin === trustedOrigin before executing handlerFn.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function handlePostMessage(event, trustedOrigin, handlerFn) {
>   if (!event || typeof event.origin !== "string") {
>     return { status: 400, error: "Invalid postMessage event" };
>   }
>
>   if (event.origin !== trustedOrigin) {
>     return { status: 403, error: `Security Violation: Ignored postMessage from untrusted origin '${event.origin}'` };
>   }
>
>   const result = handlerFn(event.data);
>   return { status: 200, result };
> }
>
> // Verification tests
> const mockHandler = (data) => `Processed: ${data.msg}`;
>
> const validEvent = { origin: "https://trusted.com", data: { msg: "Hello" } };
> const res1 = handlePostMessage(validEvent, "https://trusted.com", mockHandler);
> console.assert(res1.status === 200 && res1.result === "Processed: Hello", "Test 1 Failed");
>
> const maliciousEvent = { origin: "https://evil.com", data: { msg: "Hack" } };
> console.assert(handlePostMessage(maliciousEvent, "https://trusted.com", mockHandler).status === 403, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **window.postMessage API**: Enables safe cross-origin communication between parent window and child iframe.
> 2. **Mandatory Origin Validation**: ALWAYS verify event.origin in message listeners to prevent cross-site scripting vulnerabilities.
> 3. **Explicit Target Origin**: Specify targetOrigin in postMessage(data, targetOrigin) instead of wildcard *.
---

## 6. Related Terms
- [CORS (Cross-Origin Resource Sharing)](cors.md) — The protocol relaxations enabling safe cross-origin API queries.
- [CSRF (Cross-Site Request Forgery)](csrf.md) — The session-riding exploit that bypasses SOP write-blindness.
- [Preflight Request (OPTIONS)](preflight_request.md) — Related concept: Preflight Request (OPTIONS).
- [CORS Errors in the Browser](../level_05/cors_errors.md) — Related concept: CORS Errors in the Browser.

---

## 7. Key Takeaways
- Same-Origin Policy is a fundamental browser-enforced security wall.
- An origin is the exact match of protocol, host domain, and port.
- SOP prevents scripts on one domain from reading the DOM, cookies, or fetch responses of another domain.
- SOP allows embedding resources (images, scripts) but blocks reading cross-origin response data.
- SOP is a client-side restriction; the request is still sent to the server, meaning servers must protect database-mutating routes on their own.
