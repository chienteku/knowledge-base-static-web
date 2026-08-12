# Bcrypt (Password Hashing)

> **Level 10 — Security & Production**
> An industry-standard cryptographic algorithm used to scramble user passwords into irreversible gibberish before saving them to the database.

---

## 1. Prerequisites
- [The crypto Module](../level_02/crypto_module.md) — While Node has built-in crypto, Bcrypt is a specialized, third-party tool specifically for passwords.

---

## 2. Term Category

**Security / Cryptography (Node.js Server Code)**: Bcrypt (Password Hashing) is a fundamental concept in this technology stack. **Level 10 — Security & Production**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
If you build a website and save user passwords as "Plain Text" in your database (e.g., `password: "ilovedogs123"`), you are committing developer malpractice. If a hacker steals your database, they instantly have the passwords of every user on your site. Worse, because people reuse passwords, the hacker can now log into those users' bank accounts!
To fix this, we **Hash** passwords. Hashing is a one-way math function. It turns `"ilovedogs123"` into `$2b$10$xyzGibberishString`. 

### (2) Why Bcrypt specifically?
You could use standard SHA-256 hashing. But SHA-256 is *too fast*. A hacker with a modern graphics card can guess 10 Billion SHA-256 passwords per second until they find a match.
**Bcrypt** was intentionally designed to be **SLOW**. 
It includes a "Cost Factor" (Salting & Key Stretching). You can configure Bcrypt so that it takes exactly 0.5 seconds to hash a single password. If a hacker steals the database, guessing a billion passwords would take them 15 years instead of 1 second!

