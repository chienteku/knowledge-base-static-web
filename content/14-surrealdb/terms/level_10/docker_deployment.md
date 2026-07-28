# Docker Deployment

> **Level 10 — SDKs, Deployment & Production**
> Containerizing and deploying SurrealDB instances locally or in cloud container platforms (AWS ECS, Kubernetes, Docker Swarm) using official Docker container images with persistent volume mounts.

---

## 1. Prerequisites
- [SurrealDB Server (`surreal start`)](../level_01/surreal_start.md) — Server startup flags.
- [Storage Backends (Memory, RocksDB, TiKV)](../level_01/storage_backends.md) — Storage backends.

---

## 2. Term Category
- **Deployment & Containers**

---

## 3. Environment Context
- **Container Infrastructure** (Local Docker Desktop, Docker Compose, Kubernetes, or Cloud Container services).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
To ensure local development environments match production deployment setups exactly, developers use containerization via Docker. Running SurrealDB inside Docker containers eliminates "works on my machine" issues, simplifies integration testing, and enables automated orchestration in Kubernetes or AWS ECS clusters.

The official Docker image (`surrealdb/surrealdb:latest`) packages the SurrealDB binary, storage engines, and network capabilities into a minimal, secure container image.

### (2) Reality Metaphor
Think of shipping cargo containers:
- **Bare-metal Installation**: Unpacking loose machinery parts onto a truck bed and assembling them at the delivery site.
- **Docker Container**: Sealing everything into a standardized steel ISO container. Any cargo ship, crane, or train in the world can transport and run the container instantly without needing local assembly.

### (3) Code Examples

#### Short Snippet (Docker Run)
```bash
# Run a single-node SurrealDB container with persistent RocksDB storage
docker run --name surrealdb -d \
  -p 8000:8000 \
  -v $(pwd)/surreal_data:/data \
  surrealdb/surrealdb:latest start \
  --user root --pass root surrealkv://data/database.db
```

#### Fuller Example (Docker Compose)
```yaml
# docker-compose.yml for local development
version: '3.8'

services:
  surrealdb:
    image: surrealdb/surrealdb:latest
    container_name: surrealdb_dev
    restart: always
    ports:
      - "8000:8000"
    volumes:
      - surreal_data:/var/lib/surrealdb/data
    environment:
      - SURREAL_USER=root
      - SURREAL_PASS=root
    command: >
      start
      --log trace
      --user root
      --pass root
      surrealkv://var/lib/surrealdb/data/surreal.db

volumes:
  surreal_data:
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Forgetting Volume Mounts for Persistent Storage

**The mistake:** Running `docker run surrealdb/surrealdb start surrealkv://data/db.db` without mounting a Docker volume (`-v`).

**Why it's wrong:** Without a volume mount (`-v local_dir:/container_dir`), the database files are written to the container's ephemeral layer. When the container stops or restarts, all stored database records are lost!

*Incorrect:*
```bash
# Missing volume mount! Data is lost when container restarts!
docker run -p 8000:8000 surrealdb/surrealdb:latest start --user root --pass root surrealkv://data/db.db
```

*Fix:*
```bash
# Includes volume mount (-v) to persist data on host disk
docker run -p 8000:8000 -v /my/host/data:/data surrealdb/surrealdb:latest start --user root --pass root surrealkv://data/db.db
```

---



### Mistake 2: Binding Docker Container Database to `127.0.0.1` Network Loopback

**The mistake:** Passing `--bind 127.0.0.1:8000` to `surreal start` inside Docker containers.

**Why it's wrong:** `127.0.0.1` binds exclusively to internal container loopback. External host applications cannot connect to the database. Bind to `--bind 0.0.0.0:8000`.

*Incorrect:*
```surrealql
# Docker CMD
CMD ["start", "--bind", "127.0.0.1:8000", "rocksdb://data.db"] # ❌ Unreachable from host!
```

*Fix:*
```surrealql
CMD ["start", "--bind", "0.0.0.0:8000", "rocksdb://data.db"] # Binds to all interfaces
```

