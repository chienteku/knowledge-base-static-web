# OAuth Scopes

> **Level 4 — Security & Authentication**
> Fine-grained permissions granted to a token (`read:user`).

---

## 1. Prerequisites
- [OAuth 2.0](oauth.md) — The authorization framework defining client access.

---

## 2. Term Category

**Security (Universal: Implemented inside API gateways, auth servers, and client OAuth libraries.)**: OAuth Scopes is a fundamental concept in this technology stack. **Level 4 — Security & Authentication**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
When you authorize a third-party application (like a scheduling calendar) to connect to your GitHub or Google account, you do not want to give that application full access to delete your repositories, read your personal emails, or change your password. You want to grant only the minimum permissions necessary for the tool to function. This is the **Principle of Least Privilege**.

To enforce these security boundaries, OAuth 2.0 uses **Scopes**:
- **Scopes** are string identifiers representing specific permissions or access limits on a resource (e.g. `read:user`, `write:calendar`, `repo:status`).
- **Authorization Request:** During the login flow, the client application requests a list of scopes.
- **The Consent Screen:** The authorization server displays these exact scopes to the user: *"App X wants permission to: View your public email address, Update your calendar."*
- **Token Restriction:** If the user approves, the server generates an access token. The token is stamped with the authorized scopes.
- **API Gatekeeper:** When the client sends the token to the API, the resource server verifies the token. If the client tries to call `/api/emails` but the token only contains the `read:profile` scope, the request is rejected with a `403 Forbidden` error.

#### Crucial Distinction: Scopes vs. User Roles
- **Roles (RBAC):** Define what a **user** is allowed to do based on their identity (e.g. *Admin* vs. *Guest*).
- **Scopes:** Define what a **client application** is permitted to do **on behalf of** a user. If an Admin authorizes a client app with only `read` scope, that app cannot perform delete operations, even though the user is an Admin. The scope acts as a ceiling on the token's authority.

### (2) Reality Metaphor
Imagine hiring a cleaning service for your house.
- Handing over your physical house key is like giving an app your login password. The cleaner can go into your safe, read your journal, or sell your furniture.
- An **OAuth Scope** is like giving the cleaner a **programmable electronic keycard**.
  - You configure the keycard with the scopes **`scope:kitchen`** and **`scope:living-room`**.
  - When the cleaner swipes the card on the kitchen lock, it opens.
  - If they attempt to swipe the card on your private bedroom door, the lock reads the card, detects the lack of `scope:bedroom` authority, and remains locked.

### (3) Code Examples

#### OAuth Request URL requesting specific scopes
A client redirects the user to Google's authentication page, requesting access to read contacts and edit calendar events:
```text
https://accounts.google.com/o/oauth2/v2/auth?
  client_id=client_102938&
  redirect_uri=https://mycal.com/callback&
  response_type=code&
  scope=https://www.googleapis.com/auth/contacts.readonly%20https://www.googleapis.com/auth/calendar.events
```

