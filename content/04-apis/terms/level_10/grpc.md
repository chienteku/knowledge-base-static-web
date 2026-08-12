# gRPC (Remote Procedure Call)

> **Level 10 — Designing & Tooling**
> An ultra-fast, highly compressed API framework built by Google. Instead of sending JSON text over HTTP, it sends microscopic binary data, making it the absolute gold standard for Microservices talking to each other.

---

## 1. Prerequisites
- [REST (Representational State Transfer)](../level_03/rest.md) — gRPC completely abandons the REST philosophy.
- [JSON (JavaScript Object Notation)](../level_01/json.md) — gRPC famously hates JSON and replaces it with Protocol Buffers.

---

## 2. Term Category

**API Architecture / Networking Protocol (Server-to-Server  .)**: gRPC (Remote Procedure Call) is a fundamental concept in this technology stack. **Level 10 — Designing & Tooling**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: gRPC-Web Message Frame Serializer

**Scenario:** A gRPC-Web client formats payload bytes into gRPC-Web framed messages (1 byte flag + 4 bytes big-endian length + payload bytes).

**Requirements:**
1. Write frameGrpcWebMessage(payloadBuffer, isCompressed).
2. Prepend 5-byte header.
3. Return Uint8Array.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function frameGrpcWebMessage(payloadBuffer, isCompressed = false) {
>   const payloadBytes = new Uint8Array(payloadBuffer);
>   const len = payloadBytes.length;
>
>   const frame = new Uint8Array(5 + len);
>   frame[0] = isCompressed ? 1 : 0;
>
>   const view = new DataView(frame.buffer);
>   view.setUint32(1, len, false);
>
>   frame.set(payloadBytes, 5);
>   return frame;
> }
>
> // Verification tests
> const payload = new Uint8Array([0x08, 0x96, 0x01]);
> const framed = frameGrpcWebMessage(payload.buffer);
>
> console.assert(framed.length === 8, "Test 1 Failed: 5 header bytes + 3 payload bytes");
> const view = new DataView(framed.buffer);
> console.assert(view.getUint32(1, false) === 3, "Test 2 Failed: Payload length 3 encoded in header");
> ```
>
> #### Technical Explanation
>
> 1. **gRPC-Web Framing Protocol**: 5-byte prefix header preceding every Protobuf message in gRPC-Web streams.
> 2. **Big-Endian Byte Length**: Length field is encoded as 32-bit unsigned integer in network byte order (Big-Endian).
> 3. **Browser gRPC Compatibility**: gRPC-Web enables browsers to make gRPC calls over standard HTTP/1.1 or HTTP/2 proxies.
> 
---

### Exercise 2: gRPC Error Status Code Normalizer

**Scenario:** Converts gRPC status codes (0=OK, 5=NOT_FOUND, 16=UNAUTHENTICATED) into equivalent HTTP status codes.

**Requirements:**
1. Write mapGrpcStatusToHttp(grpcCode).
2. Map gRPC code to HTTP status code.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function mapGrpcStatusToHttp(grpcCode) {
>   const grpcStatusMap = {
>     0: 200,
>     3: 400,
>     5: 404,
>     7: 403,
>     14: 503,
>     16: 401
>   };
>
>   return grpcStatusMap[grpcCode] || 500;
> }
>
> // Verification tests
> console.assert(mapGrpcStatusToHttp(0) === 200, "Test 1 Failed: OK -> 200");
> console.assert(mapGrpcStatusToHttp(5) === 404, "Test 2 Failed: NOT_FOUND -> 404");
> console.assert(mapGrpcStatusToHttp(16) === 401, "Test 3 Failed: UNAUTHENTICATED -> 401");
> ```
>
> #### Technical Explanation
>
> 1. **gRPC Status Codes**: gRPC defines 17 specific status codes (0-16) independent of HTTP status codes.
> 2. **HTTP/2 Framing Transport**: gRPC calls return HTTP 200 OK at the HTTP level while carrying gRPC status codes in trailers (`grpc-status`).
> 3. **API Gateway Status Translation**: API Gateways translate gRPC trailers into standard HTTP status codes for REST consumers.
> 
---

### Exercise 3: gRPC Metadata Header Injector

**Scenario:** An API client attaches custom gRPC metadata headers (e.g. `authorization`, `x-request-id`) to outgoing gRPC calls.

**Requirements:**
1. Write buildGrpcMetadata(authToken, requestId).
2. Return metadata key-value object.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function buildGrpcMetadata(authToken, requestId) {
>   const metadata = {};
>
>   if (authToken) {
>     metadata["authorization"] = `Bearer ${authToken}`;
>   }
>
>   if (requestId) {
>     metadata["x-request-id"] = requestId;
>   }
>
>   return metadata;
> }
>
> // Verification tests
> const meta = buildGrpcMetadata("secret_123", "req_999");
> console.assert(meta["authorization"] === "Bearer secret_123", "Test 1 Failed");
> console.assert(meta["x-request-id"] === "req_999", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **gRPC Metadata Concept**: Equivalent of HTTP headers in gRPC calls; key-value pairs passed alongside RPC invocations.
> 2. **Lowercase Metadata Keys**: gRPC metadata keys are strictly lowercase ASCII strings.
> 3. **Binary Metadata Suffix**: Metadata keys ending with '-bin' (e.g. trace-proto-bin) transmit Base64-encoded binary values.
---

## 6. Related Terms
- [REST (Representational State Transfer)](../level_03/rest.md) — The architecture gRPC replaces in backend microservices.
- [WebSockets](../level_08/websockets.md) — gRPC also natively supports bi-directional streaming!
- [Binary vs Text Formats](../level_07/binary_vs_text_formats.md) — Related concept: Binary vs Text Formats.
- [SOAP & XML-RPC (legacy)](soap_xml_rpc.md) — Related concept: SOAP & XML-RPC (legacy).
- [Protocol Buffers (protobuf)](protocol_buffers.md) — Protocol Buffers.
- [HTTP / HTTPS](../level_01/http_https.md) — HTTP/2 transport.
- [API (Application Programming Interface)](../level_03/api.md) — Related concept: API (Application Programming Interface).

---

## 7. Key Takeaways
- **gRPC** is an API framework built by Google for ultra-fast, server-to-server communication.
- It replaces JSON with **Protocol Buffers** (binary data), making payloads much smaller and faster to process.
- It uses an RPC style (calling functions) rather than REST style (manipulating resources).
- It is the industry standard for backend **Microservices** architecture.