### Mistake 3: Forgetting Persistent Volume Mounts in Docker Containers

**The mistake:** Running `docker run surrealdb/surrealdb:latest start rocksdb://data.db` without volume mounts.

**Why it's wrong:** Without mounting host storage volumes (`-v /host/path:/surreal-data`), all database data is lost when the Docker container stops.

*Incorrect:*
```surrealql
$ docker run surrealdb/surrealdb:latest start rocksdb://data.db # ❌ Container storage is ephemeral!
```

*Fix:*
```surrealql
$ docker run -v /var/surreal-data:/data surrealdb/surrealdb:latest start rocksdb:///data/my.db
```



### Mistake 4: Binding Docker Container Database to `127.0.0.1` Network Loopback

**The mistake:** Passing `--bind 127.0.0.1:8000` to `surreal start` inside Docker containers.

**Why it's wrong:** `127.0.0.1` binds exclusively to internal container loopback. External host applications cannot connect to the database. Bind to `--bind 0.0.0.0:8000`.

*Incorrect:*
```surrealql
# Docker CMD
CMD ["start", "--bind", "127.0.0.1:8000", "rocksdb://data.db"] # ❌ Unreachable from host!
```

*Fix:*
```surrealql
CMD ["start", "--bind", "0.0.0.0:8000", "rocksdb://data.db"] # Binds to all interfaces
```

### Mistake 5: Forgetting Persistent Volume Mounts in Docker Containers

**The mistake:** Running `docker run surrealdb/surrealdb:latest start rocksdb://data.db` without volume mounts.

**Why it's wrong:** Without mounting host storage volumes (`-v /host/path:/surreal-data`), all database data is lost when the Docker container stops.

*Incorrect:*
```surrealql
$ docker run surrealdb/surrealdb:latest start rocksdb://data.db # ❌ Container storage is ephemeral!
```

*Fix:*
```surrealql
$ docker run -v /var/surreal-data:/data surrealdb/surrealdb:latest start rocksdb:///data/my.db
```

## 6. Practice Exercises

### Exercise 1: Container Port Mapping
In the Docker flag `-p 8000:8000`, identify which number represents the host port and which represents the container port.

> [!check]- Answer
> - Docker port format: `-p <HOST_PORT>:<CONTAINER_PORT>`. Both are 8000.

---



### Exercise 2: Docker Container Run Command

**Problem:** Write `docker run` command running SurrealDB with persistent volume `-v /data:/data` on port `8000`.

**Expected output:**
> [!check]- Answer
> ```text
> docker run -p 8000:8000 -v /data:/data surrealdb/surrealdb:latest start --bind 0.0.0.0:8000 rocksdb:///data/my.db
> ```
> ```text
> docker run -p 8000:8000 -v /data:/data surrealdb/surrealdb:latest start --bind 0.0.0.0:8000 rocksdb:///data/my.db
> ```
>
> **Explanation:** `-p` forwards host ports; `-v` mounts persistent disk volumes into containers.

---

### Exercise 3: Docker Compose Configuration

**Problem:** Specify essential SurrealDB environment variables in Docker Compose (`SURREAL_USER`, `SURREAL_PASS`).

**Expected output:**
> [!check]- Answer
> ```text
> SURREAL_USER=root, SURREAL_PASS=root
> ```
> ```text
> SURREAL_USER=root, SURREAL_PASS=root
> ```
>
> **Explanation:** Container environment variables configure initial root credentials.

## 7. Related Terms
- [SurrealDB Server (`surreal start`)](../level_01/surreal_start.md) — Startup configuration flags.
- [SurrealDB Cloud](surrealdb_cloud.md) — Managed cloud alternative.
- [Storage Backends (Memory, RocksDB, TiKV)](../level_01/storage_backends.md) — Storage engine choices.

---

## 8. Key Takeaways
- Official container image: `surrealdb/surrealdb:latest`.
- Always mount host directory or volume (`-v`) for persistent database storage.
- Easily orchestrate local full-stack development setups using `docker-compose`.
