# Docker Deployment

> **Level 10 — SDKs, Deployment & Production**
> Containerizing and deploying SurrealDB instances locally or in cloud container platforms (AWS ECS, Kubernetes, Docker Swarm) using official Docker container images with persistent volume mounts.

---

## 1. Prerequisites

- [SurrealDB Server (`surreal start`)](../level_01/surreal_start.md) — Server startup flags.
- [Storage Backends (Memory, RocksDB, TiKV)](../level_01/storage_backends.md) — Storage backends.

---

## 2. Term Category


**Performance / Operations (Docker container deployment configuration)**: - **Deployment & Containers**



---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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





## 5. Practice Exercises

### Exercise 1: Single-Node Docker Container Startup

**Scenario:**
Formulate a `docker run` command to launch a single-node persistent SurrealDB database container storing data on a mounted host directory volume.

**Requirements:**
1. Bind port `8000:8000`.
2. Mount host path `/var/surreal_data` to `/mydata`.
3. Set root credentials `root` / `root`.

> [!check]- Answer
>
> #### Implementation
>
> ```bash
> docker run -d >   --name surrealdb >   -p 8000:8000 >   -v /var/surreal_data:/mydata >   surrealdb/surrealdb:latest >   start --user root --pass root file:/mydata/prod.db
> ```
>
> #### Technical Explanation
>
> 1. `-v /var/surreal_data:/mydata` mounts host storage into the container for persistent file storage.
> 2. `-p 8000:8000` maps container WebSocket/HTTP port 8000 to the host network.
> 3. `file:/mydata/prod.db` specifies local disk persistence path inside the container.
> 
---

### Exercise 2: Docker Compose Multi-Service Configuration

**Scenario:**
Write a `docker-compose.yml` file configuring a SurrealDB database container alongside a Node.js web application service.

**Requirements:**
1. Configure `surrealdb` service with environment credentials and persistent volume.
2. Configure `web` service depending on `surrealdb`.

> [!check]- Answer
>
> #### Implementation
>
> ```yaml
> version: "3.8"
> services:
>   surrealdb:
>     image: surrealdb/surrealdb:latest
>     ports:
>       - "8000:8000"
>     volumes:
>       - surreal_data:/mydata
>     command: start --user root --pass root file:/mydata/app.db
> 
> volumes:
>   surreal_data:
> ```
>
> #### Technical Explanation
>
> 1. Docker Compose orchestrates database container deployment alongside application microservices.
> 2. Named volume `surreal_data` preserves database files across container reboots.
> 3. Simplifies local development environment setup.
> 
---

### Exercise 3: Healthcheck Configuration for Container Services

**Scenario:**
Configure a Docker healthcheck for a SurrealDB container to verify HTTP `/health` availability before starting dependent services.

**Requirements:**
1. Add healthcheck testing `curl -f http://localhost:8000/health`.

> [!check]- Answer
>
> #### Implementation
>
> ```yaml
> healthcheck:
>   test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
>   interval: 10s
>   timeout: 5s
>   retries: 3
> ```
>
> #### Technical Explanation
>
> 1. SurrealDB exposes an HTTP `/health` endpoint returning `200 OK` when ready.
> 2. Docker healthchecks prevent dependent app containers from starting before the database is initialized.
> 3. Ensures smooth multi-container orchestration.
> 
---





## 6. Related Terms

- [SurrealDB Server (`surreal start`)](../level_01/surreal_start.md) — Startup configuration flags.
- [SurrealDB Cloud](surrealdb_cloud.md) — Managed cloud alternative.
- [Storage Backends (Memory, RocksDB, TiKV)](../level_01/storage_backends.md) — Storage engine choices.

---

## 7. Key Takeaways
- Official container image: `surrealdb/surrealdb:latest`.
- Always mount host directory or volume (`-v`) for persistent database storage.
- Easily orchestrate local full-stack development setups using `docker-compose`.