#### Node.js Express server checking Scopes in Middleware
```javascript
import express from 'express';
const app = express();

// Middleware to verify if the token contains the required scope
function requireScope(requiredScope) {
  return (req, res, next) => {
    // req.auth is populated by your JWT/OAuth verification middleware
    const scopes = req.auth?.scopes || []; 
    
    if (scopes.includes(requiredScope)) {
      next(); // Scope present, proceed to controller
    } else {
      res.status(403).json({ error: `Requires scope: ${requiredScope}` });
    }
  };
}

// Endpoint protected by scope checking
app.patch('/api/calendar/events', requireScope('write:calendar'), (req, res) => {
  res.send("Calendar event updated.");
});
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Conflating user permission checks with scope checks

**The mistake:** Assuming that checking `scope:admin` is sufficient to allow administrative operations, without verifying if the underlying user is actually an administrator in the database.

**Why it's wrong:** A malicious standard user could register a client app and request the `admin` scope. If the server only checks if the token has the `admin` scope without checking the user's role in the database, it allows a low-privileged user to perform administrative actions. Always check **both** scope (what the client app is allowed to do) and user role (what the user is allowed to do).

---

### Mistake 2: Requesting Overly Permissive Wildcard Scopes (`scope: all` or `repo`)

**The mistake:** Requesting full read/write `repo` scope when an app only needs to read a user's public email address.

**Why it's wrong:** Violates the Principle of Least Privilege. Requesting excessive scopes scares users away during consent prompts and amplifies blast radius if tokens are leaked.

*Incorrect:*
```http
// Requesting full admin scope for simple email read
/authorize?scope=admin:all ; ❌ Excessive scope request!
```

*Fix:*
```http
/authorize?scope=user:email ; Request minimal required scope only
```

---

### Mistake 3: Failing to Enforce Scope Permissions on Backend API Endpoints

**The mistake:** Verifying token signature on backend endpoints without checking if token contains required scope claim (`scopes.includes('write:items')`).

**Why it's wrong:** A valid user token with read-only scope could invoke write/delete endpoints if backend code checks token validity but neglects scope permission claims.

*Incorrect:*
```javascript
app.post('/items', verifyToken, (req, res) => {
  // ❌ Missing scope check! Accepts token with read-only scope!
});
```

*Fix:*
```javascript
app.post('/items', verifyToken, requireScope('write:items'), (req, res) => {
  // Verifies token HAS 'write:items' scope before proceeding
});
```


---

## 5. Practice Exercises

### Exercise 1: OAuth 2.0 Scope Permission Validator

**Scenario:** An API endpoint middleware verifies that the client's OAuth access token contains required scopes before granting access.

**Requirements:**
1. Write validateOAuthScopes(grantedScopeString, requiredScopesArray).
2. Parse space-separated granted scopes.
3. Ensure ALL required scopes are present.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function validateOAuthScopes(grantedScopeString, requiredScopesArray = []) {
>   if (!grantedScopeString || typeof grantedScopeString !== "string") {
>     return { authorized: false, status: 403, error: "No scopes granted in token" };
>   }
>
>   const grantedSet = new Set(grantedScopeString.split(" ").map(s => s.trim()));
>   const missing = requiredScopesArray.filter(req => !grantedSet.has(req));
>
>   if (missing.length > 0) {
>     return {
>       authorized: false,
>       status: 403,
>       error: `Insufficient Scope: missing ${missing.join(", ")}`
>     };
>   }
>
>   return { authorized: true, status: 200 };
> }
>
> // Verification tests
> const tokenScopes = "read:user write:user read:orders";
>
> console.assert(validateOAuthScopes(tokenScopes, ["read:user"]).authorized === true, "Test 1 Failed");
> console.assert(validateOAuthScopes(tokenScopes, ["read:user", "delete:user"]).authorized === false, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **OAuth Scope Concept**: Scopes specify the exact permissions granted by user to third-party client (e.g. read:profile).
> 2. **Space-Separated Format**: RFC 6749 specifies scopes are formatted as space-delimited string tokens.
> 3. **Fine-Grained Access Control**: Limits client application capabilities to least-privilege subset of user permissions.
> 
---

### Exercise 2: Hierarchical Scope Expansion Resolver

**Scenario:** An API scope parser resolves master scopes (e.g. `admin:all`) into fine-grained child permission scopes (`read:users`, `write:users`).

**Requirements:**
1. Write expandScopeHierarchy(scopeArray, scopeMap).
2. Expand parent scopes into full permission set.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function expandScopeHierarchy(grantedScopes, scopeMap) {
>   const expanded = new Set();
>
>   for (const s of grantedScopes) {
>     expanded.add(s);
>     if (scopeMap[s]) {
>       for (const child of scopeMap[s]) {
>         expanded.add(child);
>       }
>     }
>   }
>
>   return Array.from(expanded);
> }
>
> // Verification tests
> const map = {
>   "admin": ["read:users", "write:users", "delete:users"],
>   "user": ["read:users"]
> };
>
> const expanded = expandScopeHierarchy(["admin"], map);
> console.assert(expanded.includes("read:users") && expanded.includes("delete:users"), "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Hierarchical Scopes**: Master administrative scopes implicitly grant all nested sub-permission scopes.
> 2. **Simplified User Consent**: Presents single clear scope choice to user during authorization consent prompt.
> 3. **Internal Permission Mapping**: Translates high-level OAuth scopes to low-level backend RBAC rules.
> 
---

### Exercise 3: Least-Privilege Scope Minimizer Auditor

**Scenario:** A security auditor flags client requests asking for excessive or unneeded OAuth scopes.

**Requirements:**
1. Write auditRequestedScopes(requestedScopes, requiredEndpointScopes).
2. Flag unnecessary scopes.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function auditRequestedScopes(requestedScopes = [], allowedScopes = []) {
>   const unnecessary = requestedScopes.filter(s => !allowedScopes.includes(s));
>
>   return {
>     leastPrivilege: unnecessary.length === 0,
>     unnecessaryScopes: unnecessary
>   };
> }
>
> // Verification tests
> const requested = ["read:user", "delete:all_data"];
> const allowed = ["read:user", "write:user"];
>
> const audit = auditRequestedScopes(requested, allowed);
> console.assert(audit.leastPrivilege === false && audit.unnecessaryScopes[0] === "delete:all_data", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Principle of Least Privilege**: Applications should request ONLY the minimum scope permissions required for functionality.
> 2. **User Trust Impact**: Asking for excessive scopes (e.g. full account deletion) frightens users into abandoning consent.
> 3. **Blast Radius Reduction**: Minimizes potential damage if client access token is compromised.
---

## 6. Related Terms
- [API Keys](api_keys.md) — Simple tokens that usually grant full access without fine-grained scope limitations.
- [JWT (JSON Web Tokens)](jwt.md) — The token format where OAuth scopes are typically stored in the payload (often under the `scp` or `scope` claims).

---

## 7. Key Takeaways
- OAuth Scopes represent fine-grained access boundaries granted to client applications.
- They enforce the Principle of Least Privilege, protecting users' private data from third-party app overreach.
- Scopes define client application permissions; they do not replace user roles (RBAC).
- If an API request lacks the required scope, the server rejects it with a `403 Forbidden` response.
- Scopes are requested by the client, approved by the user via a consent screen, and verified by the server on each request.
