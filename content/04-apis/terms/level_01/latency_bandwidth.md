# Latency & Bandwidth

> **Level 1 — Foundations of the Web**
> Why the network is "slow": round-trip time vs throughput.

---

## 1. Prerequisites
- [Client-Server Model](./client_server_model.md) — The request-response foundation.

---

## 2. Term Category
- **Networking Protocol**

---

## 3. Environment Context
- **Universal**: Affects web browsers, server API architectures, and mobile users.

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Bottleneck Inspector

**Problem:** Identify whether the performance issue is caused by **Latency** or **Bandwidth**:

1. A mobile user in a rural area takes 10 seconds to download a 50MB PDF invoice.
2. A developer in Europe queries a US database server; fetching a single user row takes `200ms`, and fetching 10 rows sequentially takes `2 seconds`.
3. A fiber-optic connection is upgraded, but ping response times to a local server remain at `12ms`.

> [!check]- Answer
> - 1. **Bandwidth** bottleneck (The hardware pipeline throughput is too slow for the large file payload).
> - 2. **Latency** bottleneck (Each lookup suffers a `200ms` round-trip. The data size is tiny, but the sequential travel time adds up).
> - 3. **Latency** limit (The local connection latency has hit its physical routing minimum).


---

### Exercise 2: Bandwidth vs Latency Analogy

**Problem:** Match term to highway analogy:
1. Latency
2. Bandwidth

**Expected output:**
> [!check]- Answer
> ```text
> 1. Speed limit of the cars (how fast one car completes the trip)
> 2. Number of lanes on the highway (how many cars can travel simultaneously)
> ```
> ```text
> 1. Latency -> Speed limit / travel time of a single payload.
> 2. Bandwidth -> Width of the highway / total capacity volume.
> ```
> - **Explanation:** Latency measures speed of delivery; bandwidth measures total volume capacity.
---

### Exercise 3: Calculating Total Sequential API Delay

**Problem:** If network latency between Client and Server is 40ms, calculate total time spent waiting on network traffic for 5 sequential synchronous HTTP calls.

**Expected output:**
> [!check]- Answer
> ```text
> 200ms (5 * 40ms RTT).
> ```
> ```text
> 200ms (5 calls * 40ms RTT per call).
> ```
> - **Explanation:** Sequential network requests sum individual latency delays.
---

## 7. Related Terms
- [Caching](../level_06/caching.md) — Storing data locally to bypass network latency entirely.
- [Pagination](../level_06/pagination.md) — Limiting API response payload sizes to reduce bandwidth usage.

---

## 8. Key Takeaways
- Latency is the travel time of a single packet round-trip (measured in RTT milliseconds).
- Bandwidth is the volume capacity of the network pipe (measured in Mbps/Gbps).
- For small API payloads, latency (distance) is the dominant performance bottleneck.
- Parallelize network requests (using `Promise.all`) to avoid sequential latency compounding.
- Reduce payload sizes (via pagination) to prevent bandwidth saturation.
