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

### Exercise 1: Custom npm run Script Pipeline Runner

**Scenario:** A build automation tool parses `scripts` defined in `package.json` to execute pre and post script hooks (`prebuild` -> `build` -> `postbuild`).

**Requirements:**
1. Write resolveNpmScriptPipeline(scriptsMap, targetScript).
2. Check for `pre${targetScript}`.
3. Check for `post${targetScript}`.
4. Return ordered execution array.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function resolveNpmScriptPipeline(scriptsMap = {}, targetScript = "build") {
>   const pipeline = [];
>
>   const preScript = `pre${targetScript}`;
>   if (scriptsMap[preScript]) {
>     pipeline.push({ name: preScript, command: scriptsMap[preScript] });
>   }
>
>   if (scriptsMap[targetScript]) {
>     pipeline.push({ name: targetScript, command: scriptsMap[targetScript] });
>   } else {
>     throw new Error(`npm error! Missing script: "${targetScript}"`);
>   }
>
>   const postScript = `post${targetScript}`;
>   if (scriptsMap[postScript]) {
>     pipeline.push({ name: postScript, command: scriptsMap[postScript] });
>   }
>
>   return pipeline;
> }
>
> // Verification tests
> const scripts = {
>   prebuild: "rimraf dist",
>   build: "tsc",
>   postbuild: "echo Done"
> };
>
> const pipeline = resolveNpmScriptPipeline(scripts, "build");
> console.assert(pipeline.length === 3, "Test 1 Failed");
> console.assert(pipeline[0].name === "prebuild", "Test 2 Failed: prebuild executes first");
> console.assert(pipeline[2].name === "postbuild", "Test 3 Failed: postbuild executes last");
> ```
>
> #### Technical Explanation
>
> 1. **npm Lifecycle Hooks**: npm automatically runs `pre<script>` before and `post<script>` after executing `npm run <script>`.
> 2. **Built-in Lifecycle Events**: Standard npm events include `preinstall`, `postinstall`, `pretest`, `test`, `posttest`.
> 3. **Task Automation**: Eliminates custom shell scripts by chaining task pipelines directly inside `package.json` scripts.
> 
---

### Exercise 2: npm Security Vulnerability Audit Parser

**Scenario:** A CI security scanner parses JSON output from `npm audit --json` to fail builds if high or critical vulnerabilities exist.

**Requirements:**
1. Write parseNpmAuditReport(auditJsonObj).
2. Count vulnerabilities by severity (critical, high, moderate, low).
3. Return flag if critical/high vulnerabilities exist.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function parseNpmAuditReport(auditJsonObj = {}) {
>   const vulnerabilities = auditJsonObj.vulnerabilities || {};
>
>   const counts = { critical: 0, high: 0, moderate: 0, low: 0, info: 0 };
>
>   for (const [name, info] of Object.entries(vulnerabilities)) {
>     const severity = (info.severity || "low").toLowerCase();
>     if (severity in counts) {
>       counts[severity]++;
>     }
>   }
>
>   const isBuildBlocked = counts.critical > 0 || counts.high > 0;
>
>   return {
>     counts,
>     isBuildBlocked,
>     summary: `Audit found ${counts.critical} critical, ${counts.high} high vulnerabilities.`
>   };
> }
>
> // Verification tests
> const report = {
>   vulnerabilities: {
>     "axios": { severity: "high" },
>     "lodash": { severity: "critical" },
>     "minimist": { severity: "low" }
>   }
> };
>
> const parsed = parseNpmAuditReport(report);
> console.assert(parsed.isBuildBlocked === true, "Test 1 Failed: Critical/High must block build");
> console.assert(parsed.counts.critical === 1 && parsed.counts.high === 1, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **npm audit Tool**: Scans project dependency tree against the GitHub Advisory Database for known security vulnerabilities.
> 2. **npm audit fix**: Automatically updates vulnerable dependencies to non-breaking patched versions.
> 3. **CI/CD Security Gates**: Enforcing `npm audit --audit-level=high` blocks compromised packages from reaching production.
> 
---

### Exercise 3: Private npm Registry Auth Token Configurator

**Scenario:** An enterprise deployment tool generates `.npmrc` configuration strings to authenticate against private corporate npm registries.

**Requirements:**
1. Write generateNpmRcConfig(registryUrl, authToken).
2. Format `//registryUrl:_authToken=authToken`.
3. Return .npmrc content string.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function generateNpmRcConfig(registryUrl = "registry.company.com", authToken = "") {
>   if (!authToken) {
>     throw new Error("Auth token is required for private npm registry configuration");
>   }
>
>   const cleanUrl = registryUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
>
>   const npmrcContent = `registry=https://${cleanUrl}/
> //${cleanUrl}/:_authToken=${authToken}
> always-auth=true`;
>
>   return npmrcContent;
> }
>
> // Verification tests
> const npmrc = generateNpmRcConfig("registry.corp.com/", "npm_secret_123");
> console.assert(npmrc.includes("registry=https://registry.corp.com/"), "Test 1 Failed");
> console.assert(npmrc.includes("//registry.corp.com/:_authToken=npm_secret_123"), "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **.npmrc Configuration File**: Configures npm registry settings, authentication tokens, and scoped package registries (`@company:registry`).
> 2. **Environment Token Injection**: Best practice uses environment variable interpolation (`_authToken=${NPM_TOKEN}`) in `.npmrc` to prevent checking secret keys into Git.
> 3. **Scoped Registries**: Allows fetching internal private packages (`@mycorp/sdk`) from private registries while public packages come from npmjs.org.
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
