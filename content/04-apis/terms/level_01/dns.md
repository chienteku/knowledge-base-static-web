# DNS (Domain Name System)

> **Level 1 — Foundations of the Web**
> The internet's phonebook: turns `example.com` into an IP address.

---

## 1. Prerequisites
- [IP Address & Port](ip_address_port.md) — The network numbering addressing system.

---

## 2. Term Category
- **Networking Protocol**

---

## 3. Environment Context
- **Universal**: Resolves domain references across all internet systems.

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Address Resolver

**Problem:** Trace the logical order of steps a browser takes when resolving `api.example.com` for the first time:

- **A.** The resolver queries the `.com` TLD Nameserver.
- **B.** The browser checks its internal local memory cache.
- **C.** The resolver queries the root nameserver.
- **D.** The authoritative nameserver returns the IP `93.184.216.34`.
- **E.** The recursive resolver queries the authoritative nameserver for `example.com`.

> [!check]- Answer
> - 1. **B** (Check local cache first)
> - 2. **C** (Query Root servers if local cache is empty)
> - 3. **A** (Query TLD servers)
> - 4. **E** (Query authoritative nameserver)
> - 5. **D** (Fetch final destination IP)
> 
> 
---

### Exercise 2: DNS Record Type Mapping

**Problem:** Match the DNS record type to its function:
1. A Record
2. CNAME Record
3. MX Record

**Expected output:**
> [!check]- Answer
> ```text
> 1. Maps hostname to IPv4 address
> 2. Maps hostname to another hostname (alias)
> 3. Directs email traffic to mail servers
> ```
> ```text
> 1. A Record -> Maps hostname to IPv4 address
> 2. CNAME Record -> Maps hostname to another hostname (alias)
> 3. MX Record -> Directs email traffic to mail servers
> ```
> - **Explanation:** Each DNS record type serves a specific resolution purpose.
---

### Exercise 3: Trace DNS Resolution Path

**Problem:** Order the 4 servers queried when resolving a fresh domain (`api.github.com`):
Top-Level Domain (TLD) Server, Recursive Resolver, Root Name Server, Authoritative Name Server

**Expected output:**
> [!check]- Answer
> ```text
> 1. Recursive Resolver
> 2. Root Name Server
> 3. TLD Server (.com)
> 4. Authoritative Name Server (github.com)
> ```
> ```text
> 1. Recursive Resolver (e.g. 8.8.8.8)
> 2. Root Name Server (.)
> 3. TLD Server (.com)
> 4. Authoritative Name Server (ns-1.github.com)
> ```
> - **Explanation:** DNS resolution walks down the hierarchical namespace tree.
---

## 7. Related Terms
- [URL / URI (Uniform Resource Identifier)](url_uri.md) — The string structure containing the host domain resolved by DNS.
- [HTTP / HTTPS](http_https.md) — The web protocols initiated immediately after DNS resolves the destination IP address.
- [IP Address & Port](ip_address_port.md) — Related concept: IP Address & Port.
- [Client-Server Model](client_server_model.md) — Related concept: Client-Server Model.

---

## 8. Key Takeaways
- DNS translates human-readable domain names (hostnames) into numerical IP addresses.
- Resolvers queryRoot, TLD, and Authoritative nameservers recursively to locate IPs.
- Caching occurs at browser, OS, and resolver layers to speed up future lookups.
- TTL (Time To Live) dictates how many seconds resolvers are allowed to cache DNS records.
- Changing DNS records requires waiting for propagation delay as old caches expire globally.
