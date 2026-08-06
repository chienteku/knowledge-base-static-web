# `surreal validate` (Query Validation)

> **Level 10 — SDKs, Deployment & Production**
> The SurrealDB CLI pre-flight validation command that parses `.surql` script files for syntax and structural errors without executing queries against a database server.

---

## 1. Prerequisites

- [SurrealDB CLI (`surreal sql`)](../level_01/surreal_cli.md) — CLI binary overview.
- [`surreal export` / `surreal import` (Backups)](export_import.md) — Working with `.surql` files.

---

## 2. Term Category


**Performance / Operations (surreal validate CLI schema checker)**: - **CLI Commands & Tooling**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
When building CI/CD deployment pipelines, schema migrations and query script files (`.surql`) must be checked for syntax errors before being deployed to production databases. Running invalid SurrealQL syntax in production migration scripts causes deployment failures mid-pipeline.

The `surreal validate` CLI command performs **static AST syntax validation** on `.surql` files locally or in CI/CD without needing a running database server. It parses the SurrealQL grammar, detects invalid keywords, unclosed brackets, or invalid function calls, and exits with non-zero exit codes if syntax errors exist.

### (2) Reality Metaphor
Think of a compiler pre-flight check:
- **`surreal validate`**: A TypeScript compiler (`tsc --noEmit`) checking your code for syntax and type errors on your laptop before pushing to GitHub. You don't need to deploy the application to a live web server just to check if you forgot a closing parenthesis.

### (3) Code Examples

#### Short Snippet
```bash
# Validate syntax of a SurrealQL migration file locally
surreal validate migration_2026_07.surql
```

#### Fuller Example (GitHub Actions CI/CD Step)
```yaml
# .github/workflows/ci.yml
name: Validate Database Migrations

on:
  push:
    branches: [ main, dev ]

jobs:
  validate-surrealql:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install SurrealDB CLI
        run: curl -sSf https://install.surrealdb.com | sh

      - name: Validate All .surql Schema Files
        run: |
          for file in schemas/*.surql; do
            echo "Validating $file..."
            surreal validate "$file"
          done
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Expecting `surreal validate` to Catch Runtime Database Constraint Violations

**The mistake:** Assuming `surreal validate` will catch missing table errors or record ID uniqueness conflicts.

**Why it's wrong:** `surreal validate` performs **static syntax validation**. It verifies that the SurrealQL syntax is valid, but it cannot verify runtime data state (like whether a referenced table exists on a live server).

*Difference:*
- **`surreal validate`**: Catches typos like `SELEKT * FROM user` or missing parentheses.
- **Integration Tests**: Catches runtime errors like duplicate record IDs or failed `ASSERT` checks.

---



### Mistake 2: Deploying Invalid Syntax `.surql` Migration Files to Production Without Pre-Validation

**The mistake:** Running database migration scripts in production without running `surreal validate` first.

**Why it's wrong:** Syntax errors in migration files abort deployment pipelines halfway through execution. Run `surreal validate script.surql` in CI/CD before applying migrations.

*Incorrect:*
```surrealql
-- Applying un-validated script directly to production
$ surreal import prod.surql // ❌ Fails halfway on syntax error!
```

*Fix:*
```surrealql
$ surreal validate script.surql # 1. Validate syntax in CI/CD
$ surreal import script.surql # 2. Apply verified script
```

### Mistake 3: Confusing `surreal validate` (Syntax Check) with Dry-Run Execution

**The mistake:** Expecting `surreal validate` to test database permissions or runtime data constraints.

**Why it's wrong:** `surreal validate` checks SurrealQL static syntax correctness. It does NOT evaluate runtime permissions or database state constraints.

*Incorrect:*
```surrealql
-- Expecting validate to check runtime database records
```

*Fix:*
```surrealql
Use surreal validate for static syntax checks in CI/CD build steps
```





## 5. Practice Exercises

### Exercise 1: Validating Schema File Syntax via CLI

**Scenario:**
A CI/CD pipeline validates SurrealQL schema script files (such as `schema.surql`) for syntax errors before deploying migrations.

**Requirements:**
1. Formulate `surreal validate` CLI command for `schema.surql`.

> [!check]- Answer
>
> #### Implementation
>
> ```bash
> surreal validate schema.surql
> ```
>
> #### Technical Explanation
>
> 1. `surreal validate <file>` parses SurrealQL script files locally to verify syntax correctness.
> 2. Returns exit code `0` on valid syntax; non-zero exit code on parser syntax errors.
> 3. Catches syntax errors in pull requests before deploying schema changes.
> 
---

### Exercise 2: Validating Multiple Schema Script Files

**Scenario:**
Validate all SurrealQL script files in directory `migrations/*.surql` in a single validation run.

**Requirements:**
1. Execute `surreal validate migrations/*.surql`.

> [!check]- Answer
>
> #### Implementation
>
> ```bash
> surreal validate migrations/*.surql
> ```
>
> #### Technical Explanation
>
> 1. Validates multiple script files in batch mode.
> 2. Ensures all versioned migration files pass syntax checks.
> 3. Integrates with pre-commit git hooks and GitHub Actions.
> 
---

### Exercise 3: Offline Local Syntax Checking

**Scenario:**
Explain why `surreal validate` can run locally in CI/CD without connecting to a running SurrealDB server instance.

**Requirements:**
1. Describe offline parser validation architecture.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Offline Validation Architecture:
> 'surreal validate' uses SurrealDB's embedded Rust query parser locally to validate syntax trees without opening network connections to database servers.
> ```
>
> #### Technical Explanation
>
> 1. Parses SurrealQL AST syntax trees offline locally in the CLI binary.
> 2. Requires zero network connections, database credentials, or active server instances.
> 3. Fast syntax validation for CI build pipelines.
> 
---





## 6. Related Terms

- [SurrealDB CLI (`surreal sql`)](../level_01/surreal_cli.md) — CLI binary tools.
- [`surreal export` / `surreal import` (Backups)](export_import.md) — Export and import utilities.
- [Data Migrations in SurrealDB](data_migrations.md) — Schema migration strategies.
- [Error Handling & Debugging](error_handling.md) — Related concept: Error Handling & Debugging.

---

## 7. Key Takeaways
- `surreal validate <file.surql>` checks SurrealQL files for syntax errors without connecting to a server.
- Essential tool for pre-commit hooks and CI/CD automated test pipelines.
- Ensures migration scripts and schema definitions contain valid syntax before production deployment.
