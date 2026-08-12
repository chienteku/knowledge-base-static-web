# Latency & Bandwidth

> **Level 1 — Foundations of the Web**
> Why the network is "slow": round-trip time vs throughput.

---

## 1. Prerequisites
- [Client-Server Model](client_server_model.md) — The request-response foundation.

---

## 2. Term Category

**Networking Protocol (Universal: Affects web browsers, server API architectures, and mobile users.)**: Latency & Bandwidth is a fundamental concept in this technology stack. **Level 1 — Foundations of the Web**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
When developers or users complain that an API or website is "slow," they are experiencing network limitations. To build fast web applications, you must understand that network speed is governed by two distinct metrics:

#### Latency
The time it takes for a single data packet to travel from the client to the server and back.
- **Metric:** Measured in **milliseconds (ms)** as **Round-Trip Time (RTT)**.
- **Constraint:** Governed by physical distance and the speed of light in fiber-optic cables. If your API server is in Tokyo and your user is in New York, a single round-trip takes a physical minimum of around `120ms` RTT, no matter how fast the user's internet subscription is.
- **API Impact:** High latency makes "chatty" APIs (which make multiple sequential requests) run extremely slow.

#### Bandwidth
The maximum volume of data that can be transmitted over the network in a given period of time.
- **Metric:** Measured in **Megabits per second (Mbps)** or **Gigabits per second (Gbps)**.
- **Constraint:** Governed by network hardware capacity (routers, cellular base stations, and cable types).
- **API Impact:** Low bandwidth makes downloading large files (like images, video files, or massive raw JSON payloads) slow.

#### The Bottleneck: Latency vs. Bandwidth
For modern API integrations (which typically exchange small JSON strings of a few kilobytes), **Latency is almost always the performance bottleneck**, not Bandwidth. Making a single large API call returning `100KB` is far faster than making ten sequential small API calls returning `10KB` each, because the latter suffers ten separate round-trip latency delays.

### (2) Reality Metaphor
Imagine transporting water to a house.
- **Bandwidth** is the **width of the water pipe**. A wide pipe (high bandwidth) can carry 10 gallons of water per second. A narrow pipe (low bandwidth) only carries 1 cup per second.
- **Latency** is the **length of the water pipe**. If the pipe is 5 miles long, when you open the faucet, it takes 5 minutes (latency) for the first drop of water to arrive, even if the pipe is wide enough to deliver a massive flood once the water starts flowing.

Alternatively, on a highway:
- **Bandwidth** is the **number of lanes**. A 6-lane highway allows many trucks to travel side-by-side.
- **Latency** is the **travel time** (speed limit). A single motorcycle carrying an envelope still takes 2 hours to drive from City A to City B, regardless of whether the highway has 2 lanes or 20 lanes.

### (3) JavaScript Performance Examples

#### The Cost of "Chatty" APIs (Sequential Latency)
Suppose a page needs to display a user's profile and their 3 recent posts. The client-to-server latency (RTT) is `150ms`.

##### 1. Chatty, Sequential Requests (Poor Performance)
The code waits for each request to finish before triggering the next:
```javascript
// Total time: 150ms + 150ms + 150ms + 150ms = 600ms!
const user = await fetch('/api/user/42').then(r => r.json()); // 150ms RTT
const post1 = await fetch('/api/posts/1').then(r => r.json()); // 150ms RTT
const post2 = await fetch('/api/posts/2').then(r => r.json()); // 150ms RTT
const post3 = await fetch('/api/posts/3').then(r => r.json()); // 150ms RTT
```

