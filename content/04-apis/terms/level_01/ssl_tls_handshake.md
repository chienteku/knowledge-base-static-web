# SSL/TLS & the Handshake

> **Level 1 — Foundations of the Web**
> How HTTPS encrypts a connection before any data is sent.

---

## 1. Prerequisites
- [HTTP / HTTPS](http_https.md) — The web protocols requiring encryption.

---

## 2. Term Category
- **Security**

---

## 3. Environment Context
- **Universal**: Initiated automatically by browsers and network clients (like `fetch`).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Standard HTTP traffic is sent in clear, readable plain text. Anyone sitting on the same local network router (or any internet service provider along the path) can intercept your packets and read your passwords, credit card numbers, or API keys in plain text. This is called a **Man-in-the-Middle (MITM) attack**.

To secure the web, we use **HTTPS**, which wraps standard HTTP traffic inside a secure cryptographic tunnel using **SSL/TLS**:
- **SSL vs. TLS:** SSL (Secure Sockets Layer) is the legacy name for the protocol. **TLS (Transport Layer Security)** is the modern, secure version. We use TLS in production, though developers still write "SSL" out of habit.
- **The TLS Handshake:** Before any HTTP request data is sent, after the lower-level TCP connection is established, the client and server must perform a **TLS Handshake** to prove identities and negotiate encryption keys:

```text
Client                                                   Server
  │                                                        │
  │ ── 1. Client Hello (Supported TLS versions & ciphers) ─>
  │                                                        │
  │ <─ 2. Server Hello (Chosen cipher + SSL Certificate) ──
  │                                                        │
  │ ── 3. Key Exchange (Verify cert & exchange parameters) ─>
  │                                                        │
  │ <─ 4. Session Ready (Verify shared secret key) ────────
  ▼                                                        ▼
   [ Encrypted Symmetric Tunnel Established: HTTP Data Flows ]
```

#### Hybrid Encryption Strategy
The handshake uses a clever hybrid strategy to combine security with speed:
- **Asymmetric Encryption (Public/Private Keys):** Used during the handshake because it is secure. The client uses the server's public key (from its certificate) to securely negotiate a secret code.
- **Symmetric Encryption (Single Shared Key):** Once the handshake ends, both sides use a shared session key to encrypt/decrypt subsequent HTTP data. Symmetric encryption is **100x faster** than asymmetric encryption, preventing server CPU bottlenecking.

