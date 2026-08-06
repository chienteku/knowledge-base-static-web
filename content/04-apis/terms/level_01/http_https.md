# HTTP / HTTPS

> **Level 1 — The Foundations of the Web**
> HyperText Transfer Protocol. The standardized rules (language) that Clients and Servers use to communicate with each other over the internet.

---

## 1. Prerequisites
- [Client-Server Model](client_server_model.md) — HTTP is the language these two entities use to talk.

---

## 2. Term Category
- **Networking Protocol**

---

## 3. Environment Context
- **Universal Web Standard** (Layer 7 of the OSI model).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: The Coffee Shop Hacker

**Problem:** You are sitting in a Starbucks using their free public Wi-Fi. You log into your bank account. Why can't the malicious hacker sitting in the corner with a packet-sniffer read your banking password as it travels through the Wi-Fi airwaves?

**Expected output:**
> [!check]- Answer
> ```text
> Because your bank uses HTTPS! 
> The password is mathematically encrypted before it ever leaves your laptop's Wi-Fi antenna. The hacker captures the packet, but they only see scrambled nonsense.
> ```
> - What does the 'S' stand for?
> 
---

### Exercise 2: HTTPS Upgrade Enforcement Header

**Problem:** Which HTTP response header forces browsers to automatically upgrade all future requests to HTTPS for a given domain?

**Expected output:**
> [!check]- Answer
> ```text
> Strict-Transport-Security: max-age=31536000; includeSubDomains
> ```
> ```http
> Strict-Transport-Security: max-age=31536000; includeSubDomains
> ```
> - **Explanation:** HSTS prevents SSL stripping attacks by enforcing HTTPS browser-side.
---

### Exercise 3: Port Standard Mapping

**Problem:** What are the standard default TCP port numbers for HTTP and HTTPS traffic?

**Expected output:**
> [!check]- Answer
> ```text
> HTTP: Port 80
> HTTPS: Port 443
> ```
> ```text
> HTTP: Port 80
> HTTPS: Port 443
> ```
> - **Explanation:** Standard network protocols use well-known assigned port numbers.
---

## 7. Related Terms
- [Request & Response Lifecycle](request_response.md) — How HTTP is used in practice.
- [REST (Representational State Transfer)](../level_03/rest.md) — An architectural style built entirely on top of HTTP.
- [Client-Server Model](client_server_model.md) — Related concept: Client-Server Model.
- [DNS (Domain Name System)](dns.md) — Related concept: DNS (Domain Name System).
- [IP Address & Port](ip_address_port.md) — Related concept: IP Address & Port.
- [SSL/TLS & the Handshake](ssl_tls_handshake.md) — Related concept: SSL/TLS & the Handshake.
- [TCP/IP (high-level)](tcp_ip.md) — Related concept: TCP/IP (high-level).
- [gRPC (Remote Procedure Call)](../level_10/grpc.md) — Related concept: gRPC (Remote Procedure Call).

---

## 8. Key Takeaways
- **HTTP** is the agreed-upon text format that allows computers to communicate.
- **HTTPS** is the encrypted, secure version of HTTP.
- Modern web development strictly requires **HTTPS** for production environments to protect user data and access browser features.
