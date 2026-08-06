# Vue CLI (Webpack)

> **Level 10 — Tooling & Ecosystem**
> The historical, Webpack-based command-line interface used to scaffold and build legacy Vue applications. **It is officially deprecated in favor of Vite (`create-vue`).**

---

## 1. Prerequisites

- [Build Step (Compilation)](build_step.md) — The asset compilation process that Vue CLI managed using Webpack.
- [Vite](vite.md) — The modern, official replacement for Vue CLI.

---

## 2. Term Category

**Deprecated Tooling (Legacy Toolchain)**: Vue CLI (`@vue/cli`) was the standard command-line scaffolding and build management tool for Vue 2 and early Vue 3 projects. Powered internally by Webpack and `@vue/cli-service`, it abstracted complex Webpack configurations behind an opinionated options file (`vue.config.js`).

As of Vue 3.2+, the Vue Core Team officially placed Vue CLI into **maintenance mode (deprecated status)**. Modern Vue applications are scaffolded using `npm create vue@latest` (powered by Vite and Rollup), which delivers 10x–100x faster dev server startup speeds and instant Hot Module Replacement (HMR).

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In 2017 (the Vue 2 era), setting up a production-grade Webpack configuration from scratch required writing hundreds of lines of complex configuration code: configuring Babel transpilers, ESLint rules, PostCSS plugins, `vue-loader`, and file asset loaders. Developers spent days battling Webpack config errors before writing a single component.

Vue CLI was created to solve configuration fatigue. By running `vue create my-project`, developers answered interactive terminal prompts, and Vue CLI generated a pre-configured project structure. It hid Webpack's complexity inside `@vue/cli-service`, allowing teams to customize build behavior via a simplified `vue.config.js` file.

### (2) Reality Metaphor
Imagine a steam-powered locomotive train from the late 19th century. When it was invented, it revolutionized transportation, allowing people to cross continents reliably compared to horse-drawn carriages. However, to start a steam locomotive, engineers had to spend hours shoveling coal, heating water boilers, and building up steam pressure before the train could move a single inch.

Vue CLI (Webpack) was that steam locomotive. It revolutionized frontend project setup in 2017, but requires massive "boiler warm-up time" (Webpack bundling unbundled source code) before the dev server can start. Vite is a modern high-speed electric bullet train—you flip a switch, and it moves instantly.

### (3) Vue Code Examples

#### Short Snippet
```javascript
// Legacy vue.config.js (Vue CLI Webpack Configuration)
module.exports = {
  // Webpack dev server configuration
  devServer: {
    port: 8080,
    proxy: 'http://localhost:3000'
  },
  // Customizing Webpack options via webpack-chain
  chainWebpack: config => {
    config.plugin('html').tap(args => {
      args[0].title = 'Legacy Vue CLI App'
      return args
    })
  }
}
```

