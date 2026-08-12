# DNS (Domain Name System)

> **Level 1 — Foundations of the Web**
> The internet's phonebook: turns `example.com` into an IP address.

---

## 1. Prerequisites
- [IP Address & Port](ip_address_port.md) — The network numbering addressing system.

---

## 2. Term Category

**Networking Protocol (Universal: Resolves domain references across all internet systems.)**: DNS (Domain Name System) is a fundamental concept in this technology stack. **Level 1 — Foundations of the Web**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Computers route network messages using numerical IP addresses (such as `142.250.190.46`). However, humans find it difficult to memorize strings of numbers. We want to type simple, memorable names like `google.com` or `github.com` into our browser address bar.

To solve this, the internet designed the **Domain Name System (DNS)**—a decentralized, hierarchical lookup system that translates human-friendly domain hostnames into machine-readable IP addresses.

#### The DNS Lookup Chain
When you request a domain, the browser queries multiple layers of DNS servers in sequence:
1. **Local DNS Cache:** Your Browser, Operating System, and Router maintain local lookup tables. If you visited the site recently, the IP is resolved instantly without querying the internet.
2. **Recursive DNS Resolver:** If the IP is uncached, your request is sent to a resolver (usually provided by your ISP or public services like Cloudflare `1.1.1.1` or Google `8.8.8.8`).
3. **Root Nameservers (`.`):** The resolver asks Root servers, which point to the correct Top-Level Domain (TLD) server.
4. **TLD Nameservers (e.g. `.com`):** Directs the resolver to the authoritative nameserver holding the domain configuration.
5. **Authoritative Nameserver:** The final destination. It returns the exact destination IP address (an `A` record) to the resolver, which forwards it to the browser.

#### TTL (Time To Live)
DNS records contain a **TTL** property—a number representing how many seconds recursive resolvers are allowed to cache the domain's IP address before they must delete the cache and query the authoritative nameserver again.

### (2) Reality Metaphor
Imagine searching for a contact in your phone.
- A **phone number** (e.g., `+1-555-0199`) is like a raw **IP address**. It is hard to memorize.
- Your **Contacts List** is the **Domain Name System (DNS)**. You click on `"Mom"` (the domain name). The phone translates `"Mom"` to the number `+1-555-0199` and dials.
- If you call her daily, you write her number on a sticky note on your desk (**Local Cache**) to avoid opening the contacts directory.

### (3) Terminal Lookup Examples

#### Using `nslookup` to inspect domain records
You can query DNS servers directly using standard shell utilities to see which IP address a domain resolves to:

```bash
$ nslookup example.com
```

