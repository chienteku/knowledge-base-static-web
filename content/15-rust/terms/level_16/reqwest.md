# `reqwest`

> **Level 16 — Ecosystem & Tooling**
> The standard, high-level asynchronous HTTP client library in Rust — built on `tokio` and `hyper`, supporting JSON serialization/deserialization via `serde`, connection pooling, TLS encryption, cookies, proxies, and streaming responses.

---

## 1. Prerequisites

- [`tokio`](../level_16/tokio.md) — Asynchronous runtime underlying `reqwest`.
- [`serde`](../level_16/serde.md) — Used by `reqwest` for JSON response parsing (`.json::<T>()`).
- [Async / Await](../level_09/async_await.md) — Asynchronous network request handling.

---

## 2. Term Category

**Ecosystem / Library / Networking**: `reqwest` is the de facto standard HTTP client for Rust. Similar to `axios` or `fetch` in JavaScript, `reqwest` provides an ergonomic, feature-complete HTTP client interface for sending GET, POST, PUT, DELETE requests asynchronously.

---

## 3. Environment Context

**Universal Client Ecosystem**: Used across CLI tools, backend microservices, web scrapers, and API integrations. (Also supports blocking mode via `reqwest::blocking`).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"

Low-level HTTP libraries (like `hyper`) require manually managing HTTP state machines, header buffers, TLS sockets, and chunked transfer decoding.

`reqwest` provides a clean, high-level client abstraction:
- **Connection Pooling**: Reuses TCP connections automatically via `reqwest::Client`.
- **Automatic JSON Parsing**: Integrates with `serde` so `.json::<MyStruct>().await` deserializes HTTP response bodies directly into Rust types.
- **TLS out-of-the-box**: Supports `native-tls` or `rustls` (pure Rust TLS).

### (2) Code Examples

#### Asynchronous HTTP GET Request & Serde JSON Parsing

