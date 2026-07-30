# `axum` / `actix-web`

> **Level 16 — Ecosystem & Tooling**
> The premier asynchronous HTTP web frameworks in Rust — `axum` (built on Tokio, Hyper, and Tower) and `actix-web` (built on Actix actor runtime) — for building high-throughput, type-safe REST APIs and microservices.

---

## 1. Prerequisites

- [`tokio`](../level_16/tokio.md) — The underlying asynchronous runtime.
- [`serde`](../level_16/serde.md) — Handles JSON request body deserialization and response serialization.
- [Async / Await](../level_09/async_await.md) — Asynchronous handler functions.

---

## 2. Term Category

**Ecosystem / Web Framework / HTTP**: `axum` and `actix-web` are the two dominant web microservice frameworks in the Rust ecosystem. Both leverage Rust's strong type system and `async/await` syntax to map HTTP routes to strongly-typed async handler functions with zero runtime reflection overhead.

---

## 3. Environment Context

**Universal Backend Ecosystem**: Powering production REST APIs, gRPC web endpoints, WebSocket streams, and backend microservices.

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"

In dynamically typed languages (like Node.js Express or Python Flask):
- Route parameters, query strings, and JSON body payloads are parsed dynamically at runtime.
- Missing a JSON field causes runtime `TypeError` crashes in production.
- Middleware chaining can alter request context unexpectedly.

Rust web frameworks (`axum` and `actix-web`) use **Declarative Type-Safe Extractors**:
1. **Compile-Time Type Safety**: Route handlers declare parameters using extractors (e.g. `Path(id): Path<u64>`, `Json(payload): Json<CreateUser>`). If a client sends invalid JSON, the framework rejects the request with HTTP 400 *before* your handler code ever runs!
2. **Zero-Reflection Parsing**: Serde deserializes HTTP bodies directly into typed Rust structs at native hardware speeds.
3. **Composable Middleware**: Built on standard `tower` middleware layers (`axum`) or Actix services (`actix-web`).

### (2) Code Examples

#### 1. REST API Server with `axum`

```rust
use axum::{
    routing::{get, post},
    extract::{Path, Json},
    Router,
};
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
struct CreateUser {
    username: String,
    email: String,
}

#[derive(Serialize)]
struct User {
    id: u64,
    username: String,
    email: String,
}

async fn get_user(Path(id): Path<u64>) -> Json<User> {
    Json(User {
        id,
        username: String::from("ferris"),
        email: String::from("ferris@rust-lang.org"),
    })
}

async fn create_user(Json(payload): Json<CreateUser>) -> (axum::http::StatusCode, Json<User>) {
    let user = User {
        id: 42,
        username: payload.username,
        email: payload.email,
    };
    (axum::http::StatusCode::CREATED, Json(user))
}

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/users/:id", get(get_user))
        .route("/users", post(create_user));

    let listener = tokio::net::TcpListener::bind("127.0.0.1:3000").await.unwrap();
    println!("Axum web server running on http://127.0.0.1:3000");
    axum::serve(listener, app).await.unwrap();
}
```

#### 2. REST API Server with `actix-web`

