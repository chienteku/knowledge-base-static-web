# HTTP / HTTPS

> **Level 1 — The Foundations of the Web**
> HyperText Transfer Protocol. The standardized rules (language) that Clients and Servers use to communicate with each other over the internet.

---

## 1. Prerequisites
- [Client-Server Model](client_server_model.md) — HTTP is the language these two entities use to talk.

---

## 2. Term Category

**Networking Protocol (Universal Web Standard .)**: HTTP / HTTPS is a fundamental concept in this technology stack. **Level 1 — The Foundations of the Web**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
If a Japanese person, a French person, and a Brazilian person all need to communicate, they must agree on a shared language (like English), or else their words are meaningless to each other. 
When the Web was invented in 1989 by Tim Berners-Lee, he realized that a Mac computer needed to be able to request a file from a Windows or Unix server. To make this possible, he invented **HTTP (HyperText Transfer Protocol)**. 
HTTP is simply a strict set of rules for formatting a text message. If the Client sends a text message formatted *exactly* according to HTTP rules, the Server is guaranteed to understand it, no matter what operating system or programming language either side is using.

### (2) Reality Metaphor
Imagine writing a formal business letter. 
If you send a blank envelope with a scribble inside, the post office will reject it. 
To successfully send the letter, you must follow the "Protocol": The recipient's address goes in the middle of the envelope, the stamp goes in the top right, and the letter inside starts with "Dear [Name]". HTTP is just a digital envelope format.

### (3) HTTP vs HTTPS
- **HTTP**: The original protocol. All messages are sent in plain text. If a hacker intercepts the message, they can read your password!
- **HTTPS (Secure)**: Uses SSL/TLS encryption. The Client and Server mathematically scramble the message before sending it. If a hacker intercepts it, it just looks like gibberish. **Modern web browsers will block sites that do not use HTTPS.**

### (4) The Anatomy of a raw HTTP Message
When your browser requests a website, it secretly sends a raw text string that looks like this:
```http
GET /index.html HTTP/1.1
Host: www.example.com
User-Agent: Mozilla/5.0
Accept-Language: en-US
```
*(You will rarely write this raw text yourself; tools like `fetch` or Postman generate it for you!)*

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Developing local APIs over HTTP and deploying them

**The mistake:** A developer builds their API on `http://localhost:3000`. They test it, it works perfectly, so they deploy the API to a live server on the internet using raw `http://`.

**Why it's wrong:** Modern browsers heavily restrict what raw HTTP sites can do. For example, you cannot access a user's Geolocation, Camera, or modern Storage APIs unless the site is served over HTTPS. Furthermore, Apple (iOS) will outright block mobile apps from communicating with non-HTTPS servers.
**Golden Rule:** `http://` is perfectly fine for local development on your laptop. But in production, you MUST use `https://`.

---

### Mistake 2: Serving Sensitive API Credentials over Unencrypted HTTP

**The mistake:** Sending Authorization headers or API keys over plain `http://` URLs.

**Why it's wrong:** HTTP transmits data in unencrypted plaintext across public routers, allowing attackers on public Wi-Fi to intercept passwords and tokens via packet sniffing.

*Incorrect:*
```http
POST /api/login HTTP/1.1
Host: api.example.com ; ❌ Sent over HTTP port 80 in cleartext!
```

*Fix:*
```http
POST /api/login HTTP/1.1
Host: api.example.com ; Enforced HTTPS port 443 with TLS encryption
```

---

### Mistake 3: Ignoring Mixed Content Warnings on HTTPS Pages

**The mistake:** Embedding `http://` script or API endpoints inside an `https://` web app.

**Why it's wrong:** Browsers block insecure HTTP network requests originating from HTTPS origins (Mixed Content error) to protect user security.

*Incorrect:*
```javascript
// Inside https://app.example.com
fetch('http://api.example.com/data'); // ❌ Blocked by browser mixed content policy!
```

*Fix:*
```javascript
// Update all API endpoints to use HTTPS
fetch('https://api.example.com/data');
```


---

## 5. Practice Exercises

### Exercise 1: HTTPS Enforcer & Security Protocol Upgrade Guard

**Scenario:** A web gateway middleware verifies incoming request URLs and enforces automatic HTTP to HTTPS protocol upgrades.