*Terminal Output:*
```text
Server:		127.0.0.53
Address:	127.0.0.53#53

Non-authoritative answer:
Name:	example.com
Address: 93.184.216.34       <-- The resolved IPv4 Address!
Address: 2606:2800:220:1:248:1893:25c8:1946 <-- Resolved IPv6 Address!
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Expecting DNS changes to take effect instantly (Propagation Delay)

**The mistake:** Pointing your domain to a new server IP address (e.g. during a migration), and expecting all users globally to see the new site immediately.

**Why it's wrong:** Due to DNS Caching and the **TTL (Time to Live)** values configured on the old records, resolvers across the internet will keep returning the cached old server IP address until their TTL expires. This delay (typically 1 to 24 hours) is known as **DNS Propagation Delay**.

*Fix:* A day before performing server migrations, reduce the TTL of your DNS records to a low value (like 300 seconds). This forces resolvers to fetch the new IP address almost immediately when you make the switch.

---

### Mistake 2: Setting Long DNS TTL Values During Server Migrations

**The mistake:** Leaving DNS record Time-To-Live (TTL) set to 86400 seconds (24 hours) right before migrating IP addresses.

**Why it's wrong:** DNS resolvers cache records for the TTL duration. High TTL values cause users to reach old servers for up to 24 hours after DNS updates.

*Incorrect:*
```text
; DNS Zone File
example.com.  86400  IN  A  192.0.2.1 ; ❌ 24 hour TTL during live migration!
```

*Fix:*
```text
; Reduce TTL to 300s (5 mins) 48h prior to migration:
example.com.  300    IN  A  192.0.2.1
```

---

### Mistake 3: Confusing A Records with CNAME Records

**The mistake:** Pointing a domain root (`@`) to a domain name using a CNAME record.

**Why it's wrong:** RFC specifications dictate CNAME records cannot coexist with other record types (like MX records). Root domains (`example.com`) should use A/AAAA records or ALIAS/ANAME records.

*Incorrect:*
```text
; Invalid DNS config for apex/root domain
example.com.  IN  CNAME  my-lb.aws.com. ; ❌ Breaks MX and root records!
```

*Fix:*
```text
; Use A record with direct IP or ALIAS record:
example.com.  IN  A  192.0.2.1
```


---

## 5. Practice Exercises

### Exercise 1: DNS Hostname Resolver & Cache Simulator

**Scenario:** An API gateway implements a DNS resolution layer that maps domain names to IP addresses with local caching and TTL expiration.

**Requirements:**
1. Write createDnsResolver(dnsMap).
2. Implement resolve(domain).
3. Return cached IP if TTL valid; else perform DNS lookup and cache.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createDnsResolver(initialDnsRecords) {
>   const records = new Map(Object.entries(initialDnsRecords || {}));
>   const cache = new Map();
>
>   return {
>     resolve(domain) {
>       const now = Date.now();
>       if (cache.has(domain)) {
>         const cached = cache.get(domain);
>         if (now < cached.expiresAt) {
>           return { ip: cached.ip, source: "CACHE" };
>         }
>       }
>
>       const record = records.get(domain);
>       if (!record) {
>         return { ip: null, source: "NXDOMAIN" };
>       }
>
>       cache.set(domain, {
>         ip: record.ip,
>         expiresAt: now + (record.ttlMs || 5000)
>       });
>
>       return { ip: record.ip, source: "DNS_LOOKUP" };
>     }
>   };
> }
>
> // Verification tests
> const dns = createDnsResolver({
>   "api.example.com": { ip: "192.0.2.1", ttlMs: 1000 }
> });
>
> const step1 = dns.resolve("api.example.com");
> console.assert(step1.source === "DNS_LOOKUP" && step1.ip === "192.0.2.1", "Test 1 Failed");
>
> const step2 = dns.resolve("api.example.com");
> console.assert(step2.source === "CACHE", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Domain Name System (DNS) Purpose**: Translates human-readable hostnames (api.example.com) into machine-routable IP addresses (192.0.2.1).
> 2. **Time-To-Live (TTL) Caching**: TTL specifies the duration in seconds/milliseconds that DNS records should be cached before re-querying.
> 3. **NXDOMAIN Response**: NXDOMAIN indicates the specified domain name does not exist in the DNS registry.
> 
---

### Exercise 2: CNAME & A Record Hierarchy Parser

**Scenario:** A network diagnostics tool parses DNS record collections, resolving CNAME alias chains to final A record IP addresses.

**Requirements:**
1. Write resolveCnameChain(domain, dnsTable).
2. Follow CNAME alias targets.
3. Return final IPv4 address or error if loop detected.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function resolveCnameChain(domain, dnsTable) {
>   const visited = new Set();
>   let current = domain;
>
>   while (current) {
>     if (visited.has(current)) {
>       return { error: "CNAME Loop Detected", ip: null };
>     }
>     visited.add(current);
>
>     const record = dnsTable[current];
>     if (!record) return { error: "NXDOMAIN", ip: null };
>
>     if (record.type === "A") {
>       return { ip: record.value, aliasChain: [...visited] };
>     } else if (record.type === "CNAME") {
>       current = record.value;
>     } else {
>       return { error: "Unsupported Record Type", ip: null };
>     }
>   }
>   return { error: "Resolution Failed", ip: null };
> }
>
> // Verification tests
> const table = {
>   "app.com": { type: "CNAME", value: "cdn.provider.net" },
>   "cdn.provider.net": { type: "A", value: "198.51.100.42" }
> };
>
> const res = resolveCnameChain("app.com", table);
> console.assert(res.ip === "198.51.100.42", "Test 1 Failed");
> console.assert(res.aliasChain.length === 2, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **A Record vs CNAME Record**: A records map hostnames directly to IPv4 addresses; CNAME records alias one hostname to another.
> 2. **CNAME Resolution Recursion**: Resolvers follow CNAME alias chains recursively until an A or AAAA record is encountered.
> 3. **Loop Prevention**: Tracking visited domains in a Set prevents infinite recursion loops caused by misconfigured DNS aliases.
> 
---

### Exercise 3: DNS Failover & Round-Robin Load Balancing Simulator

**Scenario:** An API gateway simulates DNS Round-Robin load balancing, cycling through multiple A record IPs to distribute traffic across server nodes.

**Requirements:**
1. Write createRoundRobinDns(domain, ipArray).
2. Implement getNextIp().
3. Cycle through ipArray sequentially.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createRoundRobinDns(domain, ipArray) {
>   if (!Array.isArray(ipArray) || ipArray.length === 0) {
>     throw new Error("IP array must not be empty");
>   }
>   let index = 0;
>
>   return {
>     domain,
>     getNextIp() {
>       const ip = ipArray[index];
>       index = (index + 1) % ipArray.length;
>       return ip;
>     }
>   };
> }
>
> // Verification tests
> const rrDns = createRoundRobinDns("api.service.com", ["10.0.0.1", "10.0.0.2", "10.0.0.3"]);
>
> console.assert(rrDns.getNextIp() === "10.0.0.1", "Test 1 Failed");
> console.assert(rrDns.getNextIp() === "10.0.0.2", "Test 2 Failed");
> console.assert(rrDns.getNextIp() === "10.0.0.3", "Test 3 Failed");
> console.assert(rrDns.getNextIp() === "10.0.0.1", "Test 4 Failed: Must wrap back to first IP");
> ```
>
> #### Technical Explanation
>
> 1. **DNS Round-Robin Load Balancing**: Configuring multiple A records for a single hostname rotates IP responses to balance server traffic.
> 2. **High Availability Failover**: If a server IP fails, DNS records can be updated or client resolvers can retry alternate IPs.
> 3. **Stateless IP Distribution**: Cycles through server nodes without requiring persistent session storage in the DNS resolver layer.
---

## 6. Related Terms
- [URL / URI (Uniform Resource Identifier)](url_uri.md) — The string structure containing the host domain resolved by DNS.
- [HTTP / HTTPS](http_https.md) — The web protocols initiated immediately after DNS resolves the destination IP address.
- [IP Address & Port](ip_address_port.md) — Related concept: IP Address & Port.
- [Client-Server Model](client_server_model.md) — Related concept: Client-Server Model.

---

## 7. Key Takeaways
- DNS translates human-readable domain names (hostnames) into numerical IP addresses.
- Resolvers queryRoot, TLD, and Authoritative nameservers recursively to locate IPs.
- Caching occurs at browser, OS, and resolver layers to speed up future lookups.
- TTL (Time To Live) dictates how many seconds resolvers are allowed to cache DNS records.
- Changing DNS records requires waiting for propagation delay as old caches expire globally.
