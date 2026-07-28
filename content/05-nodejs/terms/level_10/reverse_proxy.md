# Reverse Proxy (Nginx)

> **Level 10 — Security & Production**
> Why a proxy sits in front of Node for TLS, static files, and load balancing (mentioned, undefined).

---

## 1. Prerequisites
- [Docker](./docker.md) — The container environment where proxies are typically deployed.
- [The http Module](../level_02/http_module.md) — The underlying server module that the proxy shields.

---

## 2. Term Category
- **Production / DevOps / Systems Architecture**

---

## 3. Environment Context
- **Network Infrastructure Layer** (Sits as an edge gateway between the public internet and your private backend network).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Reverse Proxy Data Flow Mapping

**Problem:** Draw the request-response data flow of a secure production application showing Nginx, Node.js, and a MongoDB database:

```text
Public Internet ──(Port 443 HTTPS)──> [ Nginx Proxy ] 
                                             │
                                             │ (Decrypts TLS -> forwards Port 3000 HTTP)
                                             ▼
                                      [ Node.js Server ] (Firewalled from public)
                                             │
                                             ▼ (DB queries)
                                      [ MongoDB Database ]
```

---

> [!check]- Answer
> - Complete problem steps as outlined above.

---

### Exercise 2: Configuring Nginx Reverse Proxy Location Block

**Problem:** Write Nginx `location /` directive proxying requests to local Node server on port 3000.

**Expected output:**
> [!check]- Answer
> ```text
> location / { proxy_pass http://127.0.0.1:3000; }
> ```
> ```nginx
> location / {
>     proxy_pass http://127.0.0.1:3000;
>     proxy_set_header Host $host;
>     proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
> }
> ```
>
> **Explanation:** `proxy_pass` forwards HTTP requests from Nginx to Node.js backend ports.

---

### Exercise 3: Benefits of Reverse Proxy

**Problem:** List 3 primary benefits of placing Nginx in front of Node.js servers.

**Expected output:**
> [!check]- Answer
> ```text
> 1. SSL/TLS Termination
> 2. High-performance static asset serving
> 3. Request rate-limiting and DDoS mitigation
> ```
> ```text
> 1. SSL/TLS Termination
> 2. High-performance static asset serving
> 3. Request rate-limiting and DDoS mitigation
> ```
>
> **Explanation:** Reverse proxies offload non-application tasks from Node.js event loops.

## 7. Related Terms
- [Load Balancing](./load_balancing.md) — The routing system often combined with reverse proxies.
- [Docker](./docker.md) — The container architecture used to isolate proxies from application servers.

---

## 8. Key Takeaways
- A reverse proxy sits between the public internet and backend application servers.
- It shields Node.js from public ports and prevents the need to run Node as root.
- The proxy handles SSL/TLS termination, freeing Node's CPU resources.
- Nginx serves static assets directly from disk, reducing load on the Node event loop.
- Always firewall your Node.js application port (e.g. 3000) from public network access.
