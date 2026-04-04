# Shadow Market: Automation (`packages/scripts`)

The **Shadow Market Scripts** package contains all automation, devops, and maintenance tools for the project's life cycle.

---

## 🛠️ Main Scripts

### 1. `compile.sh`
Recompiles the Midnight COMPACT contract and regenerates the TypeScript bindings in `packages/contracts`.

### 2. `deploy.sh`
Executes the deployment of the Shadow Market to the specified network (Devnet/Localnet).

### 3. `cleanup.sh`
Performs a deep clean of all `node_modules` and build artifacts across all heads.

### 4. `start-local.sh`
Quickstart with a local Midnight node and off-chain indexer for local development.

---

## 🏗️ Usage

Execute scripts from the root of the monorepo:

```bash
# Compile and build everything
pnpm run build

# Deploy to local-net
pnpm run deploy:local
```

---

## ⚙️ Development

If adding a new script, ensure it has the correct permissions:
```bash
chmod +x ./packages/scripts/new-script.sh
```
