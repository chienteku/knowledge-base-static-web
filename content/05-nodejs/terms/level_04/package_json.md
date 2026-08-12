# package.json

> **Level 4 — Package Management**
> The central configuration file for any Node.js project. It acts as a manifest, detailing the project's name, version, and the exact list of third-party packages it requires to run.

---

## 1. Prerequisites
- [NPM (Node Package Manager)](npm.md) — The tool that automatically creates and edits this file.
- [JSON (JavaScript Object Notation)](../../../04-apis/terms/level_01/json.md) — The syntax format of this file.

---

## 2. Term Category

**Configuration / Architecture (Root Directory of Project)**: package.json is a fundamental concept in this technology stack. **Level 4 — Package Management**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
If you build a Node.js app that relies on 50 different NPM packages (like React, Express, Axios), you cannot push all that downloaded code to GitHub. It's too big.
Instead, you need a "recipe" or a "blueprint." When a new developer joins your team, they don't download the code from GitHub. They download your code, and the **`package.json`** file says: *"In order for this app to work, please go to the internet and fetch Express version 4, and Axios version 1."*
The developer simply types `npm install`, and NPM reads the `package.json` blueprint to rebuild the entire project environment.

### (2) Core Structure
A `package.json` file is just a JSON object. The most important sections are:
```json
{
  "name": "my-cool-api",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

### (3) The `scripts` Object
This is one of the most powerful features. Instead of typing complex terminal commands like `node --watch --env-file=.env src/app.js`, you map that command to a simple word in the `scripts` object. Then you just type `npm run dev` in the terminal!

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Hand-editing the dependencies list

**The mistake:** A developer wants to add `axios` to their project. Instead of using the terminal, they manually open `package.json`, add `"axios": "1.0.0"` to the dependencies list, and save the file. They run their code, and it crashes saying `axios` is missing.

**Why it's wrong:** Writing the name of a package in `package.json` does NOT magically download the code to your computer! It just updates the blueprint. If you edit the file by hand, you still have to run `npm install` afterward to actually download the code.
**Golden Rule:** Always use the terminal (`npm install axios`) to add packages. NPM will automatically download the code AND update the `package.json` file for you in one step.

---



### Mistake 2: Syntax Errors Caused by Trailing Commas in `package.json`

**The mistake:** Leaving a trailing comma after the last key in `package.json`.

**Why it's wrong:** `package.json` strictly requires standard JSON syntax. Trailing commas are illegal in JSON, causing `npm` to fail with `JSONParseError`.

*Incorrect:*
```javascript
{
  "name": "app",
  "version": "1.0.0", // ❌ Trailing comma causes JSON parse error!
}
```

*Fix:*
```javascript
{
  "name": "app",
  "version": "1.0.0"
}
```

### Mistake 3: Omitting the `main` or `exports` Field in NPM Library Packages

**The mistake:** Publishing an npm library package without defining `main` or `exports` in `package.json`.

**Why it's wrong:** Consumers requiring `require('your-library')` won't know which file to load, defaulting to `index.js`. If `index.js` doesn't exist at root, resolution fails.

*Incorrect:*
```javascript
{
  "name": "my-lib",
  "version": "1.0.0"
  // ❌ Missing main entry point!
}
```

*Fix:*
```javascript
{
  "name": "my-lib",
  "version": "1.0.0",
  "main": "./dist/index.js"
}
```

## 5. Practice Exercises

### Exercise 1: Strict package.json Schema Linter

**Scenario:** A repository linter validates `package.json` manifest files against mandatory schema fields (`name`, `version`, `license`, `scripts`).

**Requirements:**
1. Write validatePackageJsonManifest(packageObj).
2. Verify npm package naming rules (lowercase, no spaces).
3. Verify valid SemVer version.
4. Return { valid, errors }.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function validatePackageJsonManifest(packageObj = {}) {
>   const errors = [];
>
>   // 1. Check Name
>   if (!packageObj.name || typeof packageObj.name !== "string") {
>     errors.push("Missing required field 'name'");
>   } else if (!/^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(packageObj.name)) {
>     errors.push("Invalid package 'name': must be URL-safe lowercase without spaces");
>   }
>
>   // 2. Check Version
>   if (!packageObj.version || typeof packageObj.version !== "string") {
>     errors.push("Missing required field 'version'");
>   } else if (!/^\d+\.\d+\.\d+(?:-[\w.]+)?$/.test(packageObj.version)) {
>     errors.push("Invalid 'version': must follow Semantic Versioning (MAJOR.MINOR.PATCH)");
>   }
>
>   // 3. Check License
>   if (!packageObj.license) {
>     errors.push("Missing 'license' field (e.g. 'MIT' or 'UNLICENSED')");
>   }
>
>   return { valid: errors.length === 0, errors };
> }
>
> // Verification tests
> const validPkg = { name: "@myorg/api-server", version: "1.0.0", license: "MIT" };
> console.assert(validatePackageJsonManifest(validPkg).valid === true, "Test 1 Failed");
>
> const invalidPkg = { name: "My Invalid Server", version: "1.0", license: "" };
> const res = validatePackageJsonManifest(invalidPkg);
> console.assert(res.valid === false && res.errors.length === 3, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **package.json Manifest Role**: The central metadata configuration file for Node.js projects and npm packages.
> 2. **npm Naming Rules**: Package names must be lowercase, URL-safe, <=214 chars, and can optionally be scoped (`@scope/package`).
> 3. **License Specification**: Defines open-source licensing (MIT, Apache-2.0) or proprietary status (`UNLICENSED`).
> 
---

### Exercise 2: Dependency Category Splitter & Auditor

**Scenario:** An API build analyzer categorizes dependencies listed in `package.json` into production, development, and peer dependencies.

**Requirements:**
1. Write categorizeDependencies(packageObj).
2. Extract dependencies, devDependencies, peerDependencies.
3. Return count summary.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function categorizeDependencies(packageObj = {}) {
>   const deps = packageObj.dependencies || {};
>   const devDeps = packageObj.devDependencies || {};
>   const peerDeps = packageObj.peerDependencies || {};
>
>   return {
>     prodCount: Object.keys(deps).length,
>     devCount: Object.keys(devDeps).length,
>     peerCount: Object.keys(peerDeps).length,
>     totalCount: Object.keys(deps).length + Object.keys(devDeps).length + Object.keys(peerDeps).length,
>     prodPackages: Object.keys(deps),
>     devPackages: Object.keys(devDeps)
>   };
> }
>
> // Verification tests
> const pkg = {
>   dependencies: { express: "^4.18.0", pg: "^8.10.0" },
>   devDependencies: { jest: "^29.0.0" },
>   peerDependencies: { react: "^18.0.0" }
> };
>
> const cat = categorizeDependencies(pkg);
> console.assert(cat.prodCount === 2, "Test 1 Failed");
> console.assert(cat.devCount === 1, "Test 2 Failed");
> console.assert(cat.totalCount === 4, "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **dependencies vs devDependencies**: `dependencies` are required at runtime in production; `devDependencies` are only used for building/testing.
> 2. **peerDependencies**: Specifies plugin package compatibility expectations (e.g. React plugins require `react` as peer dependency).
> 3. **Pruning in Production**: Ensures production servers avoid installing heavyweight dev tools like linters and test runners.
> 
---

### Exercise 3: Node.js Engine Compatibility Guard

**Scenario:** An application startup check reads the `engines.node` field in `package.json` and verifies runtime Node.js compatibility.

**Requirements:**
1. Write verifyEngineCompatibility(nodeVersion, packageObj).
2. Extract `engines.node` string (e.g. `>=18.0.0`).
3. Return compatibility check.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function verifyEngineCompatibility(nodeVersion = process.versions.node, packageObj = {}) {
>   const engineConstraint = packageObj.engines?.node;
>   if (!engineConstraint) {
>     return { compatible: true, constraint: "NONE" };
>   }
>
>   // Simple min-version extractor for >=18.0.0 pattern
>   const minMatch = engineConstraint.match(/>=?\s*(\d+)/);
>   if (minMatch) {
>     const requiredMajor = parseInt(minMatch[1], 10);
>     const currentMajor = parseInt(nodeVersion.split(".")[0], 10);
>
>     const compatible = currentMajor >= requiredMajor;
>     return {
>       compatible,
>       constraint: engineConstraint,
>       currentMajor,
>       requiredMajor,
>       error: !compatible ? `Node.js major version ${currentMajor} does not meet constraint ${engineConstraint}` : null
>     };
>   }
>
>   return { compatible: true, constraint: engineConstraint };
> }
>
> // Verification tests
> const pkg = { engines: { node: ">=18.0.0" } };
> console.assert(verifyEngineCompatibility("20.9.0", pkg).compatible === true, "Test 1 Failed");
> console.assert(verifyEngineCompatibility("16.14.0", pkg).compatible === false, "Test 2 Failed: Node 16 incompatible with >=18");
> ```
>
> #### Technical Explanation
>
> 1. **engines Field in package.json**: Specifies supported Node.js or npm versions required to run the application.
> 2. **npm engine-strict Setting**: Configuring `engine-strict=true` in `.npmrc` causes `npm install` to fail if Node version mismatches constraint.
> 3. **Runtime Stability**: Prevents deploying applications to server environments running unsupported Node.js versions.
## 6. Related Terms
- [package-lock.json & Deterministic Installs](package_lock.md) — The sister file to `package.json` that guarantees exact versions.
- [node_modules](node_modules.md) — The physical folder where the downloaded code is placed.
- [ES Modules (import, export)](../level_03/es_modules.md) — Related concept: ES Modules (import, export).
- [NPM (Node Package Manager)](npm.md) — Related concept: NPM (Node Package Manager).
- [Semantic Versioning (SemVer)](semantic_versioning.md) — Related concept: Semantic Versioning (SemVer).

---

## 7. Key Takeaways
- **`package.json`** is the blueprint for your Node.js application.
- It keeps track of exactly which third-party packages your app needs (`dependencies`).
- It allows you to create custom terminal shortcuts (`scripts`).
- It allows developers to easily share projects without sending massive folders of code over the internet.
