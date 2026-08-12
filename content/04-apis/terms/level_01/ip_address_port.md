# IP Address & Port

> **Level 1 — Foundations of the Web**
> The numeric address + door number that locates a server on the network.

---

## 1. Prerequisites
- [Client-Server Model](client_server_model.md) — The core network communication concept.

---

## 2. Term Category

**Networking Protocol (Universal: Works everywhere across all internet-connected devices.)**: IP Address & Port is a fundamental concept in this technology stack. **Level 1 — Foundations of the Web**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
To send a letter or order a delivery, you must specify a street address. Similarly, when a client device (like your phone) wants to download data from a server on the internet, it needs a clear way to identify and locate that specific computer among billions of others on the web. 

This location system is powered by the combination of an **IP Address** and a **Port**:

#### 1. IP (Internet Protocol) Address
A unique numerical label assigned to every device connected to a computer network.
- **IPv4:** The classic 32-bit address format. Written as four numbers (each from `0` to `255`) separated by periods (e.g. `172.217.7.14` for Google).
- **IPv6:** The modern 128-bit address format designed to replace IPv4. Written as hexadecimal blocks separated by colons (e.g. `2001:0db8:85a3:0000:0000:8a2e:0370:7334`).
- **Loopback Address:** `127.0.0.1` (known as `localhost`) is a special loopback IP address representing your own local machine.

#### 2. Port
While the IP address locates the *physical server*, a single server machine can run multiple networking applications at once—such as serving a web page, managing a database, and receiving emails.

A **Port** is a 16-bit number (from `0` to `65535`) that acts as a logical sub-channel to route traffic to the correct software program running on that machine.
- **Standard Ports:** By default, web traffic uses standardized ports to avoid users having to type them:
  - **Port `80`:** Default channel for unencrypted **HTTP** traffic.
  - **Port `443`:** Default channel for secure, encrypted **HTTPS** traffic.
  - **Port `22`:** Default channel for secure terminal login (**SSH**).

### (2) Reality Metaphor
- An **IP Address** is like the **street address of a large apartment building** (e.g. *"100 Developer Lane"*). It guides the postal truck to the correct physical structure.
- A **Port** is like the **apartment room number** inside that building (e.g. *"Apt 80"* or *"Apt 443"*). It ensures the mail is delivered to the correct resident (the Web Server software) rather than the database administrator living in *Apt 5432*.

### (3) Code & Terminal Examples

#### Specifying Custom Ports in URLs
When building local applications, you must append the port to the end of the loopback address using a colon (`:`):

```text
http://127.0.0.1:3000/api/users
       └─IP──┘  └─Port┘
```