#### Fuller Example
```javascript
// Migration Guide: Identifying Vue CLI vs Vite Projects
// Check root directory files:

/* 
  LEGACY VUE CLI PROJECT (Webpack):
  ├── vue.config.js          <-- Primary giveaway for Vue CLI!
  ├── package.json           <-- Contains "@vue/cli-service" dependency
  └── src/
      └── main.js            <-- Uses require() or legacy Webpack plugins

  MODERN VUE PROJECT (Vite):
  ├── vite.config.js         <-- Primary indicator for Vite!
  ├── index.html             <-- Located at ROOT (not in public/)
  ├── package.json           <-- Contains "vite" and "@vitejs/plugin-vue"
  └── src/
      └── main.js            <-- Uses native ES modules (import / export)
*/

// package.json script comparison:
// Legacy Vue CLI:
// "scripts": { "serve": "vue-cli-service serve", "build": "vue-cli-service build" }
// Modern Vite:
// "scripts": { "dev": "vite", "build": "vite build" }
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Scaffolding New Vue Projects in 2026 Using `vue create`

**The mistake:** Opening a terminal and running `npm install -g @vue/cli` followed by `vue create my-app` to start a new Vue 3 project.

**Why it's wrong:** Vue CLI is deprecated and in maintenance mode. Scaffolding new projects with Vue CLI dooms the repository to legacy Webpack dependencies, slow dev server boot times, and lack of modern ecosystem updates.

*Incorrect:*
```bash
# ❌ Deprecated legacy scaffolding tool!
npm install -g @vue/cli
vue create my-project
```

*Fix:*
```bash
# ✅ Official modern scaffolding command powered by Vite
npm create vue@latest
```

---

### Mistake 2: Modifying Webpack Files Inside `node_modules/@vue/cli-service` Directly

**The mistake:** Editing hidden Webpack configuration files inside `node_modules/@vue/cli-service/webpack.config.js`.

**Why it's wrong:** Any changes made directly inside `node_modules` are completely erased whenever `npm install` or CI/CD build scripts run.

*Incorrect:*
```text
Editing Webpack configs directly inside node_modules directory.
```

*Fix:*
```javascript
// vue.config.js
// ✅ Extend Webpack configuration safely inside vue.config.js
module.exports = {
  configureWebpack: {
    plugins: [ /* Custom Webpack Plugins */ ]
  }
}
```

---

### Mistake 3: Expecting Vite Environment Variables (`import.meta.env`) to Work in Vue CLI

**The mistake:** Writing `import.meta.env.VITE_API_URL` inside a legacy Vue CLI project.

**Why it's wrong:** Vue CLI uses Webpack's `DefinePlugin` and exposes environment variables on `process.env.VUE_APP_*`. It does not support `import.meta.env`.

*Incorrect:*
```javascript
// ❌ Fails in Vue CLI (Webpack)!
const url = import.meta.env.VITE_API_URL
```

*Fix:*
```javascript
// ✅ Vue CLI uses process.env with VUE_APP_ prefix
const url = process.env.VUE_APP_API_URL
```

---

## 5. Practice Exercises

### Exercise 1: IoT Legacy Vue CLI Maintenance Auditor

**Scenario:** An industrial IoT engineering team inherits a legacy telemetry dashboard created in 2019. An auditor script inspects `package.json` to detect whether the project uses legacy Vue CLI or modern Vite.

**Requirements:**
1. Parse dependency objects.
2. Detect presence of `@vue/cli-service` vs `vite`.
3. Return a toolchain classification string.
4. Include a test assertion validating toolchain detection logic.

> [!check]- Answer
>
> #### Implementation
> ```javascript
> // toolchainAudit.test.js
> function detectToolchain(packageJson) {
>   const deps = { ...packageJson.dependencies, ...packageJson.devDependencies }
>   if (deps['@vue/cli-service']) return 'LEGACY_VUE_CLI'
>   if (deps['vite']) return 'MODERN_VITE'
>   return 'UNKNOWN'
> }
> 
> function testToolchainDetection() {
>   const legacyPkg = { devDependencies: { '@vue/cli-service': '^4.5.0' } }
>   const modernPkg = { devDependencies: { 'vite': '^5.0.0' } }
> 
>   console.assert(detectToolchain(legacyPkg) === 'LEGACY_VUE_CLI', 'Test Failed: Legacy detection failed')
>   console.assert(detectToolchain(modernPkg) === 'MODERN_VITE', 'Test Failed: Modern detection failed')
>   console.log('Toolchain Detection Test Passed')
> }
> 
> testToolchainDetection()
> ```
>
> #### Technical Explanation
> 1. **Concept**: `@vue/cli-service` is the core npm dependency indicating a Vue CLI Webpack project.
> 2. **Concept**: `vite` indicates a modern ES module build pipeline.
> 3. **Concept**: Auditing toolchains ensures projects follow active security and performance guidelines.
> 4. **Concept**: Unit assertions verify detection accuracy.
> 
---

### Exercise 2: Financial Environment Variable Migration Helper

**Scenario:** A financial firm migrates a legacy Vue CLI application to Vite. The team writes a helper function to translate legacy `process.env.VUE_APP_*` keys into modern `import.meta.env.VITE_*` keys.

**Requirements:**
1. Accept an object of legacy `VUE_APP_` environment keys.
2. Rename keys to use `VITE_` prefix.
3. Preserve key values.
4. Include a test assertion checking key renaming.

> [!check]- Answer
>
> #### Implementation
> ```javascript
> // envMigrate.test.js
> function migrateEnvKeys(legacyEnv) {
>   const migrated = {}
>   for (const [key, value] of Object.entries(legacyEnv)) {
>     if (key.startsWith('VUE_APP_')) {
>       const newKey = key.replace('VUE_APP_', 'VITE_')
>       migrated[newKey] = value
>     } else {
>       migrated[key] = value
>     }
>   }
>   return migrated
> }
> 
> function testEnvMigration() {
>   const legacy = { VUE_APP_API_URL: 'https://finance.api.com', VUE_APP_TIMEOUT: '5000' }
>   const migrated = migrateEnvKeys(legacy)
> 
>   console.assert(migrated.VITE_API_URL === 'https://finance.api.com', 'Test Failed: Key renaming failed')
>   console.assert(migrated.VITE_TIMEOUT === '5000', 'Test Failed: Value lost')
>   console.log('Env Migration Test Passed')
> }
> 
> testEnvMigration()
> ```
>
> #### Technical Explanation
> 1. **Concept**: Vue CLI required `VUE_APP_` prefixes for client variable injection.
> 2. **Concept**: Vite requires `VITE_` prefixes for `import.meta.env` client variable injection.
> 3. **Concept**: Migrating environment keys is an essential step when upgrading legacy codebases.
> 4. **Concept**: Unit tests verify string transformation correctness.
> 
---

### Exercise 3: E-Commerce Webpack Alias Transformer

**Scenario:** An e-commerce engineering team updates legacy `vue.config.js` Webpack aliases into `vite.config.js` alias definitions.

**Requirements:**
1. Transform Webpack `@` alias format to Vite `resolve.alias` format.
2. Map `@/components` paths.
3. Include a test assertion checking path resolution mappings.

> [!check]- Answer
>
> #### Implementation
> ```javascript
> // aliasMigrate.test.js
> function convertWebpackAliasToVite(webpackAliasObj) {
>   const viteAlias = {}
>   for (const [alias, targetPath] of Object.entries(webpackAliasObj)) {
>     viteAlias[alias] = targetPath
>   }
>   return { resolve: { alias: viteAlias } }
> }
> 
> function testAliasMigration() {
>   const webpackAliases = { '@': '/src', '@components': '/src/components' }
>   const viteConfig = convertWebpackAliasToVite(webpackAliases)
> 
>   console.assert(viteConfig.resolve.alias['@'] === '/src', 'Test Failed: Alias mapping failed')
>   console.log('Alias Migration Test Passed')
> }
> 
> testAliasMigration()
> ```
>
> #### Technical Explanation
> 1. **Concept**: `vue.config.js` used Webpack `configureWebpack.resolve.alias`.
> 2. **Concept**: `vite.config.js` uses `resolve.alias` objects or array definitions.
> 3. **Concept**: Path aliases simplify component imports across large application trees.
> 4. **Concept**: Assertions confirm object mapping.
> 
---

## 6. Related Terms

- [Vite](vite.md) — The modern, official build tool that replaces Vue CLI.
- [Build Step (Compilation)](build_step.md) — The asset compilation process managed by Vue CLI and Webpack.
- [Single-File Components (SFCs)](../level_04/sfc.md) — SFC format compiled by `vue-loader` in Vue CLI.

---

## 7. Key Takeaways

- **Vue CLI (`@vue/cli`)** is the legacy, Webpack-based scaffolding tool for Vue 2 and early Vue 3 apps.
- It is officially **deprecated** and placed in maintenance mode by the Vue Core Team.
- Suffer from slow dev server boot times on large repositories due to Webpack's bundling architecture.
- For all new Vue projects, use Vite scaffolding (`npm create vue@latest`).
- Legacy Vue CLI projects are identified by the presence of a `vue.config.js` file and `@vue/cli-service` dependencies.
