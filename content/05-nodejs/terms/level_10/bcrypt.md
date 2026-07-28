# Bcrypt (Password Hashing)

> **Level 10 — Security & Production**
> An industry-standard cryptographic algorithm used to scramble user passwords into irreversible gibberish before saving them to the database.

---

## 1. Prerequisites
- [The `crypto` Module](../level_02/crypto_module.md) — While Node has built-in crypto, Bcrypt is a specialized, third-party tool specifically for passwords.
---

## 2. Term Category
- **Security / Cryptography**

---

## 3. Environment Context
- **Node.js Server Code**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: The Double Hash

**Problem:** Bob and Alice both choose the exact same password: `"password123"`. 
Will their Bcrypt hashes in the database look identical? 
(e.g., `$2b$10$abc...` and `$2b$10$abc...`)

**Expected output:**
> [!check]- Answer
> ```text
> No! Their hashes will be completely different.
> Bcrypt automatically adds a random "Salt" (random letters) to every password before hashing it. This ensures that even if two people have the same password, hackers cannot figure that out by looking at the database.
> ```
> - Remember the concept of "Salting" a password.

---



### Exercise 2: Verifying Passwords with Bcrypt

**Problem:** Use `bcrypt.compare()` to verify user input password against hashed password.

**Expected output:**
> [!check]- Answer
> ```text
> const match = await bcrypt.compare(inputPassword, hashedPassword);
> ```
> ```javascript
> const bcrypt = require('bcrypt');
> const isMatch = await bcrypt.compare(inputPassword, hashedPassword);
> if (isMatch) console.log('Password valid');
> ```
>
> **Explanation:** `bcrypt.compare` asynchronously hashes input password with embedded salt to verify matches.

---

### Exercise 3: Salt Purpose in Bcrypt

**Problem:** Why is a random salt automatically generated for each password hash in Bcrypt?

**Expected output:**
> [!check]- Answer
> ```text
> To ensure identical passwords produce different hash outputs, protecting against pre-computed Rainbow Table attacks.
> ```
> ```text
> To ensure identical passwords produce different hash outputs, protecting against pre-computed Rainbow Table attacks.
> ```
>
> **Explanation:** Salting guarantees unique hashes for identical user password strings.

## 7. Related Terms
- [JWT](../level_10/jwt.md) — You use Bcrypt to verify the password, and if it matches, you generate a JWT!

---

## 8. Key Takeaways
- **Bcrypt** is the industry standard for securely storing passwords.
- It uses a "Cost Factor" to intentionally slow down the hashing process, defending against hackers who try to guess millions of passwords per second.
- Hashing is a one-way function. Passwords cannot be "decrypted" or recovered.
- To verify a login, you use `bcrypt.compare()` to see if the typed password produces the same hash as the one in the database.
