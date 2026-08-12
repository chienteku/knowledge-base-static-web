# The crypto Module

> **Level 2 — Core Modules & Globals**
> A built-in Node.js module that provides cryptographic functionality, including wrappers for OpenSSL's hash, HMAC, cipher, decipher, sign, and verify functions.

---

## 1. Prerequisites
- [The process Object](process_object.md) — Like `crypto`, this is built directly into Node.js.

---

## 2. Term Category

**Node.js Core Module (cryptography infrastructure)**: The `crypto` module is a built-in Node.js module providing cryptographic functionality. It wraps OpenSSL's C/C++ primitives to enable secure hashing, HMAC generation, symmetric/asymmetric encryption, digital signatures, and cryptographically secure random number generation.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Building web servers requires cryptographic operations — securing sensitive communication over HTTPS, hashing user session tokens, generating secure random API keys, and verifying signatures. 
Implementing cryptographic primitives in JavaScript from scratch would be extremely slow and prone to severe security bugs. Node.js built the `crypto` module into its core to leverage OpenSSL's highly optimized, battle-tested C/C++ implementation directly, exposing fast, zero-dependency cryptographic functions to JavaScript.

### (2) Reality Metaphor
Imagine a **High-Security Bank Vault System**:
- **`crypto.randomBytes`** is a mechanical lottery ball spinner generating un-guessable combination lock combinations.
- **`crypto.createHash`** is a one-way shredder and fingerprint scanner that compresses any document into a unique, irreversible digital stamp.
- **`crypto.createHmac`** is a wax seal stamped using a secret signet ring: anyone can verify the seal's authenticity, but only the secret ring owner could have stamped it.

### (3) Node.js Code Examples

#### Short Snippet (Random Token & Hash Generation)
```javascript
const crypto = require('crypto');

// Generate 32 bytes of secure random hex data
const randomToken = crypto.randomBytes(32).toString('hex');
console.log('Secure Token:', randomToken);

// Generate SHA-256 hash of a string
const hash = crypto.createHash('sha256').update('my secret message').digest('hex');
console.log('SHA-256 Hash:', hash);
```

#### Fuller Example (HMAC Verification with Constant-Time Comparison)
```javascript
const crypto = require('crypto');

function generateHmacSignature(payload, secret) {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

function verifyHmacSignature(payload, signatureToVerify, secret) {
  const expectedSignature = generateHmacSignature(payload, secret);

  const bufActual = Buffer.from(signatureToVerify);
  const bufExpected = Buffer.from(expectedSignature);

  if (bufActual.length !== bufExpected.length) {
    return false;
  }

  // Prevent timing side-channel attacks by comparing buffers in constant time
  return crypto.timingSafeEqual(bufActual, bufExpected);
}

const secret = 'super-secret-key';
const message = 'order_id=10042&amount=99.99';
const sig = generateHmacSignature(message, secret);

console.log('Signature:', sig);
console.log('Verification Success:', verifyHmacSignature(message, sig, secret));
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using Weak Hashing Algorithms (MD5 / SHA1) for Passwords

**The mistake:** Hashing user passwords with `crypto.createHash('md5')`.

**Why it's wrong:** MD5 and SHA1 are cryptographically broken and vulnerable to rainbow table attacks. Use key derivation algorithms like `scrypt`, `argon2`, or `pbkdf2`.

*Incorrect:*
```javascript
const hash = crypto.createHash('md5').update(password).digest('hex'); // ❌ Vulnerable!
```

*Fix:*
```javascript
crypto.scrypt(password, salt, 64, (err, derivedKey) => {
  const hash = derivedKey.toString('hex'); // Secure password key derivation
});
```

### Mistake 2: Using Synchronous Cryptographic Methods on Main Thread

**The mistake:** Calling `crypto.pbkdf2Sync()` inside an HTTP request handler.

**Why it's wrong:** Synchronous hashing blocks the single-threaded Event Loop during CPU calculations, freezing all incoming request handling.

*Incorrect:*
```javascript
app.post('/login', (req, res) => {
  const key = crypto.pbkdf2Sync(req.body.password, salt, 100000, 64, 'sha512'); // ❌ Blocks Event Loop!
});
```

*Fix:*
```javascript
app.post('/login', (req, res) => {
  crypto.pbkdf2(req.body.password, salt, 100000, 64, 'sha512', (err, key) => {
    res.send(key.toString('hex'));
  });
});
```

### Mistake 3: Using Insecure String Comparison for Cryptographic Hashes (Timing Attack Vulnerability)

**The mistake:** Comparing expected vs actual hash signatures using standard `if (hash1 === hash2)`.

**Why it's wrong:** Standard string equality `===` short-circuits on the first mismatched byte, allowing attackers to measure millisecond timing differences to guess valid signatures. Use `crypto.timingSafeEqual()`.

*Incorrect:*
```javascript
if (receivedSignature === expectedSignature) {} // ❌ Vulnerable to timing side-channel attack!
```

*Fix:*
```javascript
const buf1 = Buffer.from(receivedSignature);
const buf2 = Buffer.from(expectedSignature);
if (buf1.length === buf2.length && crypto.timingSafeEqual(buf1, buf2)) {}
```

---

## 5. Practice Exercises

### Exercise 1: Generating Random Bytes with Crypto

**Problem:** Generate a 16-byte random hex string token using `crypto.randomBytes`.

**Expected output:**
> [!check]- Answer
> ```javascript
> const token = crypto.randomBytes(16).toString('hex');
> ```
>
> **Explanation:** `crypto.randomBytes` generates cryptographically strong pseudo-random data.
> 
---

### Exercise 2: Creating HMAC Signatures

**Problem:** Generate SHA-256 HMAC signature for message `'hello'` using secret key `'secret'`.

**Expected output:**
> [!check]- Answer
> ```javascript
> const hmac = crypto.createHmac('sha256', 'secret').update('hello').digest('hex');
> ```
>
> **Explanation:** `crypto.createHmac` creates cryptographic HMAC authentication digests.
> 
---

### Exercise 3: Timing-Safe Buffer Comparison

**Problem:** Which Node.js `crypto` method securely compares two buffers without timing side-channel vulnerabilities?

**Expected output:**
> [!check]- Answer
> ```javascript
> const isMatch = crypto.timingSafeEqual(buf1, buf2);
> ```
>
> **Explanation:** `crypto.timingSafeEqual` executes in constant time regardless of byte match positions.
> 
---

## 6. Related Terms
- [Bcrypt (Password Hashing)](../level_10/bcrypt.md) — A specialized third-party library designed specifically for securely hashing passwords, often preferred over native `crypto` methods for that specific use case.
- [Buffers](../level_06/buffers.md) — Many `crypto` functions return or expect data in the form of Buffers.

---

## 7. Key Takeaways
- The `crypto` module is built into Node.js, providing C/C++ OpenSSL cryptographic performance without third-party dependencies.
- Never use simple fast hashes (`MD5`, `SHA256`) for password storage; use key derivation functions (`scrypt`, `pbkdf2`) or `bcrypt`.
- Avoid synchronous methods like `pbkdf2Sync` inside request handlers to prevent blocking the single-threaded Event Loop.
- Always compare cryptographic signatures using `crypto.timingSafeEqual()` to mitigate timing side-channel attacks.
