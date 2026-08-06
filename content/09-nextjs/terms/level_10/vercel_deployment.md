# Deployment (Vercel)

> **Level 10 — Advanced Architecture**
> The official, heavily optimized hosting platform for Next.js applications, created by Vercel (the company that maintains Next.js).

---

## 1. Prerequisites
- [Static Site Generation (SSG)](../level_08/ssg.md) — One of the outputs Vercel hosts (CDN).
- [Dynamic Rendering (SSR)](../level_08/ssr.md) — The other output Vercel hosts (Serverless Functions).
- [Content Delivery Network (CDN) & Edge Cache](cdn_edge.md) — The global edge distribution layer.
- [Serverless Functions](serverless_functions.md) — The dynamic compute containers.

---

## 2. Term Category

**Build & Deployment** (Vercel Platform Integration): Vercel Deployment integrates Next.js build output with automated edge caching, preview deployments, and serverless functions.



---

## 3. Explanation

### Environment Context
- **Production**

### (1) Design Motivation — "Why did we design this?"
Deploying a full-stack Next.js app on a traditional server (like AWS EC2 or DigitalOcean) requires configuring Node.js, setting up a reverse proxy (Nginx), configuring SSL certificates, establishing a CI/CD pipeline from GitHub, and manually managing a CDN for your static assets.
**Vercel** abstracts all of this into zero-configuration hosting. Because Vercel literally built Next.js, their infrastructure is deeply integrated with the framework's features.

### (2) The Vercel Architecture Map
When you push your Next.js code to GitHub, Vercel automatically runs `npm run build`. It then dissects your application and deploys it across its global infrastructure:
1. **Static HTML (SSG), CSS, Images:** Deployed to Vercel's Edge CDN (Content Delivery Network). These are distributed to hundreds of servers worldwide for instant load times.
2. **Server Components & SSR Pages:** Deployed as AWS Lambda **Serverless Functions**. These Node.js functions spin up on-demand to render your dynamic pages.
3. **Middleware & Edge Routes:** Deployed to the **Edge Network** (Vercel Edge Functions), running globally alongside the CDN.
4. **Image Optimization:** Vercel automatically provisions a dedicated microservice to handle `<Image>` resizing on the fly.

### (3) Preview Deployments
One of Vercel's most powerful features. Whenever you open a Pull Request on GitHub, Vercel automatically deploys a complete, isolated copy of your app to a unique, temporary URL. You can send this URL to your team to test the new feature before merging it into production.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Relying on Server-Side State or File Systems

**The mistake:** A developer writes a Next.js app that saves uploaded user avatars to the local `./public/uploads` directory using the Node `fs` module. It works locally. On Vercel, the images disappear after a few minutes.

**Why it's wrong:** Vercel uses **Serverless Functions** to host your backend. Serverless Functions are ephemeral. They spin up to handle a request, and then they are destroyed. Any files saved to the local disk are instantly deleted. 
**Golden Rule:** Next.js apps deployed to Vercel are stateless. You must store files in an external bucket (like AWS S3 or Vercel Blob) and store state/sessions in an external database (like PostgreSQL or Redis).

---

### Mistake 2: Forgetting to Set Production Environment Variables in Vercel Dashboard Settings

**The mistake:** Deploying a Next.js app to Vercel without configuring `DATABASE_URL` in Vercel project environment settings.

**Why it's wrong:** Local `.env.local` files are excluded from Git repos. Deploying without adding environment variables in Vercel Project Settings causes 500 runtime errors.

*Incorrect:*
```tsx
/* Deploying code without adding DATABASE_URL in Vercel Dashboard */
```

*Fix:*
```tsx
/* Add all required production keys in Vercel Dashboard -> Settings -> Environment Variables */
```

---

### Mistake 3: Triggering Unnecessary Production Deployments on Every Minor Git Commit

**The mistake:** Pushing 20 minor documentation commits directly to `main` branch without feature branch PRs.

**Why it's wrong:** Every push to `main` triggers a complete Vercel production build deployment pipeline. Use feature branches and PR Preview Deployments.

*Incorrect:*
```tsx
/* Pushing minor formatting commits directly to production main branch */
```

*Fix:*
```tsx
/* Use feature branches; Vercel creates instant Preview Deployments for code reviews */
```


---

## 5. Practice Exercises

### Exercise 1: Deploying Next.js Projects to Vercel via CLI

**Scenario:**
Deploy a Next.js App Router application to Vercel production using Vercel CLI.

**Requirements:**
1. Run `vercel --prod` CLI command.

> [!check]- Answer
>
> #### Implementation
>
> ```bash
> # Deploy to Vercel Production
> npx vercel --prod
> ```

> #### Technical Explanation
>
> 1. Vercel automatically detects Next.js build output and configures CDN edge caching, serverless functions, and image optimization.
> 2. `vercel --prod` compiles the build locally or remotely and deploys to the production domain.
> 3. Zero-config deployment platform for Next.js.

---

### Exercise 2: Configuring Git Preview Deployments

**Scenario:**
Explain how Vercel Git integration creates automatic preview deployment URLs for every pull request.

**Requirements:**
1. Detail PR preview URL generation and environment variable isolation.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Git Preview Deployment Workflow:
> - Step: Developer opens Pull Request on GitHub/GitLab.
> - Step: Vercel automatically triggers 'next build' in isolated Preview Environment.
> - Step: Generates unique preview URL (e.g. my-app-git-feature-team.vercel.app).
> - Step: Comments preview link directly on the PR for staging testing!
> ```

> #### Technical Explanation
>
> 1. Vercel generates isolated preview deployment URLs for every git branch and pull request.
> 2. Allows testing changes in production-identical staging environments before merging to main.
> 3. Core collaborative CI/CD workflow feature.

---

### Exercise 3: Configuring Vercel Speed Insights and Analytics

**Scenario:**
Enable Vercel Speed Insights package `@vercel/speed-insights/next` in `app/layout.tsx`.

**Requirements:**
1. Render `<SpeedInsights />` component in root layout.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> // app/layout.tsx
> import { SpeedInsights } from "@vercel/speed-insights/next";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
```

> #### Technical Explanation
>
> 1. `<SpeedInsights />` captures real-user performance data (RUM) in client browsers.
> 2. Reports Core Web Vitals metrics directly to the Vercel project analytics dashboard.
> 3. Seamless performance monitoring integration.

---




---

## 6. Related Terms
- [Docker & Standalone Build](standalone_build.md) — The alternative to Vercel for self-hosting.
- [Environment Variables (`.env.local`)](environment_variables.md) — Must be configured in the Vercel Dashboard.
- [Serverless Functions](serverless_functions.md) — Related concept: Serverless Functions.

---

## 7. Key Takeaways
- **Vercel** is the optimal hosting platform for Next.js, requiring zero configuration.
- It splits your app into three pieces: Static Assets (CDN), Serverless Functions (SSR/Node), and Edge Functions (Middleware).
- Because it uses Serverless Functions, your Next.js backend must be completely **stateless**. You cannot save files to disk or rely on server memory.
- Serverless Functions have strict timeouts. Long-running tasks will fail.
