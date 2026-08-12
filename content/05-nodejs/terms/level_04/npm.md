# NPM (Node Package Manager)

> **Level 4 — Package Management**
> The world's largest software registry and a command-line tool used by developers to download, share, and manage third-party JavaScript code.

---

## 1. Prerequisites
- [Node.js (Runtime Environment)](../level_01/nodejs.md) — NPM comes bundled automatically when you install Node.js.
- [Built-in vs External Modules](../level_03/module_types.md) — NPM is the tool used to download External Modules.

---

## 2. Term Category

**Tooling / Ecosystem (Terminal / Build Step)**: NPM (Node Package Manager) is a fundamental concept in this technology stack. **Level 4 — Package Management**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Before package managers existed, if you wanted to use a library like jQuery, you had to go to `jquery.com`, click "Download .zip", unzip it, drag the file into your project folder, and add a `<script>` tag. If a new version came out, you had to do it all over again manually.
NPM completely revolutionized this. It acts as a massive, centralized database of every open-source JavaScript library in the world. Instead of clicking buttons on a website, you simply open your terminal and type `npm install jquery`. NPM connects to the internet, downloads the code, and wires it into your project automatically.

### (2) The Two Halves of NPM
When developers say "NPM," they actually mean two different things:
1. **The Registry:** A massive online database hosted at `npmjs.com` where developers publish their code.
2. **The CLI (Command Line Interface):** The tool on your computer (accessed via the `npm` terminal command) that talks to that database.

### (3) Common Commands
- `npm init`: Creates a new Node.js project.
- `npm install express`: Downloads a package and saves it for production.
- `npm install --save-dev jest`: Downloads a package but marks it as a "Developer Tool" (not needed in production).
- `npm uninstall express`: Removes the package completely.
- `npm run start`: Executes a custom script defined in your configuration.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Committing downloaded packages to GitHub

**The mistake:** A developer runs `npm install react`, which creates a massive folder. They then type `git add .` and try to push the entire thing to GitHub.

**Why it's wrong:** NPM packages contain tens of thousands of files. Pushing them to GitHub wastes massive amounts of bandwidth and space. Furthermore, packages are often compiled for specific operating systems (Mac vs Windows). 
**Golden Rule:** NEVER commit downloaded packages to Git! Instead, you commit a configuration file (`package.json`), and other developers run `npm install` to download the packages directly from the internet onto their own computers.

---



### Mistake 2: Using `npm install` Instead of `npm ci` in CI/CD Production Deployment Pipelines

**The mistake:** Running `npm install` inside automated Docker / CI build steps.

**Why it's wrong:** `npm install` can update `package-lock.json` and resolve newer patch packages. `npm ci` performs a strict, reproducible, deterministic installation matching `package-lock.json` exactly.

*Incorrect:*
```javascript
# In Dockerfile or CI pipeline:
RUN npm install # ❌ May install non-deterministic dependency versions!
```

*Fix:*
```javascript
# In Dockerfile or CI pipeline:
RUN npm ci # Deterministic production installation
```

### Mistake 3: Installing Production Dependencies under `devDependencies` (or Vice Versa)

**The mistake:** Running `npm i --save-dev express` or `npm i jest` without dev flags.

**Why it's wrong:** Production servers running `npm install --omit=dev` will omit `devDependencies`. Putting runtime dependencies (`express`) in devDependencies causes server crash `MODULE_NOT_FOUND`.

*Incorrect:*
```javascript
npm install --save-dev express // ❌ Express won't be installed on production server!
```

*Fix:*
```javascript
npm install express # --save (production dependency)
npm install --save-dev jest # --save-dev (development dependency)
```

## 5. Practice Exercises

### Exercise 1: The Dev Dependency

**Problem:** You are building an API. You need `express` to run the actual web server. You also want to install `eslint`, a tool that checks your code for typos while you are typing on your laptop. 
What is the difference in how you install them?

**Expected output:**
> [!check]- Answer
> ```bash
> npm install express
> npm install --save-dev eslint
> ```
> - Which package is required for the server to literally turn on and accept traffic?
> 
---



### Exercise 2: npm Run Scripts Execution

**Problem:** How do you run custom script `"build": "tsc"` declared in `package.json` using npm CLI?

**Expected output:**
> [!check]- Answer
> ```text
> npm run build
> ```
> ```bash
> npm run build
> ```
>
> **Explanation:** `npm run <script-name>` executes script commands defined in `package.json` `scripts` object.
> 
---

### Exercise 3: Auditing Vulnerable Dependencies

**Problem:** Which npm CLI command scans project dependencies for security vulnerabilities?

**Expected output:**
> [!check]- Answer
> ```text
> npm audit (and npm audit fix to resolve)
> ```
> ```bash
> npm audit
> ```
>
> **Explanation:** `npm audit` checks dependency versions against known CVE vulnerability databases.
> 
## 6. Related Terms
- [package.json](package_json.md) — The configuration file that NPM reads and writes to.
- [node_modules](node_modules.md) — Where NPM physically places the downloaded code.
- [Node.js (Runtime Environment)](../level_01/nodejs.md) — Related concept: Node.js (Runtime Environment).
- [CommonJS (require, module.exports)](../level_03/commonjs.md) — Related concept: CommonJS (require, module.exports).
- [Built-in vs External Modules](../level_03/module_types.md) — Related concept: Built-in vs External Modules.
- [package-lock.json & Deterministic Installs](package_lock.md) — package-lock.json lockfile.

---

## 7. Key Takeaways
- **NPM** is the default package manager for Node.js.
- It is used to quickly download and manage third-party code (External Modules).
- Normal dependencies (`npm install`) are required for the app to run.
- Dev dependencies (`npm install --save-dev`) are only used for local tooling and testing.
