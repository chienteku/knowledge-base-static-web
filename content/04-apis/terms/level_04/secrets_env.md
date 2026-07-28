# Secrets & Environment Variables

> **Level 4 — Security & Authentication**
> Keeping API keys out of source code (`.env`, secret managers).

---

## 1. Prerequisites
- [API Keys](./api_keys.md) — The credential strings requiring protection.

---

## 2. Term Category
- **Tooling**

---

## 3. Environment Context
- **Universal**: Applies to backend applications, database connection managers, and deployment pipelines.

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Config Audit

**Problem:** You are reviewing a codebase before deployment. Which of the following configs represents a secure configuration setup?

- **A.** Storing database connection strings directly inside a `config/db.js` file.
- **B.** Reading keys via `process.env.DB_CONNECTION` and providing a `.env.example` template containing mock placeholder values in Git.
- **C.** Storing keys in `.env` and omitting `.env` from the `.gitignore` file.

> [!check]- Answer
> - **B** (Providing a template like `.env.example` in Git is standard practice. It shows team members which keys they need to define locally, without leaking the actual values).


---

### Exercise 2: Git Leak Clean-Up Procedure

**Problem:** What 2 actions must be taken immediately if a production database secret is committed to a public Git repo?

**Expected output:**
> [!check]- Answer
> ```text
> 1. Immediately revoke and rotate the secret on the database server
> 2. Purge secret from Git history (using BFG Repo-Cleaner or git filter-repo) and update .gitignore
> ```
> ```text
> 1. Immediately revoke/rotate the leaked secret.
> 2. Purge secret from Git commit history and add .env to .gitignore.
> ```
> - **Explanation:** Revocation is mandatory because public Git history cannot be guaranteed un-scraped.
---

### Exercise 3: Environment Variable Access in Node.js

**Problem:** Write JavaScript line reading environment variable `PORT` with fallback default to `3000`.

**Expected output:**
> [!check]- Answer
> ```text
> const PORT = process.env.PORT || 3000;
> ```
> ```javascript
> const PORT = process.env.PORT || 3000;
> ```
> - **Explanation:** `process.env` exposes environment variables in Node.js runtime.
---

## 7. Related Terms
- [Basic & Bearer Authentication](./basic_bearer_auth.md) — The credentials transport protocols initialized using environment secrets.
- [localStorage & sessionStorage](../level_09/web_storage.md) — Browser Web Storage spaces where API secrets should **never** be placed (since client-side JavaScript can be read by XSS attacks).

---

## 8. Key Takeaways
- Environment variables isolate sensitive configuration details from application code.
- Local configuration is stored in `.env` files which must be excluded from Git via `.gitignore`.
- In Node.js, environment variables are loaded at startup and read via the global `process.env` object.
- Committing a secret to Git leaks it forever in the commit history; compromised keys must be rotated immediately.
- In production, manage credentials using runtime environment injection or secure secret managers.
