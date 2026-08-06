# gRPC (Remote Procedure Call)

> **Level 10 — Designing & Tooling**
> An ultra-fast, highly compressed API framework built by Google. Instead of sending JSON text over HTTP, it sends microscopic binary data, making it the absolute gold standard for Microservices talking to each other.

---

## 1. Prerequisites
- [REST (Representational State Transfer)](../level_03/rest.md) — gRPC completely abandons the REST philosophy.
- [JSON (JavaScript Object Notation)](../level_01/json.md) — gRPC famously hates JSON and replaces it with Protocol Buffers.

---

## 2. Term Category
- **API Architecture / Networking Protocol**

---

## 3. Environment Context
- **Server-to-Server (Microservices)** (Rarely used in the browser).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
[REST](../level_03/rest.md) and [JSON](../level_01/json.md) are great because they are human-readable text. But computers don't need human-readable text! 
If Google has 10,000 internal servers (Microservices) talking to each other millions of times a second, converting data into JSON text, sending the text, and parsing the text on the other side wastes massive amounts of CPU power and network bandwidth. 
Google invented **gRPC** (gRPC Remote Procedure Calls) to fix this. It completely abandons JSON. Instead, it uses **Protocol Buffers (Protobufs)**.

### (2) What is a Protobuf?
Instead of sending a JSON string like `{"id": 5, "name": "Bob"}`, you write a strict blueprint file (`.proto`). 
The gRPC system uses this blueprint to crush the data down into a microscopic, unreadable stream of binary 1s and 0s. The receiving server uses the exact same blueprint to instantly decode the binary back into an object.
Because there are no curly braces, quotes, or keys taking up space, the payload size is vastly smaller and parsable almost instantly.

### (3) Remote Procedure Call (RPC)
REST forces you to think about "Nouns" (e.g., `POST /users`). 
RPC allows you to think about "Verbs". It feels like you are simply calling a normal JavaScript function that happens to run on another computer:
```javascript
// REST
fetch('/api/users/5/ban', { method: 'POST' });

// gRPC (RPC style)
client.BanUser({ id: 5 });
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Trying to use gRPC in the Browser

**The mistake:** A developer hears that gRPC is 10x faster than REST. They decide to rewrite their React frontend to fetch data using gRPC instead of standard HTTP/JSON.

**Why it's wrong:** Standard web browsers do not fully support the complex HTTP/2 binary framing that gRPC requires. While there are bridge tools (like gRPC-Web), it is generally a massive headache. 
**Golden Rule:** REST/GraphQL are for Browser $\rightarrow$ Server communication (where humans need to debug things easily). gRPC is explicitly designed for Server $\rightarrow$ Server communication (where raw speed and efficiency are the only things that matter).

---

### Mistake 2: Attempting to Connect Native Web Browsers Directly to gRPC Backends Without gRPC-Web Proxy

**The mistake:** Invoking raw gRPC TCP calls directly from frontend browser JavaScript.

**Why it's wrong:** Browsers do not expose low-level HTTP/2 framing controls required for raw gRPC streams. Browser clients require a **gRPC-Web** proxy (Envoy) to translate browser HTTP calls.

*Incorrect:*
```javascript
// Frontend JS trying to call raw gRPC endpoint directly
const client = new UserServiceClient('localhost:50051'); // ❌ Fails without gRPC-Web proxy!
```

*Fix:*
```javascript
// Route browser requests through Envoy gRPC-Web proxy layer
```

---

### Mistake 3: Using Non-Backwards-Compatible Field Tag Numbers in `.proto` Files

**The mistake:** Changing existing field tag numbers in `.proto` files (`string name = 1;` -> `string name = 2;`).

**Why it's wrong:** gRPC Protocol Buffers rely on field TAG NUMBERS (not field names) for binary serialization. Changing tag numbers breaks binary deserialization for older clients.

*Incorrect:*
```text
// Modifying proto tag numbers in v2
message User {
  string email = 1; // ❌ Was string name = 1; Tag number reuse breaks binary parsing!
}
```

*Fix:*
```text
message User {
  string name = 1;
  string email = 2; // Add new fields with new unused tag numbers
}
```


---

## 6. Practice Exercises

### Exercise 1: The Final Architecture

**Problem:** You are the Chief Architect at Netflix. You have a React frontend, a Node.js "Gateway" server, and 50 Python "Microservices" running deep in your data center. 
Where do you use REST, and where do you use gRPC?

**Expected output:**
> [!check]- Answer
> ```text
> React Frontend  --(REST/JSON)-->  Node.js Gateway
> Node.js Gateway --(gRPC)------->  Python Microservices
> Python to Python --(gRPC)-------> Python Microservices
> 
> The Browser uses standard REST to talk to the public-facing Gateway. But behind the scenes, all the heavy lifting and data passing between the 50 internal servers is done using ultra-fast gRPC binary streams!
> ```
> - Which protocol is best for internal, computer-to-computer chatter?
> 
---

### Exercise 2: gRPC 4 RPC Communication Styles

**Problem:** Identify the 4 RPC streaming modes supported by gRPC.

**Expected output:**
> [!check]- Answer
> ```text
> 1. Unary RPC (Single request -> Single response)
> 2. Server Streaming RPC (Single request -> Stream of responses)
> 3. Client Streaming RPC (Stream of requests -> Single response)
> 4. Bi-directional Streaming RPC (Stream of requests <-> Stream of responses)
> ```
> ```text
> 1. Unary RPC
> 2. Server Streaming RPC
> 3. Client Streaming RPC
> 4. Bi-directional Streaming RPC
> ```
> - **Explanation:** gRPC leverages HTTP/2 multiplexing for 4 streaming modes.
---

### Exercise 3: gRPC Protocol Transport Basis

**Problem:** Which network protocol version is strictly required as the transport foundation for gRPC?

**Expected output:**
> [!check]- Answer
> ```text
> HTTP/2 (for binary multiplexing and header compression).
> ```
> ```text
> HTTP/2 (for binary multiplexing, streams, and HPACK header compression).
> ```
> - **Explanation:** gRPC relies on HTTP/2 framing for binary streaming capabilities.
---

## 7. Related Terms
- [REST (Representational State Transfer)](../level_03/rest.md) — The architecture gRPC replaces in backend microservices.
- [WebSockets](../level_08/websockets.md) — gRPC also natively supports bi-directional streaming!
- [Binary vs Text Formats](../level_07/binary_vs_text_formats.md) — Related concept: Binary vs Text Formats.
- [SOAP & XML-RPC (legacy)](soap_xml_rpc.md) — Related concept: SOAP & XML-RPC (legacy).
- [Protocol Buffers (protobuf)](protocol_buffers.md) — Protocol Buffers.
- [HTTP / HTTPS](../level_01/http_https.md) — HTTP/2 transport.
- [API (Application Programming Interface)](../level_03/api.md) — Related concept: API (Application Programming Interface).

---

## 8. Key Takeaways
- **gRPC** is an API framework built by Google for ultra-fast, server-to-server communication.
- It replaces JSON with **Protocol Buffers** (binary data), making payloads much smaller and faster to process.
- It uses an RPC style (calling functions) rather than REST style (manipulating resources).
- It is the industry standard for backend **Microservices** architecture.
