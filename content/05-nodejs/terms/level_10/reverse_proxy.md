# Reverse Proxy (Nginx)

> **Level 10 — Security & Production**
> Why a proxy sits in front of Node for TLS, static files, and load balancing (mentioned, undefined).

---

## 1. Prerequisites
- [Docker](docker.md) — The container environment where proxies are typically deployed.
- [The http Module](../level_02/http_module.md) — The underlying server module that the proxy shields.

---

## 2. Term Category

**Production / DevOps / Systems Architecture (Network Infrastructure Layer .)**: Reverse Proxy (Nginx) is a fundamental concept in this technology stack. **Level 10 — Security & Production**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
While the Node.js `http` module can listen directly to the internet (on port 80 or 443) and serve requests, doing so in production is a **bad security and performance practice**:
-   **Security Vulnerability:** In most operating systems, listening on ports below 1024 (like 80 and 443) requires root privileges. Running your Node.js application process as root is a security risk; if a hacker exploits a vulnerability in your code, they gain root access to the entire operating system.
-   **Resource Drain:** Node.js is not optimized for serving raw static files (HTML, CSS, images). Streaming these assets through the single-threaded JavaScript Event Loop consumes CPU cycles that could be used for database queries and dynamic API calculations.
-   **Encryption Overhead:** Managing SSL/TLS handshakes and decryption requires heavy mathematical CPU overhead.

To protect and optimize Node.js, production systems place a **Reverse Proxy** (like **Nginx** or **HAProxy**) in front of the application:
-   **Reverse Proxy:** An edge server that receives incoming client requests from the public internet and routes them to your backend Node.js application (which runs safely behind a firewall, listening on an unprivileged port like 3000).
-   **SSL/TLS Termination:** Nginx handles the SSL handshake, decrypts the request, and passes plain HTTP to Node.js, reducing Node's CPU usage.
-   **Static File Offloading:** Nginx, built in highly optimized C, serves static files directly from disk without ever hitting the Node.js process.
-   **Security Shielding:** Centralizes rate-limiting, DDoS mitigation, and hides your Node.js server details from the public.

---

### (2) Reality Metaphor
Imagine a high-end jewelry corporate office.
- **Direct Access (No Proxy):** Customers walk directly into the vault room to make purchases, ask questions, or browse brochures. If a thief enters, they have direct access to the jewelry. The vault manager is constantly distracted handing out brochures instead of managing the inventory.
- **Reverse Proxy (Security Gate & Receptionist):** You place a reception desk at the front door. The receptionist answers questions, hands out brochures (**serving static files**), verifies visitor IDs (**SSL termination**), and turns away troublemakers (**DDoS protection**). Only when a customer needs a custom jewelry configuration does the receptionist call the vault manager on an internal phone line (**internal port 3000**) to prepare the order. The vault remains hidden and secure.

---

### (3) Nginx Reverse Proxy Configuration Example

