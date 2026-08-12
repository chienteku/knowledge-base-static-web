# Secrets & Environment Variables

> **Level 4 — Security & Authentication**
> Keeping API keys out of source code (`.env`, secret managers).

---

## 1. Prerequisites
- [API Keys](api_keys.md) — The credential strings requiring protection.
- [API (Application Programming Interface)](../level_03/api.md) — API key and secret credentials protection.

---

## 2. Term Category

**Tooling (Universal: Applies to backend applications, database connection managers, and deployment pipelines.)**: Secrets & Environment Variables is a fundamental concept in this technology stack. **Level 4 — Security & Authentication**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
API keys, database passwords, and encryption secrets grant complete access to your services. If a developer hardcodes these keys directly inside their code files (for example: `const DB_PASS = "super-secret-123"`), and commits that code to a Git repository (like GitHub), automated scanners will instantly detect and steal the key. This leads to data breaches, database deletion, or massive billing charges.

To prevent credential leaks, developers isolate configuration from code using **Secrets and Environment Variables**:
- **Environment Variables:** Dynamic named values stored in the operating system environment where your application runs, completely separate from the source code.
- **`.env` files:** Local text files containing key-value configurations used during local development.
- **Git Exclusion:** The `.env` file **must** be listed inside your `.gitignore` file, ensuring it is never committed to version control.
- **Runtime Injection:** In production (e.g. AWS, Google Cloud, Vercel), secrets are not kept in files; they are securely injected into the running process memory by the host platform or fetched from dedicated vaults (like AWS Secrets Manager).

### (2) Reality Metaphor
Imagine a house security lock code.
- **Hardcoding** is like writing the lock combination code directly on the **welcome mat** in front of your door. Anyone walking past (a Git repo crawler) can look down, memorize the code, and enter your house at any time.
- **Environment Variables** are like keeping the code inside **your wallet (the OS environment)**. The door lock is programmed to read a code passed from your wallet at runtime, but the code digits are never written on the door frame or walls.

---

### (3) Technical Implementation in Node.js

#### 1. The Local Environment File (`.env`)
Create a file named `.env` in the root of your project:
```text
PORT=3000
STRIPE_API_KEY=sk_test_51Mz893hjKasd01
DATABASE_URL=mongodb://localhost:27017/prod
```

#### 2. The Git Exclusion File (`.gitignore`)
Always add `.env` to your `.gitignore` before making any commits:
```text
# Dependency directories
node_modules/

# Local credentials - NEVER COMMIT THIS
.env
```

#### 3. Reading Variables in Code
Use the `dotenv` library to load values from the `.env` file into Node's global `process.env` memory space at startup:

```javascript
import 'dotenv/config'; // Loads values from .env into process.env

const apiKey = process.env.STRIPE_API_KEY;
const port = process.env.PORT || 8080;

if (!apiKey) {
  console.error("CRITICAL ERROR: STRIPE_API_KEY is not defined!");
  process.exit(1);
}

console.log(`Server starting on port ${port}...`);
console.log(`Using Stripe key ending in: ...${apiKey.slice(-4)}`);
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Committing `.env` to Git and deleting it in a later commit

**The mistake:** Committing `.env` to Github, realizing the error, and making a second commit that deletes the file or adds it to `.gitignore`.

**Why it's wrong:** Git is a version history logger. Even if the file is deleted in the latest commit, the credentials remain completely readable in the repository's commit history. Hackers run automated scripts to scan the history of commits for deleted secrets.

*Fix:* 
1. Immediately **revoke and rotate** the leaked credentials (make a new key on Stripe or change your database password).
2. Clean your Git history using specialized tools like `git-filter-repo` or BFG Repo-Cleaner to delete all traces of the file.

---

### Mistake 2: Committing `.env` Secret Files into Git Source Repositories

**The mistake:** Pushing `.env` containing database passwords and API master keys to GitHub.

**Why it's wrong:** Once committed to Git, secrets remain permanently visible in commit history even if deleted in a later commit. Automated bots scan GitHub constantly to steal exposed credentials.

*Incorrect:*
```http
# Adding .env file to git repository
git add .env && git commit -m "Add config" # ❌ Exposes API keys publicly!
```

*Fix:*
```text
# Add .env to .gitignore immediately:
echo ".env" >> .gitignore
```

---

### Mistake 3: Exposing Private Backend `.env` Keys to Client Bundles via Framework Prefixes

**The mistake:** Prefixing private database passwords with `NEXT_PUBLIC_` or `REACT_APP_` in Next.js/React.

**Why it's wrong:** Framework prefixes like `NEXT_PUBLIC_` instruct bundlers to embed the variable string directly into public frontend client JS files.

*Incorrect:*
```text
NEXT_PUBLIC_DB_PASSWORD=secret123 # ❌ Injected directly into public browser bundle!
```

*Fix:*
```text
DB_PASSWORD=secret123 # Omit framework public prefix for server-only secrets
```


---

## 5. Practice Exercises

### Exercise 1: Environment Variable Secret Loader & Masking Engine

**Scenario:** A backend server loads application secrets from environment variables, providing fallback defaults and sanitizing values for console logging.

**Requirements:**
1. Write getSecret(varName, envMap, defaultValue).
2. Read secret.
3. Provide masked version for logging (`sk_***123`).

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function getSecret(varName, envMap = process.env, defaultValue = null) {
>   const value = envMap[varName] || defaultValue;
>   if (!value) {
>     return { value: null, masked: "NOT_SET", set: false };
>   }
>
>   const str = String(value);
>   let masked = "******";
>   if (str.length > 6) {
>     masked = `${str.substring(0, 3)}***${str.substring(str.length - 3)}`;
>   }
>
>   return {
>     value: str,
>     masked,
>     set: true
>   };
> }
>
> // Verification tests
> const env = { "DATABASE_URL": "postgres://user:supersecretpass@localhost:5432/db" };
> const res = getSecret("DATABASE_URL", env);
>
> console.assert(res.set === true, "Test 1 Failed");
> console.assert(res.masked.includes("***") && !res.masked.includes("supersecretpass"), "Test 2 Failed: Masked value must hide password");
> ```
>
> #### Technical Explanation
>
> 1. **Environment Variables (.env)**: Stores configuration secrets outside of source code files.
> 2. **Twelve-Factor App Methodology**: Requires strict separation of config/secrets from code.
> 3. **Log Masking**: Sanitizes secret strings before writing to server log streams.
> 
---

