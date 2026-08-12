# Environment Variables (dotenv)

> **Level 10 — Security & Production**
> Secret configuration values injected into your application from the outside, ensuring that API keys and database passwords are never hardcoded into your source code.

---

## 1. Prerequisites
- [The process Object](../level_02/process_object.md) — Where these variables actually live inside Node.js (`process.env`).

---

## 2. Term Category

**Configuration / Security Best Practice (Deployment / System Architecture)**: Environment Variables (dotenv) is a fundamental concept in this technology stack. **Level 10 — Security & Production**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Strict Environment Variable Schema Validator

**Scenario:** Validates environment variables against mandatory schema types (`PORT`: number, `DB_URL`: string, `DEBUG`: boolean).

**Requirements:**
1. Write validateEnvSchema(envObj, schemaObj).
2. Cast and validate types.
3. Return sanitized environment object or throw error.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function validateEnvSchema(envObj = {}, schemaObj = {}) {
>   const sanitized = {};
>   const errors = [];
>
>   for (const [key, rules] of Object.entries(schemaObj)) {
>     const rawVal = envObj[key];
>
>     if (rules.required && (rawVal === undefined || rawVal === "")) {
>       errors.push(`Missing required environment variable: ${key}`);
>       continue;
>     }
>
>     if (rawVal !== undefined) {
>       if (rules.type === "number") {
>         const num = Number(rawVal);
>         if (isNaN(num)) errors.push(`Environment variable ${key} must be a number`);
>         else sanitized[key] = num;
>       } else if (rules.type === "boolean") {
>         sanitized[key] = String(rawVal).toLowerCase() === "true" || rawVal === "1";
>       } else {
>         sanitized[key] = String(rawVal);
>       }
>     } else if (rules.default !== undefined) {
>       sanitized[key] = rules.default;
>     }
>   }
>
>   if (errors.length > 0) {
>     throw new Error(`ENV_VALIDATION_FAILED: ${errors.join("; ")}`);
>   }
>
>   return sanitized;
> }
>
> // Verification tests
> const schema = {
>   PORT: { required: true, type: "number", default: 3000 },
>   DEBUG: { type: "boolean", default: false }
> };
>
> const validated = validateEnvSchema({ PORT: "8080", DEBUG: "true" }, schema);
> console.assert(validated.PORT === 8080, "Test 1 Failed: Cast PORT string to number");
> console.assert(validated.DEBUG === true, "Test 2 Failed: Cast DEBUG string to boolean");
> ```
>
> #### Technical Explanation
>
> 1. **Environment Variable Type Safety**: `process.env` properties are ALWAYS strings; explicit type parsing prevents subtle `PORT + 1 = 30001` bugs.
> 2. **Config Validation at Boot**: Validating `process.env` on app boot ensures missing keys crash early before accepting user requests.
> 3. **Zod / Envalid Libraries**: Tools like Zod or Envalid provide type-safe `process.env` parsing in TypeScript/JS applications.
> 
---

### Exercise 2: Secret Redaction & Masking Logger

**Scenario:** Masks sensitive environment variable secrets (`API_KEY`, `PASSWORD`, `SECRET`) before printing configurations to stdout logs.

**Requirements:**
1. Write maskSecretEnvVars(envObj, secretKeywordsArray).
2. Mask matching keys with `***REDACTED***`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function maskSecretEnvVars(envObj = {}, secretKeywordsArray = ["SECRET", "KEY", "PASSWORD", "TOKEN"]) {
>   const masked = {};
>
>   for (const [key, val] of Object.entries(envObj)) {
>     const isSecret = secretKeywordsArray.some(k => key.toUpperCase().includes(k));
>     if (isSecret && val) {
>       masked[key] = "***REDACTED***";
>     } else {
>       masked[key] = val;
>     }
>   }
>
>   return masked;
> }
>
> // Verification tests
> const env = { PORT: "8080", DB_PASSWORD: "super_secret_pass", JWT_SECRET: "my_key" };
> const masked = maskSecretEnvVars(env);
>
> console.assert(masked.PORT === "8080", "Test 1 Failed");
> console.assert(masked.DB_PASSWORD === "***REDACTED***", "Test 2 Failed");
> console.assert(masked.JWT_SECRET === "***REDACTED***", "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Preventing Credentials Leakage**: Logging raw `process.env` dumps can expose database passwords in APM and stdout log files.
> 2. **Secret Masking Rules**: Redacts keys containing `SECRET`, `PASSWORD`, `TOKEN`, `KEY`.
> 3. **Twelve-Factor App Methodology**: Store config in environment variables, but NEVER print secret values in plain text logs.
> 
---

### Exercise 3: Custom .env File Parser Implementation

**Scenario:** Parses raw `.env` file content lines (`KEY=VALUE`) into a plain JavaScript key-value object.

**Requirements:**
1. Write parseDotEnvContent(dotEnvStr).
2. Strip comments (#).
3. Parse KEY=VALUE pairs.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function parseDotEnvContent(dotEnvStr = "") {
>   const envMap = {};
>   const lines = dotEnvStr.split("
> ");
>
>   for (const line of lines) {
>     const trimmed = line.trim();
>     if (!trimmed || trimmed.startsWith("#")) continue;
>
>     const eqIndex = trimmed.indexOf("=");
>     if (eqIndex === -1) continue;
>
>     const key = trimmed.substring(0, eqIndex).trim();
>     let val = trimmed.substring(eqIndex + 1).trim();
>
>     val = val.replace(/^["']|["']$/g, "");
>
>     envMap[key] = val;
>   }
>
>   return envMap;
> }
>
> // Verification tests
> const dotenv = `
> # Database Config
> PORT=8080
> DB_URL="postgres://localhost:5432/db"
> `;
>
> const parsed = parseDotEnvContent(dotenv);
> console.assert(parsed.PORT === "8080", "Test 1 Failed");
> console.assert(parsed.DB_URL === "postgres://localhost:5432/db", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **dotenv Core Functionality**: Loads variables from local `.env` files into `process.env` for development environment convenience.
> 2. **Comment & Quote Handling**: Strips `#` comment lines and surrounding quotation marks.
> 3. **Node.js 20+ Native `--env-file`**: Node.js 20+ supports `--env-file=.env` natively without third-party dependencies.
## 6. Related Terms
- [JWT (JSON Web Tokens)](jwt.md) — The JWT signature secret MUST be stored in an Environment Variable.
- [Docker](docker.md) — Docker relies heavily on Environment Variables to configure containers dynamically.
- [The process Object](../level_02/process_object.md) — Related concept: The process Object.

---

## 7. Key Takeaways
- **Environment Variables** are used to keep secrets (passwords, API keys) completely out of your source code.
- Locally, you store them in a `.env` file and use the `dotenv` package to load them into `process.env`.
- You MUST add `.env` to your `.gitignore` file before making your first commit.
- In production, you don't use the `.env` file; you configure the variables directly in the hosting provider's dashboard.
