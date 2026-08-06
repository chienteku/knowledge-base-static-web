# Replication Lag

> **Level 9 — Replica Sets & Sharding**
> The delay between the time a write operation is committed on the primary node and the time it is applied to a secondary node in a replica set, presenting the primary cause of stale data reads.

---

## 1. Prerequisites

- [Oplog (Operations Log)](oplog.md) — The log replicated.
- [Read Preference](../level_08/read_preference.md) — The query routing hazard.

---

## 2. Term Category

**Administration / Operations** (Secondary Sync Latency Metric): Replication Lag measures the time delay between a write operation committing on the primary node and replicating to secondary nodes.



---

## 3. Explanation

### Environment Context
- **MongoDB Core** (Monitored by database administrator alert dashboards. High replication lag risks secondary nodes falling off the Oplog history tail).

### (1) Design Motivation — "Why did we design this?"
In distributed databases, network speed and disk writes are not infinite:
-   A Primary node might receive a massive batch write of 500,000 documents.
-   A Secondary node must download the Oplog changes and apply them.
-   If the Secondary server has slower disks, high CPU load, or network latency, it cannot write the changes as fast as the primary.

This delay is **Replication Lag**. 

If replication lag rises:
-   **Stale Reads:** Queries using `readPreference: "secondary"` read old, outdated data snapshots.
-   **Rollback Risks:** If the primary crashes, any write that occurred during the lag window has not reached the secondaries. The new primary elected will rollback those un-replicated writes, losing data.

We monitor and study replication lag to size hardware (disks, CPUs) and prevent data inconsistency.

---

### (2) What Causes Replication Lag?
1.  **Disk Performance Mismatch:** If secondaries use cheaper, slower SSDs than the primary, they cannot keep up with write rates.
2.  **Single-threaded Oplog Application:** While primary writes run in parallel, older MongoDB versions applied Oplog entries sequentially on secondaries, creating bottlenecks (modern versions use parallel execution to mitigate this).
3.  **Network Bandwidth Saturation:** High latency connections between geographic zones (e.g. replicating from New York to Singapore).

---

### (3) Reality Metaphor (Dictation Latency)
Imagine a classroom lecture:
-   **Replication Lag:** The time delay between when the **Teacher (Primary)** speaks a sentence and when the **Slowest Student (Secondary)** writes it down in their notebook. 
    -   If the teacher speaks at 100 words per minute, but the student only writes at 60 words per minute: 
    -   The student falls further and further behind. 
    -   If a classmate walks in and reads the student's notebook, they get stale notes. 
    -   If the teacher suddenly leaves the room (primary crash), the student's notes are incomplete.

---

### (4) Code Examples

#### Auditing Replication Lag in mongosh
You can print the replication status of secondaries to check lag:

