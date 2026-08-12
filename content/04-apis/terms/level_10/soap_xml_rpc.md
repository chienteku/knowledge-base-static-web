# SOAP & XML-RPC (legacy)

> **Level 10 — Designing & Tooling**
> The pre-REST protocols still alive in enterprise.

---

## 1. Prerequisites
- [XML](../level_07/xml.md) — The tag-based markup language used for legacy payloads.
- [HTTP Methods (Verbs)](../level_02/http_methods.md) — The network action keywords.

---

## 2. Term Category

**Architecture / Design (Universal: Primarily encountered when integrating with legacy enterprise bank APIs, governmental registries, and telecommunications systems.)**: SOAP & XML-RPC (legacy) is a fundamental concept in this technology stack. **Level 10 — Designing & Tooling**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Legacy SOAP XML Envelope Builder

**Scenario:** Constructs W3C standard `SOAP-ENV:Envelope` XML request payloads containing Header and Body elements for enterprise SOAP services.

**Requirements:**
1. Write buildSoapEnvelope(actionName, bodyContentXml, authToken).
2. Format `<SOAP-ENV:Envelope>`.
3. Add Header and Body.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function buildSoapEnvelope(actionName, bodyContentXml, authToken) {
>   const headerXml = authToken
>     ? `<SOAP-ENV:Header><AuthToken>${authToken}</AuthToken></SOAP-ENV:Header>`
>     : "<SOAP-ENV:Header/>";
>
>   return `<?xml version="1.0" encoding="UTF-8"?>
> <SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/">
>   ${headerXml}
>   <SOAP-ENV:Body>
>     <m:${actionName} xmlns:m="http://example.com/soap">
>       ${bodyContentXml}
>     </m:${actionName}>
>   </SOAP-ENV:Body>
> </SOAP-ENV:Envelope>`.replace(/
> \s*/g, "");
> }
>
> // Verification tests
> const soap = buildSoapEnvelope("GetUser", "<UserId>42</UserId>", "token_secret");
> console.assert(soap.includes("<SOAP-ENV:Envelope"), "Test 1 Failed");
> console.assert(soap.includes("<AuthToken>token_secret</AuthToken>"), "Test 2 Failed");
> console.assert(soap.includes("<m:GetUser"), "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **SOAP (Simple Object Access Protocol)**: Strict XML-based protocol specification for web service communication.
> 2. **SOAP Envelope Structure**: Consists of mandatory Envelope, optional Header (metadata/auth), and mandatory Body (RPC action payload).
> 3. **Strict XML Namespaces**: SOAP relies heavily on XML namespaces (xmlns:SOAP-ENV) for element disambiguation.
> 
---

### Exercise 2: XML-RPC Method Call Serializer & Response Parser

**Scenario:** Constructs XML-RPC `<methodCall>` payloads and parses `<methodResponse>` XML text into JavaScript data types.

**Requirements:**
1. Write buildXmlRpcCall(methodName, paramsArray).
2. Parse XML-RPC response.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function buildXmlRpcCall(methodName, paramsArray = []) {
>   const paramTags = paramsArray.map(p => {
>     const typeTag = typeof p === "number" ? `<int>${p}</int>` : `<string>${p}</string>`;
>     return `<param><value>${typeTag}</value></param>`;
>   }).join("");
>
>   return `<?xml version="1.0"?><methodCall><methodName>${methodName}</methodName><params>${paramTags}</params></methodCall>`;
> }
>
> // Verification tests
> const xmlRpc = buildXmlRpcCall("calculator.add", [10, 20]);
> console.assert(xmlRpc.includes("<methodName>calculator.add</methodName>"), "Test 1 Failed");
> console.assert(xmlRpc.includes("<int>10</int><int>20</int>"), "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **XML-RPC Protocol**: Simple Remote Procedure Call (RPC) protocol using XML text over HTTP.
> 2. **Explicit Type Tagging**: Parameters are explicitly tagged by primitive XML types (<int>, <string>, <boolean>, <struct>).
> 3. **Predecessor to SOAP & REST**: Historical protocol specification created in 1998 that evolved into SOAP and later REST/JSON.
> 
---

### Exercise 3: SOAPAction HTTP Header Router

**Scenario:** An API gateway inspects the mandatory `SOAPAction` HTTP header on incoming SOAP POST requests to route to backend RPC handlers.

**Requirements:**
1. Write routeSoapAction(soapActionHeader, handlersMap).
2. Extract action name.
3. Execute handler.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function routeSoapAction(soapActionHeader = "", handlersMap = {}) {
>   // SOAPAction header format: "http://example.com/soap/GetUser" or "GetUser"
>   const cleanAction = soapActionHeader.replace(/"/g, "").split("/").pop();
>
>   const handler = handlersMap[cleanAction];
>   if (!handler) {
>     return { status: 500, error: `SOAP Fault: Action '${cleanAction}' not found` };
>   }
>
>   return { status: 200, action: cleanAction, handler };
> }
>
> // Verification tests
> const handlers = { GetUser: () => "OK" };
> const res = routeSoapAction('"http://example.com/soap/GetUser"', handlers);
>
> console.assert(res.status === 200 && res.action === "GetUser", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **SOAPAction HTTP Header**: HTTP request header required by SOAP 1.1 specifying the target operation name.
> 2. **SOAP Fault Responses**: SOAP servers return `<SOAP-ENV:Fault>` XML payloads when errors occur.
> 3. **WSDL Contract**: Web Services Description Language (WSDL) XML files describe available SOAP actions and XML schemas.
---

## 6. Related Terms
- [gRPC (Remote Procedure Call)](grpc.md) — The modern binary remote procedure call alternative.
- [XML](../level_07/xml.md) — The data format that structures SOAP messages.

---

## 7. Key Takeaways
- XML-RPC and SOAP were the primary pre-REST protocols for remote procedure execution.
- SOAP is a rigid protocol requiring all data to be wrapped in XML envelopes.
- WSDL files serve as the XML-based contract schemas defining SOAP API capabilities.
- WS-Security provides standardized message-level encryption for SOAP.
- SOAP is verbose and CPU-intensive, which led to the popularity of REST over JSON.
- SOAP remains common in banking, government, and legacy enterprise software.
