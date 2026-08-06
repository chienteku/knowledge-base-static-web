# IP Address & Port

> **Level 1 — Foundations of the Web**
> The numeric address + door number that locates a server on the network.

---

## 1. Prerequisites
- [Client-Server Model](client_server_model.md) — The core network communication concept.

---

## 2. Term Category
- **Networking Protocol**

---

## 3. Environment Context
- **Universal**: Works everywhere across all internet-connected devices.

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Door Locator

**Problem:** Match the client request URL to the default port number the request will target:

1. `https://api.github.com/users`
2. `http://example.com/index.html`
3. `ssh://developer@192.168.1.100`

> [!check]- Answer
> - Secure HTTPS uses the standard encryption port `443`.
> - Unencrypted HTTP web pages default to port `80`.
> 
> [!check]- Answer
> - 1. Port **`443`** (HTTPS)
> - 2. Port **`80`** (HTTP)
> - 3. Port **`22`** (SSH)
> 
> 
---

### Exercise 2: Private vs Public IP Address Identification

**Problem:** Identify whether each IP address is Public or Private (RFC 1918):
1. `192.168.1.1` 
2. `8.8.8.8` 
3. `10.0.4.15` 

**Expected output:**
> [!check]- Answer
> ```text
> 1. Private (LAN)
> 2. Public (Google DNS)
> 3. Private (VPC/LAN)
> ```
> ```text
> 1. Private (192.168.0.0/16 RFC 1918 range)
> 2. Public (Routable WAN address)
> 3. Private (10.0.0.0/8 RFC 1918 range)
> ```
> - **Explanation:** Private IP ranges are reserved for internal local area networks.
---

### Exercise 3: IPv6 Address Compression

**Problem:** Compress the IPv6 address `2001:0db8:0000:0000:0000:0000:0000:0001` using standard zero compression rules.

**Expected output:**
> [!check]- Answer
> ```text
> 2001:db8::1
> ```
> ```text
> 2001:db8::1
> ```
> - **Explanation:** Leading zeros in each group are omitted and contiguous zero fields are replaced with `::`.
---

## 7. Related Terms
- [DNS (Domain Name System)](dns.md) — The phonebook system mapping user domains to IP addresses.
- [HTTP / HTTPS](http_https.md) — The application layer protocols routing through ports `80` and `443`.

---

## 8. Key Takeaways
- An IP address identifies a physical device on a network (IPv4 dots vs IPv6 colons).
- A Port is a logical channel number (0–65535) routing traffic to a specific software program.
- Special IP `127.0.0.1` and hostname `localhost` represent your local loopback machine.
- Standard default web ports are `80` (HTTP) and `443` (HTTPS).
- Port conflicts throw `EADDRINUSE` crashes if two programs try to bind to the same port simultaneously.
