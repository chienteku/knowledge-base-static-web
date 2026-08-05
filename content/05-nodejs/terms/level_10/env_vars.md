# Environment Variables (dotenv)

> **Level 10 — Security & Production**
> Secret configuration values injected into your application from the outside, ensuring that API keys and database passwords are never hardcoded into your source code.

---

## 1. Prerequisites
- [The process Object](../level_02/process_object.md) — Where these variables actually live inside Node.js (`process.env`).

---

## 2. Term Category
- **Configuration / Security Best Practice**

---

## 3. Environment Context
- **Deployment / System Architecture**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
If you hardcode your database password into `server.js` (e.g., `const dbPass = "mySecretPassword"`), and then you push that code to GitHub, your password is now public. Hackers constantly scan GitHub for exposed passwords, and within 5 minutes, your database will be deleted and held for ransom.
To fix this, we use **Environment Variables**. These are variables that live on the *Server's Operating System*, not in the code.

### (2) The `.env` File
In local development, setting OS-level variables is annoying. So, the Node.js community uses a package called `dotenv`.
You create a file named exactly `.env` at the root of your project:
```text
PORT=3000
DATABASE_URL="postgres://admin:secret123@localhost:5432/mydb"
JWT_SECRET="super-secret-signature-key"
```
**CRUCIAL STEP:** You immediately add `.env` to your `.gitignore` file so it is NEVER uploaded to GitHub.

### (3) Using the variables
In your Node.js code, you load the `.env` file, and Node injects those values into the global `process.env` object.
```javascript
require('dotenv').config(); // Loads the .env file

const port = process.env.PORT;
const dbUrl = process.env.DATABASE_URL;

console.log(`Starting server on port ${port}...`);
```
When you deploy to a production server (like AWS or Heroku), you don't upload the `.env` file. Instead, you type the secrets directly into the AWS/Heroku dashboard, and Node reads them from the real OS environment!

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Committing the `.env` file to GitHub

**The mistake:** A developer creates a `.env` file, puts their Stripe API keys inside it, but forgets to add `.env` to the `.gitignore` file. They run `git commit` and `git push`.

**Why it's wrong:** You just exposed your financial API keys to the entire internet! Bots scrape GitHub 24/7 looking for `.env` files. If this happens, you must assume the key is compromised. Deleting the file in the next commit does NOT work, because the file still exists in Git's history!
**Golden Rule:** You must instantly revoke/delete the API key in your Stripe dashboard and generate a brand new one.

---



### Mistake 2: Committing `.env` Configuration Files Containing Private Keys/Secrets to Git

**The mistake:** Checking `.env` files with database credentials or secret keys into Git repositories.

**Why it's wrong:** Committing secrets to Git exposes credentials to repository readers and automated secret scrapers. Include `.env` in `.gitignore` and use `.env.example`.

*Incorrect:*
```javascript
// Missing .env entry in .gitignore
// Git commit including database passwords
```

*Fix:*
```javascript
// Add .env to .gitignore
// Commit .env.example with placeholder keys only
```

### Mistake 3: Assuming `process.env` Values Are Parsed as Numbers or Booleans

**The mistake:** Writing `if (process.env.ENABLE_FEATURE === true)` or `const port = process.env.PORT + 1`.

**Why it's wrong:** ALL environment variables in `process.env` are string primitives! `'true' === true` evaluates to `false`, and `'3000' + 1` yields `'30001'`. Parse environment variables explicitly.

*Incorrect:*
```javascript
if (process.env.IS_ADMIN === true) {} // ❌ false! 'true' is a string!
```

*Fix:*
```javascript
if (process.env.IS_ADMIN === 'true') {}
const port = parseInt(process.env.PORT || '3000', 10);
```

## 6. Practice Exercises

### Exercise 1: The Missing Variable

**Problem:** You download your coworker's Node.js project from GitHub. You run `npm start`, but the app immediately crashes with the error: `TypeError: Cannot read property 'split' of undefined` on the database connection string. You look at the code and see `const url = process.env.DATABASE_URL`. Why did it crash, and how do you fix it?

**Expected output:**
> [!check]- Answer
> ```text
> It crashed because `process.env.DATABASE_URL` is undefined. 
> Because `.env` files are ignored by Git (for security), you didn't download it from GitHub! You must ask your coworker for the local `.env` values, or look for a `.env.example` file to create your own `.env` file locally.
> ```
> - Are `.env` files supposed to be in GitHub repositories?

---



### Exercise 2: Loading .env Variables with dotenv

**Problem:** Write code to load environment variables from `.env` file at application startup using `dotenv`.

**Expected output:**
> [!check]- Answer
> ```text
> require('dotenv').config();
> ```
> ```javascript
> require('dotenv').config();
> console.log(process.env.DATABASE_URL);
> ```
>
> **Explanation:** `dotenv.config()` parses `.env` file key-values into `process.env`.

---

### Exercise 3: Node.js 20+ Native Env File Flag

**Problem:** Which native Node.js 20+ CLI flag loads `.env` files without requiring external `dotenv` packages?

**Expected output:**
> [!check]- Answer
> ```text
> node --env-file=.env app.js
> ```
> ```bash
> node --env-file=.env app.js
> ```
>
> **Explanation:** `--env-file` natively populates `process.env` at startup without npm dependencies.

## 7. Related Terms
- [JWT (JSON Web Tokens)](jwt.md) — The JWT signature secret MUST be stored in an Environment Variable.
- [Docker](docker.md) — Docker relies heavily on Environment Variables to configure containers dynamically.
- [The process Object](../level_02/process_object.md) — Related concept: The process Object.

---

## 8. Key Takeaways
- **Environment Variables** are used to keep secrets (passwords, API keys) completely out of your source code.
- Locally, you store them in a `.env` file and use the `dotenv` package to load them into `process.env`.
- You MUST add `.env` to your `.gitignore` file before making your first commit.
- In production, you don't use the `.env` file; you configure the variables directly in the hosting provider's dashboard.