```javascript
rs.printSecondaryReplicationInfo();

// Output:
// source: secondary-node-01:27017
//   syncedTo: Tue Jul 21 2026 23:25:00 GMT+0800
//   0 secs (0 hrs) behind the primary  <-- Zero lag!
//
// source: secondary-node-02:27017
//   syncedTo: Tue Jul 21 2026 23:24:50 GMT+0800
//   10 secs (0 hrs) behind the primary <-- 10 Seconds of Replication Lag!
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Ignoring replication lag when using 'secondaryPreferred' read preference for user dashboard views

**The mistake:** Routing user profile homepage loads to secondaries using `secondaryPreferred` on a cluster with a persistent 5-second replication lag, resulting in users complaining that their profile updates are not saving.

**Why it's wrong:** The application reads from the secondary. 

Because of the 5-second lag, the dashboard shows old profile details, confusing users.

**Fix: Do not route read-after-write user flows to secondaries if replication lag is volatile. Use Causal Consistency (sessions) to force secondaries to block until the lag clears, or read directly from the `primary`.**

---



### Mistake 2: Ignoring Replication Lag When Using `readPreference: 'secondary'`

**The mistake:** Directing read traffic to secondaries experiencing 60 seconds of replication lag.

**Why it's wrong:** High replication lag causes secondary queries to return stale data. Monitor replication lag and route queries back to primary if lag exceeds thresholds.

*Incorrect:*
```javascript
// Directing reads to lagging secondary without checking lag status
```

*Fix:*
```javascript
Use maxStalenessSeconds in ReadPreference to prevent reading from lagging secondaries
```

### Mistake 3: Under-Provisioning Disk IOPS on Secondary Nodes

**The mistake:** Provisioning high-spec IOPS on Primary while using low-spec cheap storage on Secondaries.

**Why it's wrong:** Secondaries apply Oplog writes serially/in batches. Low IOPS on secondaries prevents them from keeping pace with primary writes, creating growing replication lag.

*Incorrect:*
```javascript
// Primary: 10,000 IOPS; Secondary: 500 IOPS
```

*Fix:*
```javascript
Provision identical hardware and storage IOPS across all primary and secondary nodes
```

## 5. Practice Exercises

### Exercise 1: Monitoring Secondary Replication Lag in Seconds

**Scenario:**
Query `rs.status()` to calculate the exact replication lag in seconds for secondary node `node2`.

**Requirements:**
1. Subtract `node2.optimeDate` from `primary.optimeDate`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> const status = rs.status();
> const primary = status.members.find(m => m.state === 1);
> const secondary = status.members.find(m => m.name.includes("node2"));
> 
> const lagSeconds = (primary.optimeDate - secondary.optimeDate) / 1000;
> console.log(`Secondary Node2 Replication Lag: ${lagSeconds} seconds`);
> ```
>
> #### Technical Explanation
>
> 1. Replication lag measures the time difference between primary oplog write timestamps and secondary applied oplog timestamps.
> 2. Lag > 0 indicates secondary is falling behind primary write throughput.
> 3. High lag risks stale reads when using `readPreference: "secondary"`.

---

### Exercise 2: Mitigating Replication Lag with Flow Control

**Scenario:**
Enable Flow Control (`flowControlTargetLagSeconds`) to prevent primary write bursts from overwhelming secondary replication speed.

**Requirements:**
1. Configure `flowControlTargetLagSeconds: 10`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.adminCommand({
>   setParameter: 1,
>   flowControlTargetLagSeconds: 10
> });
> ```
>
> #### Technical Explanation
>
> 1. Flow Control dynamically throttles primary write rate if secondary replication lag exceeds the target threshold (e.g. 10s).
> 2. Prevents secondary nodes from falling out of the oplog window during heavy write spikes.
> 3. Maintains stable cluster replication bounds.

---

### Exercise 3: Preventing Stale Reads from Lagging Secondaries

**Scenario:**
Configure maximum acceptable replication lag (`maxStalenessSeconds`) on client driver read preferences.

**Requirements:**
1. Pass `maxStalenessSeconds: 90` in ReadPreference settings.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> const client = new MongoClient(uri, {
>   readPreference: ReadPreference.SECONDARY_PREFERRED,
>   maxStalenessSeconds: 90
> });
> ```
>
> #### Technical Explanation
>
> 1. `maxStalenessSeconds` stops the driver from routing reads to secondaries whose replication lag exceeds 90 seconds.
> 2. Prevents application users from viewing severely outdated data.
> 3. Hardens distributed read query accuracy.

---



## 6. Related Terms

- [Oplog (Operations Log)](oplog.md) — The log replicated.
- [Read Preference](../level_08/read_preference.md) — The query routing hazard.

---

## 7. Key Takeaways
- Replication Lag is the delay in applying write logs from primary to secondaries.
- Caused by disk bottlenecks, network latency, or high write loads.
- Creates stale data reads when queries are routed to secondaries.
- High lag increases the risk of write rollbacks during primary crashes.
- Monitor lag using the shell command `rs.printSecondaryReplicationInfo()`.
- Use Causal Consistency (sessions) to prevent stale reads during lag spikes.
- Ensure secondaries match primary hardware specs to minimize write lag.