```nginx
server {
    listen 80;
    server_name myapp.com;

    # 1. Offload static files: Nginx serves these directly from disk
    location /static/ {
        alias /var/www/myapp/public/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # 2. Forward dynamic API requests to the Node.js application
    location / {
        proxy_pass http://localhost:3000; # Internal Node port
        proxy_http_version 1.1;
        
        # Pass client IP headers to Node.js
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Leaving the Node.js port exposed to the public internet

**The mistake:** Deploying Nginx on port 80/443, but forgetting to close port 3000 on your cloud provider's firewall (AWS Security Group, digitalOcean firewall, etc.):

```text
Hackers bypass Nginx rules (rate limiting, SSL checks) by connecting directly:
http://your-server-ip:3000/api/users
```

**Why it's wrong:** If port 3000 remains open to the public, attackers can bypass your proxy's security filters, rate limits, and SSL requirements, rendering Nginx useless.

*Fix:* Configure your server's host firewall (using `ufw` or cloud security groups) to block all external public access to port 3000. Ensure only localhost (`127.0.0.1`) or the container network can communicate with the Node.js port.

---



### Mistake 2: Exposing Node.js Directly to Public Web Traffic Without Nginx/Reverse Proxy Shield

**The mistake:** Binding Node.js directly to public port 80/443 without a reverse proxy.

**Why it's wrong:** Node.js is less efficient than Nginx at serving static files, SSL/TLS termination, HTTP/2 multiplexing, and rate limiting. Nginx acts as a security shield in front of Node.

*Incorrect:*
```javascript
// Binding Node.js directly to public 0.0.0.0:80 without Nginx fronting
```

*Fix:*
```javascript
Run Nginx on port 80/443 fronting Node.js running on internal 127.0.0.1:3000
```

### Mistake 3: Forgetting `proxy_set_header X-Forwarded-For` Headers in Nginx Reverse Proxy Configs

**The mistake:** Omitting `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;` in Nginx location blocks.

**Why it's wrong:** Without `X-Forwarded-For`, Node.js sees Nginx's internal IP (`127.0.0.1`) as the client IP for ALL requests, breaking IP-based rate limiting, geo-location, and logging.

*Incorrect:*
```javascript
# Nginx proxy_pass without header forwarding
location / { proxy_pass http://localhost:3000; }
```

*Fix:*
```javascript
location / {
  proxy_pass http://localhost:3000;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

## 5. Practice Exercises

### Exercise 1: Reverse Proxy X-Forwarded Header Injector

**Scenario:** Injects Nginx-style `X-Forwarded-For`, `X-Forwarded-Proto`, and `X-Forwarded-Host` headers when forwarding requests to backend microservices.

**Requirements:**
1. Write injectProxyHeaders(reqMock, targetHost).
2. Inject X-Forwarded headers.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function injectProxyHeaders(reqMock, targetHost) {
>   const headers = { ...(reqMock.headers || {}) };
>   const clientIp = reqMock.socket?.remoteAddress || "127.0.0.1";
>
>   const existingForwarded = headers["x-forwarded-for"] || headers["X-Forwarded-For"];
>   headers["x-forwarded-for"] = existingForwarded ? `${existingForwarded}, ${clientIp}` : clientIp;
>   headers["x-forwarded-proto"] = reqMock.socket?.encrypted ? "https" : "http";
>   headers["x-forwarded-host"] = headers["host"] || "localhost";
>   headers["host"] = targetHost;
>
>   return headers;
> }
>
> // Verification tests
> const mockReq = { headers: { host: "example.com" }, socket: { remoteAddress: "203.0.113.195", encrypted: true } };
> const proxiedHeaders = injectProxyHeaders(mockReq, "internal-service:8080");
>
> console.assert(proxiedHeaders["x-forwarded-for"] === "203.0.113.195", "Test 1 Failed");
> console.assert(proxiedHeaders["x-forwarded-proto"] === "https", "Test 2 Failed");
> console.assert(proxiedHeaders["host"] === "internal-service:8080", "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Reverse Proxy Pattern**: Intermediate server (Nginx, HAProxy, Cloudflare) receiving internet client requests and forwarding them to internal Node.js backend servers.
> 2. **X-Forwarded Headers**: Preserves original client IP, protocol (HTTP/HTTPS), and host header across proxy boundaries.
> 3. **SSL Termination**: Reverse proxy decrypts HTTPS traffic, forwarding plain HTTP requests to internal microservices over secure private networks.
> 
---

### Exercise 2: Nginx-Style Reverse Proxy Path Rewriter

**Scenario:** Rewrites requested URL paths before proxying requests to internal microservice endpoints (e.g. `/api/v1/users` -> `/users`).

**Requirements:**
1. Write rewriteProxyPath(originalUrl, pathPrefixMap).
2. Strip path prefix.
3. Return rewritten URL.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function rewriteProxyPath(originalUrl = "", pathPrefixMap = {}) {
>   for (const [prefix, replacement] of Object.entries(pathPrefixMap)) {
>     if (originalUrl.startsWith(prefix)) {
>       const rewritten = originalUrl.replace(prefix, replacement);
>       return {
>         isRewritten: true,
>         originalUrl,
>         rewrittenUrl: rewritten.startsWith("/") ? rewritten : `/${rewritten}`
>       };
>     }
>   }
>
>   return { isRewritten: false, originalUrl, rewrittenUrl: originalUrl };
> }
>
> // Verification tests
> const res = rewriteProxyPath("/api/v1/users/42", { "/api/v1": "" });
> console.assert(res.isRewritten === true, "Test 1 Failed");
> console.assert(res.rewrittenUrl === "/users/42", "Test 2 Failed: Stripped /api/v1 prefix");
> ```
>
> #### Technical Explanation
>
> 1. **Reverse Proxy URL Rewriting**: Rewrites external public API routes into clean internal microservice path structures.
> 2. **Microservice Routing Table**: Maps path prefixes (`/api/v1/users` -> User Service, `/api/v1/orders` -> Order Service).
> 3. **http-proxy-middleware**: Popular Express package for reverse proxying and path rewriting in Node.js.
> 
---

### Exercise 3: SSL Termination Protocol Inspector

**Scenario:** Inspects reverse proxy headers to detect whether the original internet client connection used HTTPS encryption.

**Requirements:**
1. Write isRequestEncryptedByProxy(reqHeaders).
2. Check `X-Forwarded-Proto` header.
3. Check `X-Forwarded-Ssl` header.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function isRequestEncryptedByProxy(reqHeaders = {}) {
>   const proto = (reqHeaders["x-forwarded-proto"] || reqHeaders["X-Forwarded-Proto"] || "").toLowerCase();
>   const ssl = (reqHeaders["x-forwarded-ssl"] || reqHeaders["X-Forwarded-Ssl"] || "").toLowerCase();
>
>   return proto === "https" || ssl === "on";
> }
>
> // Verification tests
> console.assert(isRequestEncryptedByProxy({ "x-forwarded-proto": "https" }) === true, "Test 1 Failed");
> console.assert(isRequestEncryptedByProxy({ "x-forwarded-proto": "http" }) === false, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **SSL Termination**: Reverse proxies handle TLS/SSL encryption offloading so Node.js backend nodes don't spend CPU cycles on cryptography.
> 2. **HTTPS Enforcer Middleware**: Inspects `X-Forwarded-Proto` to redirect HTTP requests to HTTPS (`301 Moved Permanently`).
> 3. **Secure Cookie Flags**: Allows Node.js to set `Secure` cookie flags safely even when running as HTTP behind an HTTPS proxy.
## 6. Related Terms
- [Load Balancing](load_balancing.md) — The routing system often combined with reverse proxies.
- [Docker](docker.md) — The container architecture used to isolate proxies from application servers.

---

## 7. Key Takeaways
- A reverse proxy sits between the public internet and backend application servers.
- It shields Node.js from public ports and prevents the need to run Node as root.
- The proxy handles SSL/TLS termination, freeing Node's CPU resources.
- Nginx serves static assets directly from disk, reducing load on the Node event loop.
- Always firewall your Node.js application port (e.g. 3000) from public network access.
