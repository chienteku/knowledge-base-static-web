# Vue CLI (Webpack)

> **Level 10 — Tooling & Build Step**
> The historical, Webpack-based command-line interface used to scaffold and build Vue applications. **It is now officially deprecated and replaced by Vite.**

---

## 1. Prerequisites
- [Build Step (Compilation)](build_step.md) — The process the Vue CLI managed.
- [Vite](vite.md) — The modern replacement.
---

## 2. Term Category
- **Tooling / Deprecated**

---

## 3. Environment Context
- **Legacy Build-Time**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In 2017, setting up a Vue project manually was a nightmare. You had to configure Webpack, Babel (for transpilation), ESLint, and CSS pre-processors from scratch. It took hours.
The **Vue CLI** (Command Line Interface) was created as an abstraction layer. You typed `vue create my-app`, answered a few prompts, and the CLI generated a fully configured, production-ready project. It completely hid the complex Webpack configuration inside a package called `@vue/cli-service`.

### (2) The Webpack Engine
Under the hood, Vue CLI was powered by **Webpack**. 
Webpack bundles applications by starting at an entry point (`main.js`), crawling every single `import` in your entire project, and compiling them into a massive dependency graph *before* the dev server could start.
As Vue apps grew to enterprise scale, this Webpack architecture became incredibly slow, leading to 30+ second dev server boot times.

### (3) Deprecation and The Future
Because Webpack's architecture hit a fundamental performance ceiling, Evan You created [Vite](../level_10/vite.md).
As of Vue 3.2+, the Vue Core Team officially placed the Vue CLI into maintenance mode. It will receive security updates, but no new features.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Starting new projects with `vue-cli`

**The mistake:** A developer is hired at a new company to build a modern Vue 3 application. They open their terminal and type `npm install -g @vue/cli` and `vue create app`.

**Why it's wrong:** They are scaffolding a brand new project using a deprecated build tool with inferior performance. They are dooming the project to slow build times and missing out on the modern ecosystem.
**Golden Rule:** NEVER use Vue CLI for new projects. Always use `npm create vue@latest` to scaffold a Vite-powered application.

---

### Mistake 2: Starting New Vue 3 Projects in 2026 Using Deprecated `vue-cli` (`vue create`)

**The mistake:** Running `vue create my-app` to scaffold new Vue 3 projects.

**Why it's wrong:** Vue CLI is in **maintenance mode**. Official Vue tooling replaced Vue CLI with **Vite** (`create-vue`). Vite offers 10x faster startup and instant HMR.

*Incorrect:*
```bash
npm install -g @vue/cli
vue create my-project # ❌ Deprecated legacy tooling!
```

*Fix:*
```bash
npm create vue@latest # Official modern scaffolding powered by Vite
```

---

### Mistake 3: Attempting to Modify Webpack Configuration Directly Without `vue.config.js`

**The mistake:** Editing hidden `node_modules/@vue/cli-service/webpack.config.js` directly.

**Why it's wrong:** Vue CLI manages Webpack via `vue.config.js` using `chainWebpack` or `configureWebpack`. Editing `node_modules` gets overwritten on npm installs.

*Incorrect:*
```vue
/* Modifying webpack config inside node_modules directory */
```

*Fix:*
```vue
// Configure Webpack extensions in vue.config.js:
module.exports = {
  configureWebpack: { plugins: [...] }
};
```


---

## 6. Practice Exercises

### Exercise 1: Configuration Files

**Problem:** You join a company and are assigned to fix a bug in a Vue project. You look at the root folder and see a `vue.config.js` file. What build tool is this project using?

**Expected output:**
> [!check]- Answer
> ```text
> It is using the legacy Vue CLI (Webpack)!
> A modern Vite project will have a `vite.config.js` or `vite.config.ts` file instead. 
> Seeing `vue.config.js` is the immediate giveaway that you are working in an older codebase.
> ```
> - Which config file belongs to which tool?

---

### Exercise 2: Official Vue Project Scaffolding Command

**Problem:** Which modern CLI command scaffolds a new Vue 3 project using Vite and create-vue?

**Expected output:**
> [!check]- Answer
> ```text
> npm create vue@latest
> ```
> - `npm create vue@latest` is the official modern starter tool.
> 
> ```bash
> npm create vue@latest
> ```

---

### Exercise 3: Vue CLI vs Vite Tooling Transition

**Problem:** What underlying bundler powered Vue CLI vs Vite?

**Expected output:**
> [!check]- Answer
> ```text
> Vue CLI: Webpack
> Vite: Esbuild (Dev) + Rollup (Prod)
> ```
> - Vue CLI -> Webpack
> - Vite -> Esbuild & Rollup
> 
> ```text
> Vue CLI used Webpack; Vite uses Esbuild and Rollup.
> ```


---

## 7. Related Terms
- [Vite](vite.md) — The tool you should actually be using.
- [Build Step (Compilation)](build_step.md) — What these tools do.
---

## 8. Key Takeaways
- **Vue CLI** is the legacy, Webpack-based toolchain for Vue development.
- It is officially **deprecated** and in maintenance mode.
- It suffers from slow dev-server startup times on large projects due to Webpack's bundling architecture.
- For all new projects, you must use Vite (`npm create vue@latest`).
- You can identify a legacy Vue CLI project by the presence of a `vue.config.js` file.
