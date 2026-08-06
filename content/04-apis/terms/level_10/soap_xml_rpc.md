# SOAP & XML-RPC (legacy)

> **Level 10 — Designing & Tooling**
> The pre-REST protocols still alive in enterprise.

---

## 1. Prerequisites
- [XML](../level_07/xml.md) — The tag-based markup language used for legacy payloads.
- [HTTP Methods (Verbs)](../level_02/http_methods.md) — The network action keywords.

---

## 2. Term Category
- **Architecture / Design**

---

## 3. Environment Context
- **Universal**: Primarily encountered when integrating with legacy enterprise bank APIs, governmental registries, and telecommunications systems.

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Before REST emerged in the early 2000s, software systems required a standardized mechanism to execute functions on remote servers over the internet. 

The early web services standards established **XML-RPC** and **SOAP**:

*   **XML-RPC (XML Remote Procedure Call):** Created in 1998, this protocol enabled remote procedure execution over HTTP. It mapped local function calls (e.g. `getUser(42)`) to HTTP `POST` requests containing XML body payloads describing the method name and parameters.
*   **SOAP (Simple Object Access Protocol):** A heavyweight protocol designed to succeed XML-RPC.
    *   **Strict Protocol Rules:** Unlike REST (which is a flexible design pattern), SOAP is a highly structured, rigid protocol.
    *   **The SOAP Envelope:** All data is wrapped inside a mandatory XML structure consisting of a `<soap:Header>` (for routing and security) and a `<soap:Body>` (containing the method payload).
    *   **WSDL (Web Services Description Language):** SOAP APIs publish their contract via a complex XML document called a WSDL (pronounced *"wiz-dull"*). WSDLs define every endpoint, data type, and operation in detail.
    *   **Enterprise Security:** SOAP supports **WS-Security**, an enterprise standard for message-level encryption.

#### Why REST Replaced SOAP
SOAP's XML envelopes are verbose, difficult to parse, and require specialized libraries to read and write. As web developers sought lightweight, simple communication methods, REST paired with JSON quickly replaced SOAP as the web standard.

---

### (2) Payload Comparison: SOAP vs. REST

#### 1. SOAP XML Payload
To fetch a user's details, SOAP requires wrapping the query inside a verbose envelope:
```xml
<?xml version="1.0"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
  <soap:Header>
    <m:AuthHeader xmlns:m="http://example.com/auth">
      <m:Token>auth_token_xyz</m:Token>
    </m:AuthHeader>
  </soap:Header>
  <soap:Body>
    <m:GetUserRequest xmlns:m="http://example.com/users">
      <m:UserId>42</m:UserId>
    </m:GetUserRequest>
  </soap:Body>
</soap:Envelope>
```

#### 2. REST Equivalent HTTP Request
The same query is expressed via a clean URL path and header token:
```text
GET /api/users/42 HTTP/1.1
Host: api.example.com
Authorization: Bearer auth_token_xyz
```

---

### (3) Reality Metaphor
Imagine mailing a document.
- **SOAP** is like shipping the document inside a **heavy, armored steel security safe**. The safe is locked with multiple combinations (**WS-Security**) and has a rigid, 50-page operating manual welded to the door (**WSDL**). Opening the safe requires specialized tools and significant effort (**high CPU parsing overhead**). It is secure but slow and expensive to ship.
- **REST** is like putting the document inside a **standard cardboard envelope**. It is lightweight, fast, cheap to ship, and easy for anyone to open, though it has less built-in physical armor.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Assuming SOAP is completely obsolete and dead

**The mistake:** Assuming you will never need to learn or support SOAP in a modern software engineering career.

**Why it's wrong:** SOAP is still widely used in legacy corporate architectures, banking payment networks, and telecom companies. When integrating a new application with an established bank's transaction system, you will likely have to write a SOAP client.

---

### Mistake 2: Choosing SOAP for New Lightweight Mobile Web Applications

**The mistake:** Building new mobile apps in 2026 using legacy SOAP XML web services.

**Why it's wrong:** SOAP imposes massive XML payload overhead, strict WSDL compilation requirements, and poor mobile browser compatibility. Use REST JSON, GraphQL, or gRPC.

*Incorrect:*
```http
/* Building new lightweight mobile app endpoints using SOAP XML */
```

*Fix:*
```http
/* Use REST/JSON or gRPC for modern high-performance mobile APIs */
```

---

### Mistake 3: Disabling WS-Security Validation in Legacy Enterprise SOAP Services

**The mistake:** Processing legacy enterprise SOAP XML messages without validating WS-Security headers.

**Why it's wrong:** Enterprise SOAP services rely on WS-Security headers for message-level encryption and digital signatures. Omitting validation permits message tampering.

*Incorrect:*
```http
/* Bypassing WS-Security XML validation in SOAP handlers */
```

*Fix:*
```http
/* Validate WS-Security signatures and XML encryption headers on all incoming SOAP messages */
```


---

## 6. Practice Exercises

### Exercise 1: Protocol Diagnostic

**Problem:** You are reviewing an API documentation file and encounter a `.wsdl` file containing nested schemas. What type of API protocol is this endpoint using?

- **A.** REST over JSON
- **B.** SOAP over XML
- **C.** gRPC over Protocol Buffers

> [!check]- Answer
> - **B (SOAP over XML).** WSDL files are the standard XML contract format used to describe SOAP web services.
> 
> 
---

### Exercise 2: SOAP Message Envelope Structure

**Problem:** Identify the 4 elements of a standard SOAP XML Envelope message.

**Expected output:**
> [!check]- Answer
> ```text
> 1. <soap:Envelope> (Root element)
> 2. <soap:Header> (Optional metadata/security)
> 3. <soap:Body> (Mandatory request/response payload)
> 4. <soap:Fault> (Optional error details inside Body)
> ```
> ```xml
> <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
> <soap:Header>...</soap:Header>
> <soap:Body>
> <soap:Fault>...</soap:Fault>
> </soap:Body>
> </soap:Envelope>
> ```
> - **Explanation:** SOAP envelopes structure enterprise XML web service payloads.
---

### Exercise 3: WSDL Definition Purpose

**Problem:** What is the purpose of a WSDL (Web Services Description Language) file in SOAP architectures?

**Expected output:**
> [!check]- Answer
> ```text
> An XML file that formally defines the contract, available operations, data types, and network endpoints of a SOAP web service.
> ```
> ```text
> An XML file that formally defines the contract, available operations, data types, and network endpoints of a SOAP web service.
> ```
> - **Explanation:** WSDL provides machine-readable contract specifications for SOAP services.
---

## 7. Related Terms
- [gRPC (Remote Procedure Call)](grpc.md) — The modern binary remote procedure call alternative.
- [XML](../level_07/xml.md) — The data format that structures SOAP messages.

---

## 8. Key Takeaways
- XML-RPC and SOAP were the primary pre-REST protocols for remote procedure execution.
- SOAP is a rigid protocol requiring all data to be wrapped in XML envelopes.
- WSDL files serve as the XML-based contract schemas defining SOAP API capabilities.
- WS-Security provides standardized message-level encryption for SOAP.
- SOAP is verbose and CPU-intensive, which led to the popularity of REST over JSON.
- SOAP remains common in banking, government, and legacy enterprise software.