#### Certificate Authorities (CAs)
How do we know the server is who it claims to be? The server sends an **SSL Certificate**. Your browser validates this certificate against a built-in trust list of **Certificate Authorities (CAs)** (like Let's Encrypt or DigiCert). If the certificate signature is valid, you know you are talking to the real server, not an imposter.

### (2) Reality Metaphor
- **HTTP** is like writing your credit card details on a **postcard** and dropping it in the mail. Every postal worker who sorts the card can read the numbers.
- **TLS Handshake** is like meeting a banker in public to trade key combinations:
  1. You walk up and say: *"I speak English, and I have a red padlock"* (Client Hello).
  2. The banker replies: *"English is fine. Here is my official state-stamped ID badge"* (Server Hello + Certificate).
  3. You inspect the badge and confirm the state signature is authentic (Validation).
  4. You write a random code on a paper, lock it inside a safe box, and hand it over. The banker opens the safe using a private key. Now you both know the secret code (Symmetric Key Exchange).
  5. From now on, you place all messages inside locked lockboxes using that secret code code. Anyone who steals the postcard only sees locked metal boxes they cannot open.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Expecting HTTPS to protect against database hacks or code bugs

**The mistake:** Assuming that because your site displays the padlock icon (`https://`), your backend database is completely safe from SQL injection or malicious payload attacks.

**Why it's wrong:** HTTPS only protects **data in transit** (while it is traveling across the network cables). Once the request reaches your server, the TLS layer decrypts it and hands the raw plain-text payload to your web application code. If your backend lacks parameter validation, hackers can still compromise your database.

---

### Mistake 2: Disabling TLS Certificate Validation in Production API Clients

**The mistake:** Setting `NODE_TLS_REJECT_UNAUTHORIZED = '0'` or `rejectUnauthorized: false` to bypass SSL errors in production Node.js apps.

**Why it's wrong:** Disabling SSL certificate validation allows attackers to execute Man-In-The-Middle (MITM) attacks by presenting self-signed certificates.

*Incorrect:*
```javascript
// Node.js environment override
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // ❌ Disables TLS security globally!
```

*Fix:*
```javascript
// Install valid SSL certificates (e.g. Let's Encrypt) on backend server instead of disabling verification.
```

---

### Mistake 3: Ignoring TLS Handshake Latency overhead in Non-HTTP/2 Environments

**The mistake:** Opening new TCP/TLS connections for every single micro-request instead of enabling HTTP Keep-Alive connection reuse.

**Why it's wrong:** A full TLS 1.2 handshake requires 2 full round-trips (2 RTT) of network exchange before payload data transmission can begin. Connection pooling reuses open TLS tunnels.

*Incorrect:*
```http
// Creating new HTTPS agent per request without connection pooling
```

*Fix:*
```javascript
// Keep-Alive HTTP Agent reuses existing TLS connection:
const agent = new https.Agent({ keepAlive: true });
```


---

## 6. Practice Exercises

### Exercise 1: Cryptographic Matchmaker

**Problem:** Match the task to the correct cryptographic approach:

1. Verification that `api.stripe.com` actually belongs to Stripe Inc. and not a hacker.
2. Encrypting the 10MB JSON response payload sent back from the server.
3. Exchanging parameters to create the shared session key during the handshake.

> [!check]- Answer
> - 1. **Certificate Authority (CA) validation** (Identity verification using signed public-key certificates).
> - 2. **Symmetric Encryption** (Fast throughput encryption for large payloads).
> - 3. **Asymmetric Encryption** (Secure key negotiation using public/private key pairs).


---

### Exercise 2: Asymmetric vs Symmetric Encryption in TLS

**Problem:** Explain the role of Asymmetric vs Symmetric encryption during a TLS Handshake.

**Expected output:**
> [!check]- Answer
> ```text
> Asymmetric (Public/Private key) encryption is used during initial handshake to authenticate server identity and exchange session keys. Symmetric encryption uses the shared session key to encrypt actual data streams efficiently.
> ```
> ```text
> Asymmetric (Public/Private key) -> Authentication and session key exchange.
> Symmetric (Shared session key) -> High-speed bulk data payload encryption.
> ```
> - **Explanation:** TLS combines asymmetric key exchange with fast symmetric stream encryption.
---

### Exercise 3: TLS 1.2 vs TLS 1.3 Handshake Round Trips

**Problem:** How many network round-trips (RTT) are required for an initial TLS 1.2 handshake vs a TLS 1.3 handshake?

**Expected output:**
> [!check]- Answer
> ```text
> TLS 1.2: 2 RTT
> TLS 1.3: 1 RTT (and 0 RTT for session resumption)
> ```
> ```text
> TLS 1.2: 2 RTT
> TLS 1.3: 1 RTT (0-RTT for session resumption)
> ```
> - **Explanation:** TLS 1.3 reduces latency by completing handshake negotiation in a single RTT.
---

## 7. Related Terms
- [HTTP / HTTPS](http_https.md) — The application protocols secured by SSL/TLS.
- [API Keys](../level_04/api_keys.md) — Authentication tokens that must be sent over HTTPS to prevent interception.

---

## 8. Key Takeaways
- SSL/TLS wraps clear HTTP traffic inside an encrypted secure tunnel, preventing Man-in-the-Middle snooping.
- TLS is the modern standard protocol; SSL is legacy.
- The TLS Handshake validates the server's identity using SSL certificates signed by Certificate Authorities (CAs).
- The handshake uses asymmetric encryption to negotiate keys, then switches to fast symmetric encryption to transmit actual HTTP data.
- HTTPS only secures data in transit; it does not protect databases from application-layer validation exploits.
