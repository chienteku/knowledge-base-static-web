# Deployment (Vercel)

> **Level 10 — Advanced Architecture**
> The official, heavily optimized hosting platform for Next.js applications, created by Vercel (the company that maintains Next.js).

---

## 1. Prerequisites
- [Static Site Generation (SSG)](../level_08/ssg.md) — One of the outputs Vercel hosts (CDN).
- [Server-Side Rendering (SSR) Overview](../level_01/ssr.md) — The other output Vercel hosts (Serverless Functions).
- [Content Delivery Network (CDN) & Edge Cache](../level_10/cdn_edge.md) — The global edge distribution layer.
- [Serverless Functions](../level_10/serverless_functions.md) — The dynamic compute containers.

---

## 2. Term Category
- **Infrastructure / DevOps**

---

## 3. Environment Context
- **Production**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Background Jobs

**Problem:** A user clicks "Generate Report". The report takes 5 minutes to generate. Can you use a Next.js Server Action to run this process on Vercel?

**Expected output:**
> [!check]- Answer
> ```text
> No!
> Vercel Serverless Functions have a strict execution timeout (usually 10 to 60 seconds, depending on your plan). If your Server Action runs for 5 minutes, Vercel will forcefully terminate it, and the user will get a 504 Gateway Timeout error.
> For long-running background jobs, you must use an external queuing service like Inngest, Trigger.dev, or AWS SQS.
> ```
> - Serverless functions are designed to be fast and ephemeral.

---

### Exercise 2: Vercel Preview Deployment Advantage

**Problem:** Explain how Vercel Preview Deployments improve team code review workflows.

**Expected output:**
> [!check]- Answer
> ```text
> Every Git branch or Pull Request automatically generates a unique live preview URL, allowing teams to test code changes in a real production-like environment before merging to main.
> ```
> - Generates unique live preview URLs for every Pull Request.
> 
> ```text
> Git Push Branch -> Automated Vercel Live Preview URL
> ```

---

### Exercise 3: Vercel CLI Deployment Command

**Problem:** Which CLI command deploys a Next.js project to production using Vercel CLI?

**Expected output:**
> [!check]- Answer
> ```text
> vercel --prod
> ```
> - `vercel --prod` triggers production deployment.
> 
> ```bash
> vercel --prod
> ```


---

## 7. Related Terms
- [Docker & Standalone Build](../level_10/standalone_build.md) — The alternative to Vercel for self-hosting.
- [Environment Variables](../level_10/environment_variables.md) — Must be configured in the Vercel Dashboard.

---

## 8. Key Takeaways
- **Vercel** is the optimal hosting platform for Next.js, requiring zero configuration.
- It splits your app into three pieces: Static Assets (CDN), Serverless Functions (SSR/Node), and Edge Functions (Middleware).
- Because it uses Serverless Functions, your Next.js backend must be completely **stateless**. You cannot save files to disk or rely on server memory.
- Serverless Functions have strict timeouts. Long-running tasks will fail.