### (3) How to use it in Node.js
You install the `bcrypt` NPM package.
**Registration:** Hash the password before saving to the DB.
```javascript
const bcrypt = require('bcrypt');

const saltRounds = 10; // The "Cost Factor"
const plainPassword = "mySuperSecretPassword";
const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

// Save `hashedPassword` to the database!
```
**Login:** Compare the user's typed password against the stored hash.
```javascript
// You CANNOT "decrypt" a hash. You must hash the typed password and see if it matches.
const isMatch = await bcrypt.compare("mySuperSecretPassword", hashedPasswordFromDB);

if (isMatch) {
  console.log("Login successful!");
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Trying to "Decrypt" a password

**The mistake:** A developer is building a "Forgot Password" feature. They look up the Bcrypt hash in the database and try to figure out how to decrypt it so they can email the user their old password.

**Why it's wrong:** Hashing is NOT encryption! Encryption is a two-way street (lock and unlock). Hashing is a one-way street (putting a steak into a meat grinder). You cannot put ground beef back together into a steak! It is mathematically impossible to decrypt a Bcrypt hash.
**Golden Rule:** If a user forgets their password, you cannot give it back to them. You can only give them a link to create a brand new one.

---



### Mistake 2: Using `bcrypt.hashSync()` on Main Event Loop Thread (CPU Blocking Trap)

**The mistake:** Calling `bcrypt.hashSync(password, 12)` inside an Express request handler.

**Why it's wrong:** Bcrypt password hashing is intentionally CPU-heavy. `hashSync()` blocks the single-threaded Event Loop for ~100-300ms per request, freezing all concurrent server traffic.

*Incorrect:*
```javascript
app.post('/register', (req, res) => {
  const hash = bcrypt.hashSync(req.body.password, 12); // ❌ Blocks Event Loop CPU!
});
```

*Fix:*
```javascript
app.post('/register', async (req, res) => {
  const hash = await bcrypt.hash(req.body.password, 12); // Async non-blocking offload
});
```

### Mistake 3: Setting Cost Factor (Salt Rounds) Too Low or Dangerously High

**The mistake:** Setting salt rounds to `4` (too weak) or `20` (takes 30 seconds per hash).

**Why it's wrong:** Setting rounds too low allows fast brute-force cracking. Setting rounds too high causes server CPU denial of service. Use recommended salt rounds (10-12).

*Incorrect:*
```javascript
const hash = await bcrypt.hash(password, 4); // ❌ Insecure low salt rounds!
```

*Fix:*
```javascript
const hash = await bcrypt.hash(password, 12); // Recommended production salt rounds
```

## 5. Practice Exercises

### Exercise 1: Asynchronous Password Hashing & Salt Round Benchmark

**Scenario:** An authentication microservice hashes user passwords using `bcrypt` asynchronously, selecting optimal salt rounds (e.g. 10–12) to balance security with CPU event loop execution time.

**Requirements:**
1. Write hashPassword(plainTextPassword, saltRounds, mockBcrypt).
2. Enforce minimum 10 salt rounds.
3. Return hashed password.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function hashPassword(plainTextPassword, saltRounds = 10, mockBcrypt) {
>   if (typeof plainTextPassword !== "string" || !plainTextPassword.trim()) {
>     throw new Error("Password must be a non-empty string");
>   }
>
>   const effectiveRounds = Math.max(10, saltRounds);
>   const bcryptLib = mockBcrypt || require("bcrypt");
>
>   const start = Date.now();
>   const hash = await bcryptLib.hash(plainTextPassword, effectiveRounds);
>   const durationMs = Date.now() - start;
>
>   return {
>     hash,
>     saltRounds: effectiveRounds,
>     durationMs
>   };
> }
>
> // Verification tests
> const mockBcrypt = {
>   hash: async (pwd, rounds) => `$2b$${rounds}$mock_hashed_${pwd}`
> };
>
> hashPassword("secret123", 10, mockBcrypt).then(res => {
>   console.assert(res.hash === "$2b$10$mock_hashed_secret123", "Test 1 Failed");
>   console.assert(res.saltRounds === 10, "Test 2 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Adaptive Hashing Cost Factor**: bcrypt salt rounds dictate CPU hashing iterations ($2^{rounds}$); 10 rounds = ~100ms calculation time.
> 2. **Non-Blocking Hashing**: Always use `bcrypt.hash()` asynchronous Promises to prevent blocking the single-threaded Node.js event loop.
> 3. **Salt Auto-Generation**: bcrypt automatically generates unique 128-bit cryptographically secure salts embedded in the final hash string.
> 
---

### Exercise 2: Constant-Time Password Verification

**Scenario:** A login controller verifies submitted plaintext passwords against stored bcrypt hash strings in constant time to prevent timing attacks.

**Requirements:**
1. Write verifyPassword(plainTextPassword, hashedPassword, mockBcrypt).
2. Invoke `bcrypt.compare()`.
3. Return boolean match.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function verifyPassword(plainTextPassword, hashedPassword, mockBcrypt) {
>   if (!plainTextPassword || !hashedPassword) {
>     return false;
>   }
>
>   const bcryptLib = mockBcrypt || require("bcrypt");
>
>   try {
>     const isMatch = await bcryptLib.compare(plainTextPassword, hashedPassword);
>     return isMatch === true;
>   } catch (err) {
>     return false;
>   }
> }
>
> // Verification tests
> const mockBcrypt = {
>   compare: async (pwd, hash) => hash.includes(pwd)
> };
>
> verifyPassword("secret123", "$2b$10$mock_hashed_secret123", mockBcrypt).then(isValid => {
>   console.assert(isValid === true, "Test 1 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Constant-Time Comparison**: `bcrypt.compare()` uses constant-time string comparison algorithms to prevent side-channel timing analysis attacks.
> 2. **Bcrypt Hash Structure**: `$2b$10$SALT...HASH...`: `$2b$` is algorithm identifier, `10` is cost factor, followed by 22-char salt and 31-char hash.
> 3. **Password Truncation Warning**: Standard bcrypt algorithm truncates inputs at 72 bytes; pre-hash long inputs with SHA-256 if necessary.
> 
---

### Exercise 3: Adaptive Work Factor Re-Hash Migration Guard

**Scenario:** A security policy monitor checks if legacy user bcrypt hashes require re-hashing with updated higher salt rounds during login.

**Requirements:**
1. Write checkNeedsRehash(hashedPassword, targetSaltRounds).
2. Parse current cost factor from hash string.
3. Flag if current cost factor < targetSaltRounds.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function checkNeedsRehash(hashedPassword = "", targetSaltRounds = 12) {
>   if (typeof hashedPassword !== "string") {
>     return { needsRehash: false, error: "INVALID_HASH" };
>   }
>
>   const match = hashedPassword.match(/^\$2[abx]\$(\d+)\$/);
>   if (!match) {
>     return { needsRehash: true, reason: "NOT_BCRYPT_OR_LEGACY" };
>   }
>
>   const currentRounds = parseInt(match[1], 10);
>   const needsRehash = currentRounds < targetSaltRounds;
>
>   return {
>     needsRehash,
>     currentRounds,
>     targetSaltRounds
>   };
> }
>
> // Verification tests
> console.assert(checkNeedsRehash("$2b$10$abcdef1234567890", 12).needsRehash === true, "Test 1 Failed: 10 rounds needs upgrade to 12");
> console.assert(checkNeedsRehash("$2b$12$abcdef1234567890", 12).needsRehash === false, "Test 2 Failed: Already 12 rounds");
> ```
>
> #### Technical Explanation
>
> 1. **Upgrading Work Factors**: As CPU hardware speeds up over time, security standards require upgrading salt rounds (e.g. 10 -> 12 -> 14).
> 2. **Seamless Password Upgrades**: Check cost factor upon successful login; if legacy, re-hash plaintext password with higher rounds and update DB.
> 3. **Algorithm Identifiers**: `$2a$`, `$2b$`, `$2y$` represent revision variants of the OpenBSD bcrypt implementation.
## 6. Related Terms
- [JWT (JSON Web Tokens)](jwt.md) — You use Bcrypt to verify the password, and if it matches, you generate a JWT!
- [The crypto Module](../level_02/crypto_module.md) — Related concept: The crypto Module.

---

## 7. Key Takeaways
- **Bcrypt** is the industry standard for securely storing passwords.
- It uses a "Cost Factor" to intentionally slow down the hashing process, defending against hackers who try to guess millions of passwords per second.
- Hashing is a one-way function. Passwords cannot be "decrypted" or recovered.
- To verify a login, you use `bcrypt.compare()` to see if the typed password produces the same hash as the one in the database.
