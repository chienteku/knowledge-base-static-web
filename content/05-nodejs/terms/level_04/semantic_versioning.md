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

### Exercise 1: SemVer Caret vs Tilde Range Matcher

**Scenario:** Parses Semantic Versioning range specifiers (Caret `^1.2.3`, Tilde `~1.2.3`, Exact `1.2.3`) to check if target version satisfies range.

**Requirements:**
1. Write satisfiesSemverRange(rangeStr, targetVersionStr).
2. Parse Caret ^ (allows MINOR/PATCH updates).
3. Parse Tilde ~ (allows PATCH updates).
4. Parse Exact version.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function satisfiesSemverRange(rangeStr, targetVersionStr) {
>   const parse = (v) => v.replace(/^[^\d]*/, "").split(".").map(n => parseInt(n, 10));
>
>   const [tMajor, tMinor, tPatch] = parse(targetVersionStr);
>   const [rMajor, rMinor, rPatch] = parse(rangeStr);
>
>   if (rangeStr.startsWith("^")) {
>     // Caret ^: Same MAJOR version, target >= range version
>     if (tMajor !== rMajor) return false;
>     if (tMinor < rMinor) return false;
>     if (tMinor === rMinor && tPatch < rPatch) return false;
>     return true;
>   }
>
>   if (rangeStr.startsWith("~")) {
>     // Tilde ~: Same MAJOR and MINOR version, target PATCH >= range PATCH
>     if (tMajor !== rMajor || tMinor !== rMinor) return false;
>     return tPatch >= rPatch;
>   }
>
>   // Exact Match
>   return targetVersionStr === rangeStr;
> }
>
> // Verification tests
> console.assert(satisfiesSemverRange("^1.2.0", "1.5.2") === true, "Test 1 Failed: Caret allows MINOR update");
> console.assert(satisfiesSemverRange("^1.2.0", "2.0.0") === false, "Test 2 Failed: Caret blocks MAJOR update");
> console.assert(satisfiesSemverRange("~1.2.0", "1.2.5") === true, "Test 3 Failed: Tilde allows PATCH update");
> console.assert(satisfiesSemverRange("~1.2.0", "1.3.0") === false, "Test 4 Failed: Tilde blocks MINOR update");
> ```
>
> #### Technical Explanation
>
> 1. **Semantic Versioning Syntax**: `MAJOR.MINOR.PATCH` (e.g. `2.4.1`).
> 2. **Caret `^` Prefix**: Allows backward-compatible updates (new MINOR and PATCH versions) without bumping MAJOR (e.g. `^1.2.0` matches `1.9.9` but NOT `2.0.0`).
> 3. **Tilde `~` Prefix**: Allows PATCH bug fixes only within the same MINOR version (e.g. `~1.2.0` matches `1.2.9` but NOT `1.3.0`).
> 
---

### Exercise 2: Automated SemVer Version Bumper

**Scenario:** A release automation utility increments version strings based on bump type (`major`, `minor`, `patch`).

**Requirements:**
1. Write bumpSemverVersion(currentVersionStr, bumpType).
2. Increment MAJOR, MINOR, or PATCH segment.
3. Reset lower segments to 0.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function bumpSemverVersion(currentVersionStr = "1.0.0", bumpType = "patch") {
>   const parts = currentVersionStr.split(".").map(n => parseInt(n, 10));
>   let [major, minor, patch] = parts;
>
>   switch (bumpType.toLowerCase()) {
>     case "major":
>       major += 1;
>       minor = 0;
>       patch = 0;
>       break;
>     case "minor":
>       minor += 1;
>       patch = 0;
>       break;
>     case "patch":
>       patch += 1;
>       break;
>     default:
>       throw new Error(`Invalid bump type: ${bumpType}`);
>   }
>
>   return `${major}.${minor}.${patch}`;
> }
>
> // Verification tests
> console.assert(bumpSemverVersion("1.2.3", "patch") === "1.2.4", "Test 1 Failed");
> console.assert(bumpSemverVersion("1.2.3", "minor") === "1.3.0", "Test 2 Failed");
> console.assert(bumpSemverVersion("1.2.3", "major") === "2.0.0", "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **MAJOR Version Increment**: Bumped when introducing breaking, incompatible API changes.
> 2. **MINOR Version Increment**: Bumped when adding backward-compatible new functionality.
> 3. **PATCH Version Increment**: Bumped when making backward-compatible bug fixes.
> 
---

### Exercise 3: Breaking Change Safety Guard

**Scenario:** An API dependency updater flags potential breaking changes before upgrading packages.

**Requirements:**
1. Write checkUpgradeSafety(currentVer, targetVer).
2. Identify if MAJOR version changes.
3. Return warning flag.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function checkUpgradeSafety(currentVer, targetVer) {
>   const cMajor = parseInt(currentVer.split(".")[0], 10);
>   const tMajor = parseInt(targetVer.split(".")[0], 10);
>
>   const isBreakingChange = tMajor > cMajor;
>
>   return {
>     isBreakingChange,
>     currentVer,
>     targetVer,
>     action: isBreakingChange 
>       ? "REQUIRES_MANUAL_MIGRATION_AUDIT" 
>       : "SAFE_AUTO_UPGRADE"
>   };
> }
>
> // Verification tests
> const res1 = checkUpgradeSafety("4.17.21", "4.18.0");
> console.assert(res1.isBreakingChange === false, "Test 1 Failed: Minor upgrade safe");
>
> const res2 = checkUpgradeSafety("4.17.21", "5.0.0");
> console.assert(res2.isBreakingChange === true, "Test 2 Failed: Major upgrade breaking");
> ```
>
> #### Technical Explanation
>
> 1. **SemVer Zero Version Special Case**: In `0.y.z` pre-release versions, MINOR bumps (`0.1.0` -> `0.2.0`) can contain breaking changes.
> 2. **Automated Dependency Upgrades**: Tools like Dependabot or Renovate automate minor/patch PR creation while flagging major version breaking upgrades.
> 3. **API Contract Protection**: Adhering strictly to SemVer prevents breaking consumer integrations. 
## 6. Related Terms
- [package.json](package_json.md) — Where the SemVer ranges (using `^` and `~`) are stored.

---

## 7. Key Takeaways
- **Semantic Versioning** uses the format `MAJOR.MINOR.PATCH`.
- **MAJOR:** Breaking changes. Upgrading requires code rewrites.
- **MINOR:** New features. Fully backwards-compatible.
- **PATCH:** Bug fixes. Fully backwards-compatible.
- The **`^`** symbol in `package.json` tells NPM to auto-update Minors and Patches, but protect against Major breaking changes.