```rust
use reqwest;
use serde::Deserialize;

#[derive(Deserialize, Debug)]
struct GitHubUser {
    login: String,
    public_repos: u32,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Instantiate reusable client (enables HTTP connection pooling)
    let client = reqwest::Client::new();

    // Send asynchronous GET request with custom User-Agent header
    let response: GitHubUser = client
        .get("https://api.github.com/users/octocat")
        .header("User-Agent", "Rust-Reqwest-Client")
        .send()
        .await?
        .json::<GitHubUser>()
        .await?;

    println!("GitHub User: {}, Repos: {}", response.login, response.public_repos);
    Ok(())
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Re-instantiating `reqwest::Client::new()` on Every Request

**The mistake:** Calling `reqwest::Client::new()` inside a loop for every HTTP request.

**Why it's wrong:** `reqwest::Client` holds a connection pool. Creating a new client instance every time drops the connection pool, forcing a full TCP handshake and TLS negotiation on every request.

*Fix:*
```rust
// Create one `Client` instance and reuse it across requests:
let client = reqwest::Client::new();
```

---

## 6. Practice Exercises

### Exercise 1: Asynchronous HTTP GET Request with Query Parameters and Headers

**Problem:** Construct an asynchronous function `fetch_weather_report` that uses `reqwest::Client` to send an HTTP `GET` request to a weather service API (`"{base_url}/weather"`). The function must attach query parameters (`q` for city, `appid` for API key, and `units` set to `"metric"`), configure standard HTTP headers (`User-Agent` and `Accept`), handle HTTP error status codes, and deserialize the JSON response into a strongly-typed `WeatherResponse` struct. Write unit tests with assertions (`assert_eq!`, `assert!`) verifying the JSON deserialization logic.

> [!check]- Answer
> ```rust
> use reqwest::header::{ACCEPT, USER_AGENT};
> use serde::{Deserialize, Serialize};
> 
> #[derive(Debug, Serialize, Deserialize, PartialEq)]
> pub struct MainData {
>     pub temp: f64,
>     pub humidity: u32,
> }
> 
> #[derive(Debug, Serialize, Deserialize, PartialEq)]
> pub struct WeatherCondition {
>     pub description: String,
> }
> 
> #[derive(Debug, Serialize, Deserialize, PartialEq)]
> pub struct WeatherResponse {
>     pub name: String,
>     pub main: MainData,
>     pub weather: Vec<WeatherCondition>,
> }
> 
> pub async fn fetch_weather_report(
>     client: &reqwest::Client,
>     base_url: &str,
>     city: &str,
>     api_key: &str,
> ) -> Result<WeatherResponse, reqwest::Error> {
>     let url = format!("{}/weather", base_url);
> 
>     let response = client
>         .get(&url)
>         .query(&[("q", city), ("appid", api_key), ("units", "metric")])
>         .header(USER_AGENT, "Rust-Weather-App/1.0")
>         .header(ACCEPT, "application/json")
>         .send()
>         .await?
>         .error_for_status()?
>         .json::<WeatherResponse>()
>         .await?;
> 
>     Ok(response)
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_weather_deserialization() {
>         let raw_json = r#"{
>             "name": "Tokyo",
>             "main": {
>                 "temp": 24.5,
>                 "humidity": 65
>             },
>             "weather": [
>                 { "description": "clear sky" }
>             ]
>         }"#;
> 
>         let parsed: WeatherResponse =
>             serde_json::from_str(raw_json).expect("Failed to deserialize JSON payload");
> 
>         assert_eq!(parsed.name, "Tokyo");
>         assert_eq!(parsed.main.temp, 24.5);
>         assert_eq!(parsed.main.humidity, 65);
>         assert_eq!(parsed.weather.len(), 1);
>         assert_eq!(parsed.weather[0].description, "clear sky");
>         assert!(parsed.main.temp > 0.0);
>     }
> }
> ```
>
> **Explanation:**
> 1. **Query String Serialization**: `.query(&[("q", city), ...])` converts key-value slices into URL-encoded query strings automatically.
> 2. **Header Injection**: Custom headers are set using standard `reqwest::header` constants (`USER_AGENT`, `ACCEPT`), guaranteeing valid HTTP header naming.
> 3. **Status Check via `.error_for_status()?`**: Converts non-2xx HTTP response codes (e.g. 404 Not Found, 500 Server Error) directly into a `reqwest::Error` Result variant before attempting deserialization.
> 4. **Asynchronous JSON Parsing**: `.json::<T>().await` streams the response body asynchronously into memory and deserializes it via `serde_json`.

---

### Exercise 2: Authenticated JSON POST Request with Custom Client Builder & Timeout

**Problem:** Build an API client module for user registration. Create a function `create_configured_client` that builds a `reqwest::Client` configured with custom request timeouts and TCP keep-alive settings. Then implement an asynchronous `register_user` function that sends an HTTP `POST` request containing a JSON body (`CreateUserPayload`) and a `Bearer` token Authorization header, returning a parsed `UserCreatedResponse`. Write unit tests with `assert_eq!` and `assert!` to test client setup, payload serialization, and response parsing.

> [!check]- Answer
> ```rust
> use std::time::Duration;
> use reqwest::header::{AUTHORIZATION, USER_AGENT};
> use serde::{Deserialize, Serialize};
> 
> #[derive(Debug, Serialize, Deserialize, PartialEq)]
> pub struct CreateUserPayload {
>     pub username: String,
>     pub email: String,
>     pub role: String,
> }
> 
> #[derive(Debug, Serialize, Deserialize, PartialEq)]
> pub struct UserCreatedResponse {
>     pub id: u64,
>     pub username: String,
>     pub status: String,
>     pub created_at: String,
> }
> 
> pub fn create_configured_client(timeout_secs: u64) -> Result<reqwest::Client, reqwest::Error> {
>     reqwest::Client::builder()
>         .timeout(Duration::from_secs(timeout_secs))
>         .tcp_keepalive(Duration::from_secs(60))
>         .user_agent("UserService/2.0")
>         .build()
> }
> 
> pub async fn register_user(
>     client: &reqwest::Client,
>     endpoint: &str,
>     bearer_token: &str,
>     payload: &CreateUserPayload,
> ) -> Result<UserCreatedResponse, reqwest::Error> {
>     let response = client
>         .post(endpoint)
>         .header(AUTHORIZATION, format!("Bearer {}", bearer_token))
>         .json(payload)
>         .send()
>         .await?
>         .error_for_status()?
>         .json::<UserCreatedResponse>()
>         .await?;
> 
>     Ok(response)
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_client_builder_configuration() {
>         let client_res = create_configured_client(5);
>         assert!(client_res.is_ok());
>     }
> 
>     #[test]
>     fn test_payload_serialization_and_deserialization() {
>         let payload = CreateUserPayload {
>             username: String::from("alice_dev"),
>             email: String::from("alice@example.com"),
>             role: String::from("admin"),
>         };
> 
>         let serialized = serde_json::to_string(&payload).expect("Serialization failed");
>         assert!(serialized.contains("alice_dev"));
>         assert!(serialized.contains("alice@example.com"));
> 
>         let mock_response_json = r#"{
>             "id": 1042,
>             "username": "alice_dev",
>             "status": "created",
>             "created_at": "2026-07-30T10:00:00Z"
>         }"#;
> 
>         let response: UserCreatedResponse =
>             serde_json::from_str(mock_response_json).expect("Deserialization failed");
> 
>         assert_eq!(response.id, 1042);
>         assert_eq!(response.username, "alice_dev");
>         assert_eq!(response.status, "created");
>         assert_eq!(response.created_at, "2026-07-30T10:00:00Z");
>         assert!(response.id > 0);
>     }
> }
> ```
>
> **Explanation:**
> 1. **Client Customization**: `reqwest::Client::builder()` configures connection-level parameters (e.g. timeouts, TLS, connection pools) once per application lifetime.
> 2. **JSON Request Body**: Calling `.json(&payload)` on a `RequestBuilder` serializes the Rust value using `serde_json` and automatically sets the `Content-Type: application/json` HTTP header.
> 3. **Authorization Header**: Formats HTTP standard `Authorization: Bearer <token>` for OAuth2/JWT secured endpoints.
> 4. **Unit Verification**: Tests verify request body serialization and mock response deserialization with field assertions.

---

### Exercise 3: Concurrent Batch HTTP Requests with Connection Pool Reuse

**Problem:** When retrieving data from multiple endpoints, sequential HTTP requests introduce cumulative network latency. Implement an asynchronous function `fetch_posts_batch` that receives a shared `&reqwest::Client`, a base URL, and a slice of post IDs (`&[u32]`). Spawn concurrent tasks using `tokio::spawn` to fetch posts in parallel while reusing the client's internal connection pool, returning `Result<Vec<Post>, String>`. Write unit tests with assertions (`assert_eq!`, `assert!`) validating batch response parsing and struct field values.

> [!check]- Answer
> ```rust
> use serde::{Deserialize, Serialize};
> 
> #[derive(Debug, Serialize, Deserialize, PartialEq, Clone)]
> pub struct Post {
>     pub id: u32,
>     pub user_id: u32,
>     pub title: String,
>     pub body: String,
> }
> 
> pub async fn fetch_posts_batch(
>     client: &reqwest::Client,
>     base_url: &str,
>     post_ids: &[u32],
> ) -> Result<Vec<Post>, String> {
>     let mut handles = Vec::new();
> 
>     for &id in post_ids {
>         // reqwest::Client uses an internal Arc, so clone is very cheap
>         let client_clone = client.clone();
>         let url = format!("{}/posts/{}", base_url, id);
> 
>         let handle = tokio::spawn(async move {
>             let res = client_clone
>                 .get(&url)
>                 .send()
>                 .await
>                 .map_err(|e| e.to_string())?
>                 .error_for_status()
>                 .map_err(|e| e.to_string())?
>                 .json::<Post>()
>                 .await
>                 .map_err(|e| e.to_string())?;
> 
>             Ok::<Post, String>(res)
>         });
> 
>         handles.push(handle);
>     }
> 
>     let mut posts = Vec::new();
>     for handle in handles {
>         match handle.await {
>             Ok(Ok(post)) => posts.push(post),
>             Ok(Err(err_msg)) => return Err(format!("HTTP Request failed: {}", err_msg)),
>             Err(join_err) => return Err(format!("Task panicked: {}", join_err)),
>         }
>     }
> 
>     Ok(posts)
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_post_batch_deserialization() {
>         let raw_json_1 = r#"{
>             "id": 1,
>             "user_id": 10,
>             "title": "Async Rust in Practice",
>             "body": "Reqwest enables high-performance concurrent networking."
>         }"#;
> 
>         let raw_json_2 = r#"{
>             "id": 2,
>             "user_id": 10,
>             "title": "Serde JSON Integration",
>             "body": "Deserialization is zero-cost and type-safe."
>         }"#;
> 
>         let post1: Post = serde_json::from_str(raw_json_1).expect("Failed post 1 parsing");
>         let post2: Post = serde_json::from_str(raw_json_2).expect("Failed post 2 parsing");
> 
>         let batch = vec![post1, post2];
> 
>         assert_eq!(batch.len(), 2);
>         assert_eq!(batch[0].id, 1);
>         assert_eq!(batch[0].user_id, 10);
>         assert_eq!(batch[0].title, "Async Rust in Practice");
> 
>         assert_eq!(batch[1].id, 2);
>         assert_eq!(batch[1].user_id, 10);
>         assert_eq!(batch[1].title, "Serde JSON Integration");
> 
>         assert!(batch.iter().all(|p| p.user_id == 10));
>     }
> }
> ```
>
> **Explanation:**
> 1. **Cheap `Client` Cloning (`Arc` Abstraction)**: `reqwest::Client` wraps an internal reference-counted handle (`Arc`). Cloning a client instance is an $O(1)$ operation that increments the reference counter without reallocating connection pools or socket state.
> 2. **Concurrency with `tokio::spawn`**: Spawning tasks allows network requests to run concurrently across available Tokio worker threads, significantly reducing round-trip latency for batch operations.
> 3. **Error Handling & Task Joining**: The outer loop waits on task `JoinHandle` instances, separating async task runtime panics from domain-specific HTTP/serialization errors.

---

## 7. Key Takeaways

- `reqwest` is the standard async HTTP client for Rust.
- Built on `tokio` and `hyper`, supporting connection pooling, TLS, and automatic `serde` JSON integration.
- Reuse a single `reqwest::Client` instance across requests to maintain connection pools.