### Exercise 2: Git Repository Secret Leak Scanner

**Scenario:** A pre-commit security linter scans source code files for hardcoded API keys, private keys, and database credentials.

**Requirements:**
1. Write scanFileForSecrets(fileContent).
2. Check for AWS keys, RSA private keys, Stripe secret keys.
3. Return detected leaks.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function scanFileForSecrets(fileContent) {
>   if (typeof fileContent !== "string") return [];
>
>   const secretPatterns = [
>     { name: "AWS Access Key", regex: /AKIA[0-9A-Z]{16}/g },
>     { name: "RSA Private Key", regex: /-----BEGIN RSA PRIVATE KEY-----/g },
>     { name: "Stripe Secret Key", regex: /sk_live_[0-9a-zA-Z]{24}/g },
>     { name: "Generic Secret Hardcode", regex: /const\s+SECRET\s*=\s*["'][^"']+["']/g }
>   ];
>
>   const leaks = [];
>   for (const p of secretPatterns) {
>     if (p.regex.test(fileContent)) {
>       leaks.push(p.name);
>     }
>   }
>
>   return leaks;
> }
>
> // Verification tests
> const code = 'const apiKey = "AKIAIOSFODNN7EXAMPLE";';
> const leaks = scanFileForSecrets(code);
> console.assert(leaks.includes("AWS Access Key"), "Test 1 Failed");
>
> const cleanCode = 'const dbUrl = process.env.DATABASE_URL;';
> console.assert(scanFileForSecrets(cleanCode).length === 0, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Hardcoded Secret Risk**: Committing secrets to Git repositories exposes them to unauthorized users and automated bot scanners.
> 2. **Pre-Commit Hooks**: Automated secret scanners (git-leaks, TruffleHog) prevent secret commits before pushing.
> 3. **Immediate Secret Revocation**: If a secret is committed to Git, consider it compromised immediately and rotate it.
> 
---

### Exercise 3: In-Memory Secret Storage Sanitization

**Scenario:** A security module clears sensitive in-memory secret buffers immediately after cryptographically processing them.

**Requirements:**
1. Write processSecretBuffer(secretBuffer, callback).
2. Execute callback.
3. Zero out buffer memory.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function processSecretBuffer(secretBuffer, callback) {
>   if (!Buffer.isBuffer(secretBuffer)) {
>     throw new Error("Expected Buffer secret");
>   }
>
>   try {
>     return callback(secretBuffer);
>   } finally {
>     secretBuffer.fill(0);
>   }
> }
>
> // Verification tests
> const buf = Buffer.from("super-secret-key");
> processSecretBuffer(buf, (b) => {
>   console.assert(b.toString() === "super-secret-key", "Test 1 Failed");
> });
>
> console.assert(buf.every(byte => byte === 0), "Test 2 Failed: Memory buffer must be zeroed out");
> ```
>
> #### Technical Explanation
>
> 1. **In-Memory Secret Residue**: Sensitive secrets lingering in process heap memory can be extracted via memory dumps.
> 2. **Buffer Filling / Wiping**: Overwriting memory buffers with zeros ensures secrets are scrubbed after use.
> 3. **Defense in Depth**: Protects application secrets against heap inspection attacks.
---

## 6. Related Terms
- [Basic & Bearer Authentication](basic_bearer_auth.md) — The credentials transport protocols initialized using environment secrets.
- [localStorage & sessionStorage](../level_09/web_storage.md) — Browser Web Storage spaces where API secrets should **never** be placed (since client-side JavaScript can be read by XSS attacks).
- [SDK / Client Library](../level_10/sdk.md) — Related concept: SDK / Client Library.

---

## 7. Key Takeaways
- Environment variables isolate sensitive configuration details from application code.
- Local configuration is stored in `.env` files which must be excluded from Git via `.gitignore`.
- In Node.js, environment variables are loaded at startup and read via the global `process.env` object.
- Committing a secret to Git leaks it forever in the commit history; compromised keys must be rotated immediately.
- In production, manage credentials using runtime environment injection or secure secret managers.