```rust
use actix_web::{get, post, web, App, HttpServer, Responder, HttpResponse};
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
struct CreateUser {
    username: String,
}

#[derive(Serialize)]
struct User {
    id: u64,
    username: String,
}

#[get("/users/{id}")]
async fn get_user(path: web::Path<u64>) -> impl Responder {
    let user_id = path.into_inner();
    HttpResponse::Ok().json(User { id: user_id, username: "ferris".into() })
}

#[post("/users")]
async fn create_user(payload: web::Json<CreateUser>) -> impl Responder {
    HttpResponse::Created().json(User { id: 101, username: payload.username.clone() })
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| {
        App::new()
            .service(get_user)
            .service(create_user)
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Placing Axum State Extractors Out of Order

**The mistake:** Placing `axum::extract::State` after `Json` or `String` body extractors in handler parameter lists.

**Why it's wrong:** In `axum`, body extractors consume the HTTP request payload stream. Extractors that consume the request body must always come **last** in the parameter list.

---

## 6. Practice Exercises

### Exercise 1: Shared Application State & REST Endpoints in `axum`

**Problem:** Build an in-memory user registry service using `axum`.
1. Define an `AppState` struct holding thread-safe shared state: `users: Arc<RwLock<HashMap<u64, User>>>`.
2. Implement route handlers:
   - `POST /users`: Accepts `Json<CreateUserPayload>`, generates an incremental ID, inserts the user into state, and returns `(StatusCode::CREATED, Json<User>)`.
   - `GET /users/:id`: Extracts `Path(id)`. If found, returns `Ok(Json<User>)`; if not found, returns `Err(StatusCode::NOT_FOUND)`.
3. Write socket-less integration unit tests using `tower::ServiceExt::oneshot` to execute requests against `app` and verify response status codes and body contents using `assert_eq!`.

> [!check]- Answer
> ```rust
> use axum::{
>     extract::{Path, State},
>     http::{Request, StatusCode},
>     routing::{get, post},
>     Json, Router,
> };
> use serde::{Deserialize, Serialize};
> use std::collections::HashMap;
> use std::sync::{Arc, RwLock};
> use tower::ServiceExt; // for oneshot
> 
> #[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
> pub struct User {
>     pub id: u64,
>     pub username: String,
>     pub email: String,
> }
> 
> #[derive(Debug, Deserialize)]
> pub struct CreateUserPayload {
>     pub username: String,
>     pub email: String,
> }
> 
> #[derive(Clone)]
> pub struct AppState {
>     pub users: Arc<RwLock<HashMap<u64, User>>>,
>     pub next_id: Arc<RwLock<u64>>,
> }
> 
> impl AppState {
>     pub fn new() -> Self {
>         Self {
>             users: Arc::new(RwLock::new(HashMap::new())),
>             next_id: Arc::new(RwLock::new(1)),
>         }
>     }
> }
> 
> pub async fn create_user(
>     State(state): State<AppState>,
>     Json(payload): Json<CreateUserPayload>,
> ) -> (StatusCode, Json<User>) {
>     let mut next_id_guard = state.next_id.write().unwrap();
>     let user_id = *next_id_guard;
>     *next_id_guard += 1;
> 
>     let user = User {
>         id: user_id,
>         username: payload.username,
>         email: payload.email,
>     };
> 
>     let mut users_guard = state.users.write().unwrap();
>     users_guard.insert(user_id, user.clone());
> 
>     (StatusCode::CREATED, Json(user))
> }
> 
> pub async fn get_user(
>     State(state): State<AppState>,
>     Path(id): Path<u64>,
> ) -> Result<Json<User>, StatusCode> {
>     let users_guard = state.users.read().unwrap();
>     match users_guard.get(&id) {
>         Some(user) => Ok(Json(user.clone())),
>         None => Err(StatusCode::NOT_FOUND),
>     }
> }
> 
> pub fn create_router(state: AppState) -> Router {
>     Router::new()
>         .route("/users", post(create_user))
>         .route("/users/:id", get(get_user))
>         .with_state(state)
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
>     use axum::body::Body;
>     use http_body_util::BodyExt; // for collect()
> 
>     #[tokio::test]
>     async fn test_create_and_get_user() {
>         let state = AppState::new();
>         let app = create_router(state);
> 
>         // 1. Test POST /users
>         let create_payload = r#"{"username":"ferris","email":"ferris@rust-lang.org"}"#;
>         let request = Request::builder()
>             .method("POST")
>             .uri("/users")
>             .header("content-type", "application/json")
>             .body(Body::from(create_payload))
>             .unwrap();
> 
>         let response = app.clone().oneshot(request).await.unwrap();
>         assert_eq!(response.status(), StatusCode::CREATED);
> 
>         let body_bytes = response.into_body().collect().await.unwrap().to_bytes();
>         let created_user: User = serde_json::from_slice(&body_bytes).unwrap();
>         assert_eq!(created_user.id, 1);
>         assert_eq!(created_user.username, "ferris");
> 
> 
>         // 2. Test GET /users/1
>         let get_request = Request::builder()
>             .method("GET")
>             .uri("/users/1")
>             .body(Body::empty())
>             .unwrap();
> 
> 
>         let get_response = app.clone().oneshot(get_request).await.unwrap();
>         assert_eq!(get_response.status(), StatusCode::OK);
> 
>         let get_bytes = get_response.into_body().collect().await.unwrap().to_bytes();
>         let fetched_user: User = serde_json::from_slice(&get_bytes).unwrap();
>         assert_eq!(fetched_user, created_user);
> 
>         // 3. Test GET /users/999 (Not Found)
>         let missing_request = Request::builder()
>             .method("GET")
>             .uri("/users/999")
>             .body(Body::empty())
>             .unwrap();
> 
> 
>         let missing_response = app.oneshot(missing_request).await.unwrap();
>         assert_eq!(missing_response.status(), StatusCode::NOT_FOUND);
>     }
> }
> ```
>
> **Explanation:**
> 1. **Thread-Safe State (`Arc<RwLock<...>>`)**: Wraps application state so it can be safely shared across Tokio threads handling concurrent HTTP requests.
> 2. **State Extractor Order**: The `State(state)` extractor is listed before `Json(payload)` because `Json` consumes the HTTP request body stream.
> 3. **Socket-less Testing**: `app.oneshot(request)` tests web services directly in memory without binding to actual network sockets or ports.

---

### Exercise 2: `actix-web` Query Parameters, App State, and Integration Testing

**Problem:** Build a product search endpoint using `actix-web`.
1. Define a `CatalogState` struct holding a static list of `Product` items (`id: u64`, `name: String`, `price_cents: u64`).
2. Define a `SearchQuery` struct for query string parameters: `max_price: Option<u64>`.
3. Implement a handler `search_products(data: web::Data<CatalogState>, query: web::Query<SearchQuery>) -> impl Responder`. If `max_price` is provided, filter products whose price is `<= max_price`.
4. Write integration unit tests using `actix_web::test` (`init_service`, `TestRequest`, `call_service`, `read_body_json`) verifying query string parsing and filtering logic.

> [!check]- Answer
> ```rust
> use actix_web::{get, web, App, HttpResponse, Responder};
> use serde::{Deserialize, Serialize};
> 
> 
> #[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
> pub struct Product {
>     pub id: u64,
>     pub name: String,
>     pub price_cents: u64,
> }
> 
> pub struct CatalogState {
>     pub products: Vec<Product>,
> }
> 
> #[derive(Debug, Deserialize)]
> pub struct SearchQuery {
>     pub max_price: Option<u64>,
> }
> 
> #[get("/products")]
> pub async fn search_products(
>     data: web::Data<CatalogState>,
>     query: web::Query<SearchQuery>,
> ) -> impl Responder {
>     let filtered: Vec<Product> = data
>         .products
>         .iter()
>         .filter(|p| match query.max_price {
>             Some(max) => p.price_cents <= max,
>             None => true,
>         })
>         .cloned()
>         .collect();
> 
>     HttpResponse::Ok().json(filtered)
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
>     use actix_web::test;
> 
>     #[actix_web::test]
>     async fn test_product_search_with_query_params() {
>         let state = web::Data::new(CatalogState {
>             products: vec![
>                 Product { id: 1, name: "Keyboard".into(), price_cents: 5000 },
>                 Product { id: 2, name: "Mouse".into(), price_cents: 2500 },
>                 Product { id: 3, name: "Monitor".into(), price_cents: 20000 },
>             ],
>         });
> 
>         let app = test::init_service(
>             App::new()
>                 .app_data(state.clone())
>                 .service(search_products),
>         )
>         .await;
> 
>         // 1. Test search with max_price query filter
>         let req = test::TestRequest::get()
>             .uri("/products?max_price=3000")
>             .to_request();
> 
>         let resp = test::call_service(&app, req).await;
>         assert!(resp.status().is_success());
> 
>         let products: Vec<Product> = test::read_body_json(resp).await;
>         assert_eq!(products.len(), 1);
>         assert_eq!(products[0].name, "Mouse");
> 
>         // 2. Test search without query parameters (returns all)
>         let req_all = test::TestRequest::get().uri("/products").to_request();
>         let resp_all = test::call_service(&app, req_all).await;
>         let all_products: Vec<Product> = test::read_body_json(resp_all).await;
>         assert_eq!(all_products.len(), 3);
>     }
> }
> ```
>
> **Explanation:**
> 1. **`web::Query<T>` Extractor**: Automatically parses URL query parameters (`?max_price=3000`) into typed Rust structs via Serde.
> 2. **`web::Data<T>` State Injection**: Actix-web manages shared thread state using `web::Data` wrappers around application data structures.
> 3. **Actix Test Suite**: `actix_web::test::init_service` constructs a test instance of the application pipeline for in-memory integration testing.

---

### Exercise 3: Custom Header Extractor and Custom Response Error Mapping in `axum`

**Problem:** Implement a custom header extractor for Bearer token authentication in `axum`.
1. Define an `AuthClaims` struct: `pub user_id: u64`.
2. Implement `axum::extract::FromRequestParts<S>` for `AuthClaims`. Look up the `"Authorization"` header. If missing or invalid format (e.g. not starting with `"Bearer secret-token-"`), return an error tuple `(StatusCode::UNAUTHORIZED, "Invalid Auth Header")`.
3. Create a protected route handler `dashboard(claims: AuthClaims) -> String` that returns `"Welcome user <user_id>"`.
4. Write unit tests with `tower::ServiceExt::oneshot` verifying both authorized (200 OK) and unauthorized (401 Unauthorized) requests using `assert_eq!`.

> [!check]- Answer
> ```rust
> use axum::{
>     async_trait,
>     extract::FromRequestParts,
>     http::{request::Parts, Request, StatusCode},
>     routing::get,
>     Router,
> };
> use tower::ServiceExt;
> 
> #[derive(Debug, PartialEq, Eq)]
> pub struct AuthClaims {
>     pub user_id: u64,
> }
> 
> #[async_trait]
> impl<S> FromRequestParts<S> for AuthClaims
> where
>     S: Send + Sync,
> {
>     type Rejection = (StatusCode, &'static str);
> 
>     async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
>         let auth_header = parts
>             .headers
>             .get("authorization")
>             .and_then(|value| value.to_str().ok())
>             .ok_or((StatusCode::UNAUTHORIZED, "Missing Authorization Header"))?;
> 
>         if let Some(token) = auth_header.strip_prefix("Bearer secret-token-") {
>             if let Ok(user_id) = token.parse::<u64>() {
>                 return Ok(AuthClaims { user_id });
>             }
>         }
> 
>         Err((StatusCode::UNAUTHORIZED, "Invalid Auth Token Format"))
>     }
> }
> 
> pub async fn dashboard(claims: AuthClaims) -> String {
>     format!("Welcome user {}", claims.user_id)
> }
> 
> pub fn create_auth_router() -> Router {
>     Router::new().route("/dashboard", get(dashboard))
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
>     use axum::body::Body;
>     use http_body_util::BodyExt;
> 
>     #[tokio::test]
>     async fn test_auth_extractor() {
>         let app = create_auth_router();
> 
>         // 1. Authorized request with valid Bearer token
>         let valid_req = Request::builder()
>             .method("GET")
>             .uri("/dashboard")
>             .header("authorization", "Bearer secret-token-42")
>             .body(Body::empty())
>             .unwrap();
> 
>         let resp = app.clone().oneshot(valid_req).await.unwrap();
>         assert_eq!(resp.status(), StatusCode::OK);
> 
>         let body = resp.into_body().collect().await.unwrap().to_bytes();
>         assert_eq!(&body[..], b"Welcome user 42");
> 
>         // 2. Unauthorized request without header
>         let missing_req = Request::builder()
>             .method("GET")
>             .uri("/dashboard")
>             .body(Body::empty())
>             .unwrap();
> 
>         let resp_missing = app.oneshot(missing_req).await.unwrap();
>         assert_eq!(resp_missing.status(), StatusCode::UNAUTHORIZED);
>     }
> }
> ```
>
> **Explanation:**
> 1. **`FromRequestParts` Trait**: Allows implementing custom header/metadata extractors without consuming the request body stream.
> 2. **Declarative Route Security**: Simply adding `claims: AuthClaims` to a route handler's parameters enforces authentication automatically. If validation fails, `axum` returns the rejection response before executing the handler.
> 3. **Error Mapping**: Standard HTTP status code tuples `(StatusCode, &'static str)` implement `IntoResponse`, converting extractor failures cleanly into HTTP responses.

---

## 7. Key Takeaways

- `axum` and `actix-web` are the leading web microservice frameworks in Rust.
- They use compile-time type-safe extractors to validate HTTP parameters, headers, and JSON bodies.
- `axum` integrates natively with `tokio`, `hyper`, and `tower`.
- Place `State` and `Path` extractors before body extractors (`Json`, `String`) in `axum` handler parameters.
