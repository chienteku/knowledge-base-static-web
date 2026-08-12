# Semantic Versioning (SemVer)

> **Level 4 — Package Management**
> A strict, universal numbering system (e.g., `v4.18.2`) used to communicate to other developers exactly how safe it is to upgrade to a newer version of a software package.

---

## 1. Prerequisites
- [API Versioning (v1, v2)](../../../04-apis/terms/level_10/versioning.md) — The same concept, but applied to downloadable code packages.
- [package.json](package_json.md) — Where these numbers are heavily used.

---

## 2. Term Category

**Industry Standard / Convention (Software Engineering / NPM)**: Semantic Versioning (SemVer) is a fundamental concept in this technology stack. **Level 4 — Package Management**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Imagine you install the `express` package, version `4.0`. Two months later, the Express team releases version `5.0`. Should you upgrade? 
Without a standard numbering system, you have no idea if `5.0` just fixed a small typo, or if it completely deleted half the functions your app relies on. If you upgrade blindly, your app might instantly crash.
**Semantic Versioning (SemVer)** is a contract between the author of a package and the user. It uses a three-part number format: **`MAJOR.MINOR.PATCH`**.

### (2) The Three Numbers
Given version **`4.18.2`**:
1. **MAJOR (4): Breaking Changes.** The author changed or deleted existing code. If you upgrade from 4 to 5, your app WILL break. You must manually rewrite your code.
2. **MINOR (18): New Features.** The author added brand new functions, but didn't touch the old ones. It is 100% safe to upgrade. Old code will keep working perfectly.
3. **PATCH (2): Bug Fixes.** The author fixed a typo or patched a security vulnerability. No new features, no breaking changes. Highly recommended to upgrade immediately.

### (3) The Caret (`^`) Symbol in package.json
If you look in your `package.json`, you rarely see `"express": "4.18.2"`. Instead, you see `"express": "^4.18.2"`.
That little `^` caret is a command to NPM. It means: *"It is safe to automatically download any new MINOR or PATCH updates, but NEVER download a new MAJOR version."*
If the author releases `4.19.0`, NPM will download it automatically. If the author releases `5.0.0`, NPM will ignore it to protect your app from crashing.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Ignoring Major version bumps

**The mistake:** A developer sees that React is currently on version `18.2.0`. They notice their `package.json` says `"react": "^16.8.0"`. They manually change it to `"^18.2.0"` and run `npm install`.

**Why it's wrong:** Bumping a MAJOR version (from 16 to 18) means the authors intentionally introduced Breaking Changes! You cannot just change the number. You must go to the official React documentation, read the "Migration Guide," and manually rewrite parts of your application to support the new architecture.
**Golden Rule:** Never manually bump a MAJOR version unless you are prepared to spend hours fixing breaking changes in your code.

---



### Mistake 2: Publishing Breaking API Changes Under Patch or Minor SemVer Releases

**The mistake:** Changing function signatures or removing API endpoints in a `1.1.0` -> `1.1.1` release.

**Why it's wrong:** Caret `^` and tilde `~` version specs automatically update minor/patch versions. Breaking changes in non-MAJOR releases break consumers' builds.

*Incorrect:*
```javascript
// Releasing breaking parameter changes in version 1.2.1
```

*Fix:*
```javascript
Increment MAJOR version for breaking API changes: 2.0.0
```

### Mistake 3: Confusing Caret (`^`) vs Tilde (`~`) Version Specifier Auto-Updates

**The mistake:** Expecting `^1.2.3` to stay locked to `1.2.3` forever.

**Why it's wrong:** `^1.2.3` permits updates up to `<2.0.0` (minor & patch updates). `~1.2.3` permits updates up to `<1.3.0` (patch updates only).

*Incorrect:*
```javascript
// Assuming ^1.2.3 will never update minor version 1.3.0
```

*Fix:*
```javascript
Use exact version string '1.2.3' (no prefix) or package-lock.json for absolute locks
```

## 5. Practice Exercises

### Exercise 1: Safe or Dangerous?

**Problem:** You are currently using version `2.4.1` of a charting library. The author releases three new versions over the next year. Based on SemVer, which of these updates requires you to rewrite your code?
1. Update to `2.4.2`
2. Update to `2.5.0`
3. Update to `3.0.0`

**Expected output:**
> [!check]- Answer
> ```text
> 1. Safe (Patch): Only bug fixes.
> 2. Safe (Minor): Only new features added.
> 3. Dangerous (Major): Code you rely on was deleted or changed! You must rewrite your code.
> ```
> - Which number represents "Breaking Changes"?
> 
---



### Exercise 2: Decoding SemVer Version Numbers

**Problem:** Given version `2.4.1`, identify:
- MAJOR version
- MINOR version
- PATCH version

**Expected output:**
> [!check]- Answer
> ```text
> MAJOR: 2
> MINOR: 4
> PATCH: 1
> ```
> ```text
> MAJOR: 2
> MINOR: 4
> PATCH: 1
> ```
>
> **Explanation:** SemVer format is `MAJOR.MINOR.PATCH` (Breaking.Feature.Fix).
> 
---

### Exercise 3: Matching SemVer Range Specs

**Problem:** Determine highest allowed version for:
1. `~1.4.2`
2. `^1.4.2`

**Expected output:**
> [!check]- Answer
> ```text
> 1. 1.4.x (up to 1.4.99...)
> 2. 1.x.x (up to 1.99.99...)
> ```
> ```text
> 1. ~1.4.2 permits up to <1.5.0
> 2. ^1.4.2 permits up to <2.0.0
> ```
>
> **Explanation:** Tilde `~` locks MINOR version; Caret `^` locks MAJOR version.
> 
## 6. Related Terms
- [package.json](package_json.md) — Where the SemVer ranges (using `^` and `~`) are stored.

---

## 7. Key Takeaways
- **Semantic Versioning** uses the format `MAJOR.MINOR.PATCH`.
- **MAJOR:** Breaking changes. Upgrading requires code rewrites.
- **MINOR:** New features. Fully backwards-compatible.
- **PATCH:** Bug fixes. Fully backwards-compatible.
- The **`^`** symbol in `package.json` tells NPM to auto-update Minors and Patches, but protect against Major breaking changes.
