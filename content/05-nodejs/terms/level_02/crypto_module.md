# The crypto Module

> **Level 2 — Core Modules & Globals**
> A built-in Node.js module that provides cryptographic functionality, including wrappers for OpenSSL's hash, HMAC, cipher, decipher, sign, and verify functions.

---

## 1. Prerequisites
- [The `process` Object](../level_02/process_object.md) — Like `crypto`, this is built directly into Node.js.

---

## 2. Term Category
Node.js Core Module

---

## 3. Core Definition
The **`crypto`** module provides cryptographic functionality that includes a set of wrappers for OpenSSL's hash, HMAC, cipher, decipher, sign, and verify functions. It is used to secure data, hash passwords (though tools like Bcrypt are preferred for passwords), and generate random data.

Because it is built into Node.js, you do not need to `npm install` it.

---

## 4. Key Characteristics / Rules
- **Built-in:** Accessed via `require('crypto')` or `import crypto from 'node:crypto'`.
- **OpenSSL Backed:** It relies heavily on the underlying OpenSSL library compiled into Node.js.
- **Streams:** Many of the `crypto` classes (`Cipher`, `Decipher`, `Hash`, `Hmac`, `Sign`, `Verify`) extend the `Stream` class, allowing you to pipe large amounts of data through them efficiently.

---

## 5. Typical Usage / Common Patterns

### Generating Random Data
```javascript
const crypto = require('crypto');

// Generate 32 bytes of secure random data
const randomBytes = crypto.randomBytes(32);
console.log(randomBytes.toString('hex')); 
// Output: something like "a1b2c3d4..."
```

### Simple Hashing (SHA-256)
```javascript
const hash = crypto.createHash('sha256');
hash.update('my secret message');
console.log(hash.digest('hex')); 
// Output: a fixed-length hexadecimal string
```

---

## 6. Common Pitfalls
- **Using `crypto.createHash` for Passwords:** Native hashes like SHA-256 are too fast, making them vulnerable to brute-force attacks. For passwords, you should use `crypto.scrypt`, `crypto.pbkdf2`, or ideally a dedicated library like [Bcrypt](../level_10/bcrypt.md).
- **Hardcoding Secrets:** Never hardcode secret keys directly in your source code when encrypting data. Use environment variables.

---

## 5. Common Mistakes & Pitfalls



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

## 6. Practice Exercises



### Exercise 1: Generating Random Bytes with Crypto

**Problem:** Generate a 16-byte random hex string token using `crypto.randomBytes`.

**Expected output:**
```text
const token = crypto.randomBytes(16).toString('hex');
```

> [!check]- Answer
> ```javascript
> const token = crypto.randomBytes(16).toString('hex');
> ```
>
> **Explanation:** `crypto.randomBytes` generates cryptographically strong pseudo-random data.

### Exercise 2: Creating HMAC Signatures

**Problem:** Generate SHA-256 HMAC signature for message `'hello'` using secret key `'secret'`.

**Expected output:**
```text
const hmac = crypto.createHmac('sha256', 'secret').update('hello').digest('hex');
```

> [!check]- Answer
> ```javascript
> const hmac = crypto.createHmac('sha256', 'secret').update('hello').digest('hex');
> ```
>
> **Explanation:** `crypto.createHmac` creates cryptographic HMAC authentication digests.



### Exercise 3: Timing-Safe Buffer Comparison

**Problem:** Which Node.js `crypto` method securely compares two buffers without timing side-channel vulnerabilities?

**Expected output:**
```text
crypto.timingSafeEqual(buf1, buf2)
```

> [!check]- Answer
> ```javascript
> const isMatch = crypto.timingSafeEqual(buf1, buf2);
> ```
>
> **Explanation:** `crypto.timingSafeEqual` executes in constant time regardless of byte match positions.

## 7. Related Terms
- [Bcrypt](../level_10/bcrypt.md) — A specialized third-party library designed specifically for securely hashing passwords, often preferred over native `crypto` methods for that specific use case.
- [Buffers](../level_06/buffers.md) — Many `crypto` functions return or expect data in the form of Buffers.

---