**Requirements:**
1. Write enforceHttpsUrl(requestUrl).
2. If protocol is "http:", replace with "https:".
3. Set secure port to 443 if standard port.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function enforceHttpsUrl(requestUrl) {
>   if (!requestUrl || typeof requestUrl !== "string") return null;
>
>   try {
>     const parsed = new URL(requestUrl);
>     if (parsed.protocol === "http:") {
>       parsed.protocol = "https:";
>       if (parsed.port === "80") {
>         parsed.port = "";
>       }
>       return {
>         redirectNeeded: true,
>         secureUrl: parsed.toString()
>       };
>     }
>     return {
>       redirectNeeded: false,
>       secureUrl: parsed.toString()
>     };
>   } catch (e) {
>     return null;
>   }
> }
>
> // Verification tests
> const res1 = enforceHttpsUrl("http://api.example.com:80/data");
> console.assert(res1.redirectNeeded === true, "Test 1 Failed");
> console.assert(res1.secureUrl === "https://api.example.com/data", "Test 2 Failed");
>
> const res2 = enforceHttpsUrl("https://secure.example.com/login");
> console.assert(res2.redirectNeeded === false, "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **HTTP vs HTTPS Difference**: HTTP transmits plain text over TCP; HTTPS encrypts all traffic using TLS (Transport Layer Security).
> 2. **Standard Port Numbers**: HTTP defaults to port 80; HTTPS defaults to port 443.
> 3. **Encryption Security**: HTTPS protects request headers, query parameters, cookies, and payloads from eavesdropping and tampering.
> 
---

### Exercise 2: HTTP Method Safety & Idempotency Auditor

**Scenario:** An API framework auditor classifies HTTP request methods into Safe (read-only) and Idempotent categories according to RFC specs.

**Requirements:**
1. Write auditHttpMethod(method).
2. Identify safe methods (GET, HEAD, OPTIONS).
3. Identify idempotent methods (GET, HEAD, OPTIONS, PUT, DELETE).

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function auditHttpMethod(method) {
>   if (typeof method !== "string") return null;
>   const m = method.toUpperCase();
>
>   const safeMethods = ["GET", "HEAD", "OPTIONS"];
>   const idempotentMethods = ["GET", "HEAD", "OPTIONS", "PUT", "DELETE"];
>
>   return {
>     method: m,
>     isSafe: safeMethods.includes(m),
>     isIdempotent: idempotentMethods.includes(m)
>   };
> }
>
> // Verification tests
> const getAudit = auditHttpMethod("GET");
> console.assert(getAudit.isSafe === true && getAudit.isIdempotent === true, "Test 1 Failed");
>
> const postAudit = auditHttpMethod("POST");
> console.assert(postAudit.isSafe === false && postAudit.isIdempotent === false, "Test 2 Failed");
>
> const putAudit = auditHttpMethod("PUT");
> console.assert(putAudit.isSafe === false && putAudit.isIdempotent === true, "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Safe HTTP Methods**: Safe methods (GET, HEAD) do not modify server state and are read-only.
> 2. **Idempotent HTTP Methods**: Executing idempotent methods (PUT, DELETE) multiple times produces identical server state as a single invocation.
> 3. **POST Non-Idempotency**: POST requests create new resources and are neither safe nor idempotent; multiple invocations create duplicate records.
> 
---

### Exercise 3: HSTS (Strict-Transport-Security) Header Evaluator

**Scenario:** A security audit tool parses Strict-Transport-Security headers to enforce browser HTTPS connections and preload security directives.

**Requirements:**
1. Write parseHstsHeader(headerVal).
2. Extract max-age in seconds.
3. Check includeSubDomains and preload flags.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function parseHstsHeader(headerVal) {
>   if (!headerVal || typeof headerVal !== "string") {
>     return { enabled: false };
>   }
>
>   const result = {
>     enabled: true,
>     maxAge: 0,
>     includeSubDomains: false,
>     preload: false
>   };
>
>   const parts = headerVal.split(";").map(p => p.trim());
>   for (const part of parts) {
>     const lower = part.toLowerCase();
>     if (lower.startsWith("max-age=")) {
>       const val = parseInt(part.split("=")[1], 10);
>       result.maxAge = isNaN(val) ? 0 : val;
>     } else if (lower === "includesubdomains") {
>       result.includeSubDomains = true;
>     } else if (lower === "preload") {
>       result.preload = true;
>     }
>   }
>
>   return result;
> }
>
> // Verification tests
> const header = "max-age=31536000; includeSubDomains; preload";
> const parsed = parseHstsHeader(header);
>
> console.assert(parsed.enabled === true, "Test 1 Failed");
> console.assert(parsed.maxAge === 31536000, "Test 2 Failed: 1 year in seconds");
> console.assert(parsed.includeSubDomains === true, "Test 3 Failed");
> console.assert(parsed.preload === true, "Test 4 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **HSTS Purpose**: Strict-Transport-Security forces compliant web browsers to interact with the server ONLY via HTTPS.
> 2. **Downgrade Attack Protection**: Prevents Man-in-the-Middle (MITM) SSL stripping attacks that attempt to downgrade connections to HTTP.
> 3. **max-age Directive**: Specifies the duration in seconds that the browser must remember to enforce HTTPS for the domain.
---

## 6. Related Terms
- [Request & Response Lifecycle](request_response.md) — How HTTP is used in practice.
- [REST (Representational State Transfer)](../level_03/rest.md) — An architectural style built entirely on top of HTTP.
- [Client-Server Model](client_server_model.md) — Related concept: Client-Server Model.
- [DNS (Domain Name System)](dns.md) — Related concept: DNS (Domain Name System).
- [IP Address & Port](ip_address_port.md) — Related concept: IP Address & Port.
- [SSL/TLS & the Handshake](ssl_tls_handshake.md) — Related concept: SSL/TLS & the Handshake.
- [TCP/IP (high-level)](tcp_ip.md) — Related concept: TCP/IP (high-level).
- [gRPC (Remote Procedure Call)](../level_10/grpc.md) — Related concept: gRPC (Remote Procedure Call).

---

## 7. Key Takeaways
- **HTTP** is the agreed-upon text format that allows computers to communicate.
- **HTTPS** is the encrypted, secure version of HTTP.
- Modern web development strictly requires **HTTPS** for production environments to protect user data and access browser features.