##### 2. Parallel Requests (Better Performance)
Triggering requests concurrently cuts the total latency to a single round-trip:
```javascript
// Total time: 150ms! (All requests travel over the network at the same time)
const [user, post1, post2, post3] = await Promise.all([
  fetch('/api/user/42').then(r => r.json()),
  fetch('/api/posts/1').then(r => r.json()),
  fetch('/api/posts/2').then(r => r.json()),
  fetch('/api/posts/3').then(r => r.json())
]);
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Upgrading internet bandwidth expecting it to solve gaming lag or small API latency

**The mistake:** A user experiences high lag in a multiplayer game or finds their admin dashboard query slow, so they upgrade their home internet subscription from 100 Mbps to 1 Gbps.

**Why it's wrong:** Upgrading bandwidth only helps if your network pipe was saturated (e.g. if someone else in the house was streaming 4K video). Upgrading bandwidth does not speed up the travel time of individual packets. If the game server is located on another continent, your packet RTT latency remains high due to physical distance, regardless of subscription tier.

---

### Mistake 2: Assuming High Bandwidth Automatically Solves API Latency Bottlenecks

**The mistake:** Upgrading a server connection from 1 Gbps to 10 Gbps expecting sequential microservice call latencies to decrease.

**Why it's wrong:** Bandwidth is throughput capacity (pipe size); latency is round-trip time (speed of light travel). sequential API requests bottleneck on network RTT latency regardless of bandwidth size.

*Incorrect:*
```javascript
// 10 sequential 100ms API calls on a 10Gbps line take 1000ms total latency!
for(let i = 0; i < 10; i++) { await fetch(url); }
```

*Fix:*
```javascript
// Parallelize requests using Promise.all to cut overall latency down to ~100ms total:
await Promise.all(urls.map(url => fetch(url)));
```

---

### Mistake 3: Ignoring Network Round Trips (RTT) in Chatty N+1 API Designs

**The mistake:** Fetching a list of 100 items, then executing 100 sequential single HTTP requests to fetch details for each item.

**Why it's wrong:** Each HTTP request adds network RTT latency (e.g. 50ms). 100 sequential calls accumulate 5 seconds of pure network latency overhead. Use batch endpoints or GraphQL.

*Incorrect:*
```javascript
// N+1 API requests adding 100 RTT latency delays
const users = await getUsers();
for (const user of users) {
  user.details = await getUserDetails(user.id); // ❌ 100 individual RTT network trips!
}
```

*Fix:*
```javascript
// Batch endpoint fetching all items in a single HTTP request (1 RTT):
const usersWithDetails = await getUsersWithBatchDetails();
```


---

## 5. Practice Exercises

### Exercise 1: API Request Latency Profiler

**Scenario:** A network monitoring library measures the round-trip latency of API endpoints in milliseconds.

**Requirements:**
1. Write measureLatency(fetchFn, url).
2. Record start timestamp.
3. Execute fetchFn(url).
4. Calculate and return duration in ms.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function measureLatency(fetchFn, url) {
>   if (typeof fetchFn !== "function") throw new Error("fetchFn required");
>
>   const startTime = Date.now();
>   await fetchFn(url);
>   const endTime = Date.now();
>
>   return endTime - startTime;
> }
>
> // Verification tests
> const mockFetch = (url) => new Promise(res => setTimeout(res, 50));
>
> measureLatency(mockFetch, "https://api.example.com/ping").then(latency => {
>   console.assert(latency >= 45, "Test 1 Failed: Latency should be ~50ms");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Latency Definition**: Latency measures time delay (in ms) for data to travel from client to server and back (Round Trip Time / RTT).
> 2. **Factors Affecting Latency**: Geographic distance, network hops, server processing time, and TLS handshake overhead.
> 3. **User Experience Impact**: High latency causes slow page loads even if connection bandwidth is high.
> 
---

### Exercise 2: Bandwidth Throughput Calculator

**Scenario:** A video streaming client measures data download rate (bandwidth throughput) in Megabits per second (Mbps).

**Requirements:**
1. Write calculateBandwidthMbps(byteCount, durationMs).
2. Convert bytes to bits.
3. Convert duration to seconds.
4. Return Mbps rounded to 2 decimals.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function calculateBandwidthMbps(byteCount, durationMs) {
>   if (durationMs <= 0 || byteCount <= 0) return 0;
>
>   const bits = byteCount * 8;
>   const seconds = durationMs / 1000;
>   const mbps = (bits / seconds) / 1_000_000;
>
>   return Number(mbps.toFixed(2));
> }
>
> // Verification tests
> // 5 MB (5,000,000 bytes) downloaded in 2 seconds (2000 ms)
> // 5,000,000 * 8 = 40,000,000 bits / 2s = 20,000,000 bps = 20 Mbps
> const speed = calculateBandwidthMbps(5_000_000, 2000);
> console.assert(speed === 20.00, "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Bandwidth Definition**: Bandwidth measures data transfer capacity (bits per second) over a network connection.
> 2. **Bytes vs Bits**: Storage is measured in Bytes (B); Network bandwidth is measured in Bits (b) (1 Byte = 8 Bits).
> 3. **Bandwidth vs Latency Analogy**: Bandwidth is the width of a highway (capacity); Latency is the speed limit (delay).
> 
---

### Exercise 3: Network Connection Quality Classifier

**Scenario:** A progressive web application tiers UI media quality based on combined latency (RTT) and bandwidth (Mbps) metrics.

**Requirements:**
1. Write classifyNetworkTier(rttMs, mbps).
2. Return "HIGH", "MEDIUM", or "LOW" connection tier.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function classifyNetworkTier(rttMs, mbps) {
>   if (rttMs <= 100 && mbps >= 10) {
>     return "HIGH";
>   }
>   if (rttMs <= 300 && mbps >= 2) {
>     return "MEDIUM";
>   }
>   return "LOW";
> }
>
> // Verification tests
> console.assert(classifyNetworkTier(50, 25) === "HIGH", "Test 1 Failed");
> console.assert(classifyNetworkTier(200, 5) === "MEDIUM", "Test 2 Failed");
> console.assert(classifyNetworkTier(500, 1) === "LOW", "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Adaptive Media Quality**: Serving lower resolution assets on slow connections improves load speed and reduces data cost.
> 2. **Combined Metric Evaluation**: High latency can degrade video streaming even if total bandwidth is high.
> 3. **Network Information API**: Browsers expose effectiveType (4g, 3g, 2g) via navigator.connection.
---

## 6. Related Terms
- [Caching (ETag, Cache-Control)](../level_06/caching.md) — Storing data locally to bypass network latency entirely.
- [Pagination (Offset vs. Cursor)](../level_06/pagination.md) — Limiting API response payload sizes to reduce bandwidth usage.
- [Promise.all / Parallel Requests](../level_05/promise_all.md) — Related concept: Promise.all / Parallel Requests.

---

## 7. Key Takeaways
- Latency is the travel time of a single packet round-trip (measured in RTT milliseconds).
- Bandwidth is the volume capacity of the network pipe (measured in Mbps/Gbps).
- For small API payloads, latency (distance) is the dominant performance bottleneck.
- Parallelize network requests (using `Promise.all`) to avoid sequential latency compounding.
- Reduce payload sizes (via pagination) to prevent bandwidth saturation.
