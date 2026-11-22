# StoreCraft

StoreCraft is a multi-tenant e-commerce builder. The first release candidate supports merchant registration, store setup and preview, catalog management, platform approval, and guest cash checkout with delivery or pickup. Merchants can advance order fulfillment and customers can track orders by reference.

| Workspace | Purpose |
| --- | --- |
| `apps/web` | Next.js App Router for the platform admin, merchant dashboard, and storefront |
| `apps/api` | Express API, Mongoose models, authentication, approval, catalog, and order processing |
| `packages/shared` | Roles and storefront slug validation |

## Local development

Use Node.js 24, npm, and MongoDB running as a replica set. Checkout uses MongoDB transactions to reserve stock and save orders atomically. Atlas replica sets also work for development.

For a local MongoDB installation, start a single-node replica set. Run `mongod` in a separate terminal and initiate the set once.

```sh
mkdir -p /tmp/storecraft-local-db
mongod --dbpath /tmp/storecraft-local-db --bind_ip 127.0.0.1 --replSet storecraft
```

```sh
mongosh 'mongodb://127.0.0.1:27017/admin?directConnection=true' --eval 'rs.initiate({_id:"storecraft",members:[{_id:0,host:"127.0.0.1:27017"}]})'
```

From the checkout root, install dependencies and create your local environment files.

```sh
npm ci
cp -n apps/api/.env.example apps/api/.env
cp -n apps/web/.env.example apps/web/.env.local
node -p "require('node:crypto').randomBytes(32).toString('hex')"
```

Put the generated secret in `apps/api/.env` as `JWT_ACCESS_SECRET`. The example MongoDB URI targets the replica set above. Start the two applications in separate terminals.

```sh
npm run dev:api
npm run dev:web
```

The API uses port 4000 and Next.js uses port 3000. The API exposes `/health` for process liveness and `/ready` for database connectivity.

### Try the workflow

1. Register at `/register`. Pick your slug, complete store setup, and add a product with stock in `/dashboard`.
2. Create the platform account with `npm run create-admin -w @storecraft/api`. Provide `STORECRAFT_ADMIN_EMAIL` and `STORECRAFT_ADMIN_PASSWORD` through the process environment or a temporary local API environment file. Remove the bootstrap variables after creating the account.
3. Sign in at `/super-admin` and approve the store. Public storefronts are available at `/store/<slug>`. A configured wildcard domain can serve the same shop at `<slug>.<domain>`.
4. Place a cash order as a customer. Save the order reference for tracking. The merchant can progress delivery through confirmed, packed, shipped, and delivered. Pickup moves directly from packed to delivered.

Optional Cloudinary variables are listed in `apps/web/.env.example`. With them set, the product form can upload a JPEG, PNG, or WebP up to 700 KB. The form also accepts an HTTPS image URL.

## Validation

```sh
npm run build
TEST_MONGODB_URI='mongodb://127.0.0.1:27017/?replicaSet=storecraft' npm test
npx playwright install chromium
npm run test:e2e
```

Use a disposable replica set for API tests. They create and drop randomly named databases. Without `TEST_MONGODB_URI`, database tests are skipped. For the browser test, run both services against a disposable database, provision an admin, and set `STORECRAFT_ADMIN_EMAIL` and `STORECRAFT_ADMIN_PASSWORD` in the test process. The browser test creates a merchant and an order. Use `STORECRAFT_E2E_URL` to change the web origin and `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to use an installed Chromium. With `STORECRAFT_ROOT_DOMAIN` set in both the web and test processes, the test exercises hostname-based routing too.

## Hosted deployment

1. Create an Atlas database user with access to the StoreCraft database. Configure Atlas network access for the API host and put the connection URI in the API host's secret settings as `MONGODB_URI`. Keep the database name in the URI. Supply a separately generated `JWT_ACCESS_SECRET`.
2. Deploy the API on Railway from the repository root. `railway.toml` defines the workspace start command and `/ready` health check. Review the host's actual reverse-proxy configuration before setting `TRUST_PROXY_HOPS`. Run the admin bootstrap once with secure environment variables.
3. Deploy the frontend on Vercel using `apps/web` as the project root with workspace packages available. Set `STORECRAFT_API_URL` to the API's HTTPS origin. Keep Cloudinary credentials in Vercel's server-side environment settings if uploads are enabled.
4. Verify sign-in, approval, checkout, and tracking against the hosted services using staging accounts. To add subdomains, configure the wildcard domain in Vercel, follow Vercel's DNS verification instructions, and set `STORECRAFT_ROOT_DOMAIN` to the verified domain.

The checkout currently supports guest COD. Payment gateways, subscriptions, social sign-in, custom merchant domains, full localization and analytics are outside this release candidate.
