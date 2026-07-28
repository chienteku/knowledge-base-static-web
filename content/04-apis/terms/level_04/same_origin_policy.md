# Same-Origin Policy

> **Level 4 — Security & Authentication**
> The default browser rule isolating one origin from another.

---

## 1. Prerequisites
- [URL / URI](../level_01/url_uri.md) — The address containing protocol, host, and port parts.
- [Client-Server Model](../level_01/client_server_model.md) — The network request-response architecture.

---

## 2. Term Category
- **Security**

---

## 3. Environment Context
- **Browser-Specific**: Enforced strictly by web browsers (Chrome, Safari, Firefox, Edge). It does not apply to server-to-server calls or tools like Postman.

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Origin Inspector

**Problem:** You are running a script on `http://localhost:3000`. Determine if the browser will allow the script to read raw data from the following URLs:

1. `http://localhost:3000/api/data`
2. `https://localhost:3000/api/data`
3. `http://127.0.0.1:3000/api/data`
4. `http://localhost:4000/api/data`

> [!check]- Answer
> - 1. **Allowed** (Same protocol, host, and port).
> - 2. **Blocked** (Protocol differs: `http` vs `https`).
> - 3. **Blocked** (Host string differs: `localhost` vs numerical loopback `127.0.0.1`).
> - 4. **Blocked** (Port differs: `3000` vs `4000`).


---

### Exercise 2: Same-Origin Evaluation Matrix

**Problem:** Given target origin `https://example.com:443/page.html`, evaluate if request is Same-Origin (Yes/No):
1. `https://example.com/about.html` 
2. `http://example.com/about.html` 
3. `https://api.example.com/about.html` 
4. `https://example.com:8080/about.html` 

**Expected output:**
> [!check]- Answer
> ```text
> 1. Yes (Same scheme, host, port)
> 2. No (Different scheme http vs https)
> 3. No (Different host api.example.com)
> 4. No (Different port 8080 vs 443)
> ```
> ```text
> 1. Yes -> Scheme, host, and port match.
> 2. No  -> Scheme mismatch (http vs https).
> 3. No  -> Host mismatch (subdomain).
> 4. No  -> Port mismatch (8080 vs 443).
> ```
> - **Explanation:** SOP requires exact 3-tuple match of Scheme, Host, and Port.
---

### Exercise 3: SOP Bypass Mechanisms

**Problem:** List 2 legitimate browser mechanisms used to bypass default SOP restrictions.

**Expected output:**
> [!check]- Answer
> ```text
> 1. CORS (Cross-Origin Resource Sharing headers)
> 2. WebSocket connections (ws:// / wss://)
> ```
> ```text
> 1. CORS (Cross-Origin Resource Sharing headers)
> 2. WebSockets (wss://)
> ```
> - **Explanation:** CORS and WebSockets allow controlled cross-origin browser communication.
---

## 7. Related Terms
- [CORS (Cross-Origin Resource Sharing)](./cors.md) — The protocol relaxations enabling safe cross-origin API queries.
- [CSRF (Cross-Site Request Forgery)](./csrf.md) — The session-riding exploit that bypasses SOP write-blindness.

---

## 8. Key Takeaways
- Same-Origin Policy is a fundamental browser-enforced security wall.
- An origin is the exact match of protocol, host domain, and port.
- SOP prevents scripts on one domain from reading the DOM, cookies, or fetch responses of another domain.
- SOP allows embedding resources (images, scripts) but blocks reading cross-origin response data.
- SOP is a client-side restriction; the request is still sent to the server, meaning servers must protect database-mutating routes on their own.