#### Node.js Server listening on a Custom Port
```javascript
import http from 'http';

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello from Port 3000!\n');
});

// Configure the server program to listen to traffic arriving at Port 3000
server.listen(3000, '127.0.0.1', () => {
  console.log('Server is running at http://127.0.0.1:3000/');
});
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Port conflict crashes (`EADDRINUSE`)

**The mistake:** Attempting to start a local Node.js server on Port `3000` while another process (like a React development server) is already running on Port `3000`.

**Why it's wrong:** A single port channel can only bind to a single software process at a time. Trying to bind a second program to an active port throws a fatal crash error.

*Error Output:*
```text
Error: listen EADDRINUSE: address already in use 127.0.0.1:3000
```

*Fix:* Close the existing process running on that port, or change your server's configuration to use a free port (like `3001` or `8080`).

---

### Mistake 2: Hardcoding `127.0.0.1` inside Docker Containers

**The mistake:** Binding an express server to `127.0.0.1` inside a Docker container and wondering why external host requests fail.

**Why it's wrong:** `127.0.0.1` (loopback) restricts connections exclusively to inside the container. To accept traffic routed from host ports, servers must bind to `0.0.0.0` (all network interfaces).

*Incorrect:*
```javascript
app.listen(3000, '127.0.0.1'); // ❌ Container refuses incoming external traffic!
```

*Fix:*
```javascript
app.listen(3000, '0.0.0.0'); // Listens on all container network interfaces
```

---

### Mistake 3: Attempting to Bind Server Processes to Privileged Ports Without Admin Rights

**The mistake:** Configuring Node.js backend server to listen directly on port `80` or `443` as an unprivileged system user.

**Why it's wrong:** Ports below 1024 are privileged operating system ports requiring root/sudo privileges. Use reverse proxies (Nginx) or port forwarding.

*Incorrect:*
```javascript
app.listen(80); // ❌ Throws EACCES permission denied error!
```

*Fix:*
```javascript
// Listen on unprivileged port 8080 and use Nginx reverse proxy to forward port 80 -> 8080:
app.listen(8080);
```


---

## 5. Practice Exercises

### Exercise 1: Socket Identifier Parser (IP Address & Port Disambiguator)

**Scenario:** A backend network proxy parses client socket connection strings (`IP:Port`) into distinct host IP address and port components.

**Requirements:**
1. Write parseSocketAddress(addressStr).
2. Support IPv4 (192.168.1.1:8080) and IPv6 ([::1]:8080) notation.
3. Return object { ip, port, version }.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function parseSocketAddress(addressStr) {
>   if (typeof addressStr !== "string") return null;
>
>   // Check IPv6 [::1]:8080 format
>   if (addressStr.startsWith("[")) {
>     const closingBracket = addressStr.indexOf("]");
>     if (closingBracket === -1) return null;
>     const ip = addressStr.substring(1, closingBracket);
>     const portStr = addressStr.substring(closingBracket + 2);
>     const port = parseInt(portStr, 10);
>     return { ip, port: isNaN(port) ? null : port, version: "IPv6" };
>   }
>
>   // IPv4 format 192.168.1.1:8080
>   const parts = addressStr.split(":");
>   if (parts.length === 2) {
>     const port = parseInt(parts[1], 10);
>     return { ip: parts[0], port: isNaN(port) ? null : port, version: "IPv4" };
>   }
>
>   return null;
> }
>
> // Verification tests
> const res1 = parseSocketAddress("192.168.1.100:3000");
> console.assert(res1.ip === "192.168.1.100" && res1.port === 3000 && res1.version === "IPv4", "Test 1 Failed");
>
> const res2 = parseSocketAddress("[2001:db8::1]:8443");
> console.assert(res2.ip === "2001:db8::1" && res2.port === 8443 && res2.version === "IPv6", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **IP Address Purpose**: Identifies a specific device or host on an IP network (IPv4 32-bit vs IPv6 128-bit).
> 2. **Port Number Purpose**: Identifies a specific process or service running on that host (0–65535 range).
> 3. **Socket Tuple**: Combining IP address and Port number defines a complete network communication socket endpoint.
> 
---

### Exercise 2: Privileged & Well-Known Port Range Guard

**Scenario:** A server deployment script checks target service ports to verify if they fall within the privileged system port range (0–1023).

**Requirements:**
1. Write auditServerPort(portNumber).
2. Validate port range (1–65535).
3. Check if port is privileged (<= 1023).
4. Return audit object.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function auditServerPort(port) {
>   const p = Number(port);
>   if (!Number.isInteger(p) || p < 1 || p > 65535) {
>     return { valid: false, reason: "Port must be integer between 1 and 65535" };
>   }
>
>   const isPrivileged = p <= 1023;
>   const isWellKnown = p === 80 || p === 443 || p === 22 || p === 21;
>
>   return {
>     valid: true,
>     port: p,
>     isPrivileged,
>     isWellKnown,
>     requiresRootPermission: isPrivileged
>   };
> }
>
> // Verification tests
> const httpAudit = auditServerPort(80);
> console.assert(httpAudit.valid === true && httpAudit.isPrivileged === true, "Test 1 Failed");
>
> const appAudit = auditServerPort(8080);
> console.assert(appAudit.valid === true && appAudit.isPrivileged === false, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Port Range Classification**: Well-Known/System Ports (0–1023), Registered Ports (1024–49151), Dynamic/Private Ports (49152–65535).
> 2. **Privileged Port Access**: Ports below 1024 require elevated root/superuser privileges to bind to on Unix/Linux OS.
> 3. **Standard Well-Known Ports**: HTTP (80), HTTPS (443), SSH (22), FTP (21), DNS (53).
> 
---

### Exercise 3: IPv4 Subnet Mask Match Inspector

**Scenario:** A firewall rule evaluator checks if a client IP address falls within a designated internal private IP subnet (e.g. 10.0.0.0/8, 192.168.0.0/16).

**Requirements:**
1. Write isPrivateIpv4(ipStr).
2. Check 10.x.x.x, 172.16-31.x.x, and 192.168.x.x private ranges.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function isPrivateIpv4(ipStr) {
>   if (typeof ipStr !== "string") return false;
>   const parts = ipStr.split(".").map(p => parseInt(p, 10));
>   if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) {
>     return false;
>   }
>
>   // 10.0.0.0/8
>   if (parts[0] === 10) return true;
>
>   // 172.16.0.0/12 (172.16.0.0 to 172.31.255.255)
>   if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
>
>   // 192.168.0.0/16
>   if (parts[0] === 192 && parts[1] === 168) return true;
>
>   // 127.0.0.1 Loopback
>   if (parts[0] === 127) return true;
>
>   return false;
> }
>
> // Verification tests
> console.assert(isPrivateIpv4("192.168.1.50") === true, "Test 1 Failed");
> console.assert(isPrivateIpv4("10.5.0.1") === true, "Test 2 Failed");
> console.assert(isPrivateIpv4("8.8.8.8") === false, "Test 3 Failed: Public Google DNS IP is not private");
> ```
>
> #### Technical Explanation
>
> 1. **Private IP Ranges (RFC 1918)**: Reserved for internal non-routable networks: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16.
> 2. **Loopback Address (127.0.0.1)**: Refers to local host runtime device itself (localhost).
> 3. **Public vs Private Routing**: Private IPs cannot be routed across public internet routers without Network Address Translation (NAT).
---

## 6. Related Terms
- [DNS (Domain Name System)](dns.md) — The phonebook system mapping user domains to IP addresses.
- [HTTP / HTTPS](http_https.md) — The application layer protocols routing through ports `80` and `443`.

---

## 7. Key Takeaways
- An IP address identifies a physical device on a network (IPv4 dots vs IPv6 colons).
- A Port is a logical channel number (0–65535) routing traffic to a specific software program.
- Special IP `127.0.0.1` and hostname `localhost` represent your local loopback machine.
- Standard default web ports are `80` (HTTP) and `443` (HTTPS).
- Port conflicts throw `EADDRINUSE` crashes if two programs try to bind to the same port simultaneously.
