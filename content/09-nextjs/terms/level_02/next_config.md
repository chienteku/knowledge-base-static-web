# `next.config.mjs`

> **Level 2 — App Router UI Elements**
> The central configuration file at the root of a Next.js project used to customize compilation, image routing limits, and build targets.

---

## 1. Prerequisites
- [Next.js Overview](../level_01/nextjs.md) — The parent framework configured by this file.

---

## 2. Term Category

**Framework Architecture** (Master Configuration File): `next.config.js` configures build settings, image optimization hosts, environment variables, headers, and redirects for Next.js.



---

## 3. Explanation

### Environment Context
- **Build-Time** (Configuration is loaded once by Next.js during compilation and dev server initialization).

### (1) Design Motivation — "Why did we design this?"
While Next.js works out of the box with zero configuration, large-scale production applications often require fine-tuning. For example:
-   Restricting the domains from which images can be fetched for safety.
-   Enabling experimental features like Partial Prerendering (PPR).
-   Customizing asset paths or compiler properties (like stripping `console.log` statements in production).

The **`next.config.mjs`** (or `next.config.js`) file was designed to solve this. It provides a standardized JavaScript/ESM interface to modify the framework's internal build pipeline (Webpack/Turbopack, Babel, SWC) and server runtime behaviors.

---

### (2) Core Config Properties & Syntax
The file lives at the root of the workspace directory and exports a configuration object:

```javascript
// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. Authorize specific external domains to load images via <Image />
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/photo/**',
      },
    ],
  },

  // 2. Enable experimental rendering modes
  experimental: {
    ppr: true, // Opt-in to Partial Prerendering (PPR)
  },

  // 3. Optimize production code builds
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production', // Strip logs in production
  },

  // 4. Set deployment target
  output: 'standalone', // Optimized Docker build mode
};

export default nextConfig;
```

---

### (3) Static vs. Runtime configurations
Config settings fall into two execution scopes:
-   **Build-time Rules:** Settings like `output: 'standalone'` or custom webpack hooks compile code and restructure output folders during the build phase.
-   **Server-runtime Rules:** Settings like `images.remotePatterns` are loaded by the Next.js server to run checks on image optimization requests during runtime.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Expecting next.config.mjs edits to apply without restarting the dev server

**The mistake:** Modifying a setting (like a new remote image path) and refreshing the browser, expecting the changes to apply instantly:

**Why it's wrong:** Unlike standard component code (which triggers Hot Module Replacement in the browser), `next.config.mjs` is executed once when the Next.js server process boots. If you edit the config, the running node process does not hot-reload it.

**Golden Rule:** Always restart your Next.js development server (`npm run dev`) after modifying `next.config.mjs`.

---

### Mistake 2: Hardcoding Secret Environment Variables in `next.config.js` `env` Block

**The mistake:** Adding `env: { DATABASE_PASSWORD: 'secret' }` in `next.config.js`.

**Why it's wrong:** The `env` block in `next.config.js` bakes environment variables into the JS bundle sent to the client browser. Use `.env.local` for secret server keys.

*Incorrect:*
```javascript
// next.config.js
module.exports = {
  env: { API_SECRET: '12345' } // ❌ Bakes secret into client JS bundle!
};
```

*Fix:*
```javascript
// Use .env.local for secrets and read process.env.API_SECRET in server code
```

---

### Mistake 3: Forgetting `images.remotePatterns` for External Domain Images

**The mistake:** Using `<Image src="https://cdn.example.com/pic.jpg" />` without configuring `remotePatterns` in `next.config.js`.

**Why it's wrong:** For security reasons, Next.js `<Image />` component blocks external image URLs unless explicit hostname patterns are configured in `next.config.js`.

*Incorrect:*
```tsx
// Missing remotePatterns config ❌ Throws runtime error: Invalid src prop!
```

*Fix:*
```javascript
// next.config.js
module.exports = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'cdn.example.com' }]
  }
};
```


---

## 5. Practice Exercises

### Exercise 1: Configuring Environment Variables in `next.config.js`

**Scenario:**
Configure custom build environment variables and redirects in `next.config.js`.

**Requirements:**
1. Export `nextConfig` object in `next.config.js`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> /** @type {import('next').NextConfig} */
> const nextConfig = {
>   env: {
>     CUSTOM_APP_VERSION: "v2.5.0"
>   },
>   async redirects() {
>     return [
>       {
>         source: "/legacy-docs",
>         destination: "/docs",
>         permanent: true
>       }
>     ];
>   }
> };

module.exports = nextConfig;
```

> #### Technical Explanation
>
> 1. `next.config.js` configures compilation, bundling, and server routing behavior.
> 2. `redirects()` executes HTTP redirects on the server before hitting React routing logic.
> 3. Central configuration file for Next.js applications.

---

### Exercise 2: Configuring Webpack and Vite Bundler Overrides

**Scenario:**
Add custom SVG loader rules using `webpack` property inside `next.config.js`.

**Requirements:**
1. Override `webpack(config, options)` in configuration.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> module.exports = {
>   webpack: (config, { isServer }) => {
>     config.module.rules.push({
>       test: /\.svg$/,
>       use: ["@svgr/webpack"]
>     });
>     return config;
>   }
> };
> ```

> #### Technical Explanation
>
> 1. `webpack` hook allows customizing underlying build bundler rules.
> 2. `isServer` flag identifies whether the current build pass is targeting Node.js server or client bundles.
> 3. Extensible bundler configuration interface.

---

### Exercise 3: Setting Custom HTTP Response Headers

**Scenario:**
Attach security headers (`X-Frame-Options`, `Content-Security-Policy`) to all incoming requests via `headers()`.

**Requirements:**
1. Configure `async headers()` in `next.config.js`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> module.exports = {
>   async headers() {
>     return [
>       {
>         source: "/:path*",
>         headers: [
>           { key: "X-Frame-Options", value: "DENY" },
>           { key: "X-Content-Type-Options", value: "nosniff" }
>         ]
>       }
>     ];
>   }
> };
> ```

> #### Technical Explanation
>
> 1. `headers()` appends custom HTTP response headers to matching route paths automatically.
> 2. Enforces security policies at the Node.js / edge server level.
> 3. Standard production security header setup.

---




---

## 6. Related Terms
- [Next.js Overview](../level_01/nextjs.md) — The framework itself.
- [Turbopack](../level_10/turbopack.md) — Related concept: Turbopack.

---

## 7. Key Takeaways
- `next.config.mjs` is the configuration entry point for Next.js build and runtime settings.
- Changes require restarting the Next.js server to take effect.
- Use `images.remotePatterns` to define external image domain safety rules.
- Experimental flags like `experimental.ppr` are enabled here.
- Set `output: 'standalone'` to package the app for containerized Docker deployments.
