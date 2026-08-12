# SSL/TLS & the Handshake

> **Level 1 — Foundations of the Web**
> How HTTPS encrypts a connection before any data is sent.

---

## 1. Prerequisites
- [HTTP / HTTPS](http_https.md) — The web protocols requiring encryption.

---

## 2. Term Category

**Security (Universal: Initiated automatically by browsers and network clients .)**: SSL/TLS & the Handshake is a fundamental concept in this technology stack. **Level 1 — Foundations of the Web**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: TLS Handshake Step Order Simulator

**Scenario:** A network security auditor simulates the steps of a TLS 1.3 handshake sequence between client and server.

**Requirements:**
1. Write simulateTlsHandshake(clientHello).
2. Step 1: ClientHello.
3. Step 2: ServerHello + Certificate.
4. Step 3: Key Exchange.
5. Return session established status.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function simulateTlsHandshake(clientConfig) {
>   if (!clientConfig || !clientConfig.supportedVersions.includes("TLSv1.3")) {
>     return { success: false, error: "Protocol Version Mismatch" };
>   }
>
>   const steps = [];
>   steps.push("ClientHello (TLSv1.3)");
>   steps.push("ServerHello + Certificate + KeyShare");
>   steps.push("Client Finished");
>   steps.push("Server Finished");
>
>   return {
>     success: true,
>     protocol: "TLSv1.3",
>     handshakeSteps: steps,
>     encryptedSessionReady: true
>   };
> }
>
> // Verification tests
> const res = simulateTlsHandshake({ supportedVersions: ["TLSv1.2", "TLSv1.3"] });
> console.assert(res.success === true, "Test 1 Failed");
> console.assert(res.protocol === "TLSv1.3", "Test 2 Failed");
> console.assert(res.handshakeSteps.length === 4, "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **TLS Handshake Purpose**: Establishes cryptographic keys and authenticates server certificate before application data is sent.
> 2. **TLS 1.3 Latency Optimization**: TLS 1.3 completes handshake in 1 Round-Trip Time (1-RTT) compared to 2-RTT in TLS 1.2.
> 3. **Asymmetric to Symmetric Encryption**: Asymmetric encryption verifies certificate; symmetric encryption encrypts high-volume session data.
> 
---

### Exercise 2: X.509 Certificate Expiry & Hostname Verification

**Scenario:** An HTTPS client verifies server SSL/TLS certificate expiration date and hostname match before accepting connection.

**Requirements:**
1. Write verifySslCertificate(cert, targetHostname).
2. Check validFrom and validTo dates.
3. Check subjectAltNames for targetHostname.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function verifySslCertificate(cert, targetHostname) {
>   if (!cert || !cert.validTo || !cert.subjectAltNames) {
>     return { valid: false, reason: "Malformed Certificate" };
>   }
>
>   const now = Date.now();
>   const validTo = new Date(cert.validTo).getTime();
>   const validFrom = new Date(cert.validFrom).getTime();
>
>   if (now < validFrom || now > validTo) {
>     return { valid: false, reason: "Certificate Expired" };
>   }
>
>   const hostnameMatch = cert.subjectAltNames.some(domain => {
>     if (domain.startsWith("*.")) {
>       const baseDomain = domain.slice(2);
>       return targetHostname.endsWith(baseDomain);
>     }
>     return domain === targetHostname;
>   });
>
>   if (!hostnameMatch) {
>     return { valid: false, reason: "Hostname Mismatch" };
>   }
>
>   return { valid: true };
> }
>
> // Verification tests
> const cert = {
>   validFrom: "2026-01-01",
>   validTo: "2026-12-31",
>   subjectAltNames: ["*.example.com", "example.com"]
> };
>
> console.assert(verifySslCertificate(cert, "api.example.com").valid === true, "Test 1 Failed");
> console.assert(verifySslCertificate(cert, "other.com").valid === false, "Test 2 Failed: Hostname mismatch");
> ```
>
> #### Technical Explanation
>
> 1. **Certificate Authority (CA)**: Trusted third parties (e.g. Let's Encrypt) digitally sign server certificates.
> 2. **Subject Alternative Name (SAN)**: Lists all hostnames and wildcard domains (*.example.com) secured by the certificate.
> 3. **Certificate Expiration Risk**: Expired certificates cause browsers to show security warning screens to users.
> 
---

### Exercise 3: Cipher Suite Compatibility Inspector

**Scenario:** A security scanner inspects server-offered cipher suites and flags weak deprecated encryption algorithms (e.g. RC4, 3DES, MD5).

**Requirements:**
1. Write auditCipherSuite(cipherString).
2. Flag insecure algorithms.
3. Return audit object.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function auditCipherSuite(cipherString) {
>   if (typeof cipherString !== "string") return { secure: false };
>
>   const insecureKeywords = ["RC4", "3DES", "MD5", "NULL", "ANON", "EXPORT"];
>   const upper = cipherString.toUpperCase();
>
>   const isWeak = insecureKeywords.some(kw => upper.includes(kw));
>
>   return {
>     cipher: cipherString,
>     secure: !isWeak,
>     recommended: upper.includes("AES") || upper.includes("CHACHA20")
>   };
> }
>
> // Verification tests
> console.assert(auditCipherSuite("TLS_AES_256_GCM_SHA384").secure === true, "Test 1 Failed");
> console.assert(auditCipherSuite("TLS_RSA_WITH_RC4_128_SHA").secure === false, "Test 2 Failed: RC4 is weak");
> ```
>
> #### Technical Explanation
>
> 1. **Cipher Suite Components**: Defines Key Exchange, Authentication, Bulk Encryption (e.g. AES-GCM), and Message Authentication (e.g. SHA256).
> 2. **Deprecating Legacy Algorithms**: RC4, 3DES, and MD5 are vulnerable to attacks and blocked in modern HTTPS configurations.
> 3. **Forward Secrecy (PFS)**: Modern ciphers (ECDHE) ensure compromised private keys cannot decrypt past recorded sessions.
---

## 6. Related Terms
- [HTTP / HTTPS](http_https.md) — The application protocols secured by SSL/TLS.
- [API Keys](../level_04/api_keys.md) — Authentication tokens that must be sent over HTTPS to prevent interception.

---

## 7. Key Takeaways
- SSL/TLS wraps clear HTTP traffic inside an encrypted secure tunnel, preventing Man-in-the-Middle snooping.
- TLS is the modern standard protocol; SSL is legacy.
- The TLS Handshake validates the server's identity using SSL certificates signed by Certificate Authorities (CAs).
- The handshake uses asymmetric encryption to negotiate keys, then switches to fast symmetric encryption to transmit actual HTTP data.
- HTTPS only secures data in transit; it does not protect databases from application-layer validation exploits.
