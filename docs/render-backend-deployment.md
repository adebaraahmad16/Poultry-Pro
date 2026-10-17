# Render + existing Windows XAMPP MySQL

## What has been implemented

The database remains on this Windows computer. No migration, reseeding, table deletion, password change, Windows firewall change or `my.ini` edit was performed.

- `render.yaml`: Node runtime, no Docker; Render-assigned HTTP `PORT`; installs backend dependencies and checksum-verified Tailscale static binaries; starts the supervisor.
- `backend/scripts/start-render.mjs`: starts Tailscale in userspace mode using a writable temporary directory, authenticates with a protected temporary key file, then starts the loopback TCP bridge and existing Express application. A failed required process stops the service so Render can restart it. Auth keys are not placed in command arguments or printed.
- `backend/scripts/tailnet-bridge.mjs`: listens only on `127.0.0.1` and pipes raw MySQL bytes through `tailscale nc`. It does not depend on an HTTP proxy, privileged TUN device, root access, Docker, or router forwarding.
- `backend/config/db.js`: environment-based port/TLS settings, bounded pooling/queueing, keepalive, timeouts, and production rejection of root/blank-password configuration. Broken connections are discarded by mysql2; new acquisitions can reconnect. Writes and transactions are never automatically replayed after uncertain failures.
- Database connection failures return a safe `503` message through existing route handlers. SQL validation errors retain their original handling. The frontend propagates API/network failures rather than silently saving locally or presenting cached data as a successful response.
- `/health` checks the API process; `/health/ready` checks a real MySQL connection. Render uses liveness so an offline Windows computer does not prevent the API from explaining the outage. A healthy API process alone does not prove database connectivity.
- `backend/scripts/check-database.mjs`: read-only account/table verification.
- `scripts/prepare-render-backend.mjs`: creates a clean standalone backend package including `backend/` and `shared/`, excluding actual `.env` files and dependencies.

## Network path and compatibility

```text
Vercel frontend --HTTPS--> Render Express API
                           |
                  mysql2 TCP connection
                           |
                  Render 127.0.0.1:13306
                           |
                  tailscale nc (userspace daemon)
                           |
                 authenticated encrypted tailnet
                           |
             Windows Tailscale IP:13306 (Serve)
                           |
                 Windows 127.0.0.1:3306
                           |
                  existing XAMPP database
```

Tailscale documents userspace networking for environments without `/dev/net/tun`, a private raw TCP Serve forwarder, and stdin/stdout TCP connections with `tailscale nc`. This design uses those capabilities on Render's native Node Linux runtime and downloads reviewed static binaries without a privileged installer. It is a compatible design, not a claim of a successful Render deployment. Actual outbound connectivity, node approval, memory limits, ACLs and the Windows tunnel must be verified on the assigned Render service.

Do not use Tailscale Funnel, public MySQL DNS, public port 3306, an unrestricted router forwarding rule, or a plain HTTP tunnel URL as `DB_HOST`. An HTTP proxy environment variable alone does not make mysql2 use Tailscale.

## Manual Windows setup

1. Make a normal backup of the existing XAMPP database through phpMyAdmin. Keep the database where it is. Do not run seed or database-reset scripts.
2. Install Tailscale from its official Windows installer and sign into the tailnet you will use for Render. Enable unattended operation and verify it starts after a Windows restart/sign-out.
3. Before sharing the service, apply the restrictive tailnet policy below. Tag this Windows device `tag:poultry-db` in the Tailscale admin console. Create a **reusable, ephemeral, pre-authorized** auth key tagged `tag:poultry-render` for the Render process. A single-use key will fail on redeployment because this configuration uses ephemeral in-memory state. Store the key only in Render secrets, rotate it before expiry, and monitor device approval/key expiry. If tailnet policy prohibits reusable keys, provision your organization's approved OAuth/workload identity approach before deploying; this script currently expects an auth key.
4. Inspect `C:/xampp/mysql/bin/my.ini`. Observed configuration: port `3306`, commented bind-address lines, networking enabled; the running server reported an unrestricted bind address. Under **[mysqld]**, set `bind-address=127.0.0.1` and leave networking enabled. Restart MySQL through XAMPP. Do not edit port/datadir or recreate the database. If another local application requires LAN access, assess that dependency before changing the binding.
5. Run `backend/scripts/production-user.sql.example` manually in local phpMyAdmin after replacing its password placeholders and confirming the existing database name. It creates `poultrypro_app` for localhost and 127.0.0.1, with database-scoped SELECT/INSERT/UPDATE/DELETE/CREATE/ALTER/INDEX/REFERENCES. The existing automatic schema initializers require the DDL privileges. It grants no global administration, DROP or GRANT OPTION. If that user already exists, inspect its grants before updating it; do not bypass errors with ALL PRIVILEGES.
6. In PowerShell, start the private TCP forwarder:

```powershell
& 'C:/Program Files/Tailscale/tailscale.exe' serve --bg --tcp=13306 tcp://127.0.0.1:3306
& 'C:/Program Files/Tailscale/tailscale.exe' serve status
& 'C:/Program Files/Tailscale/tailscale.exe' ip -4
```

Use the actual printed Windows 100.x address as `TS_DB_HOST`. MySQL sees the forwarder's local connection, so the MySQL user is restricted to localhost/127.0.0.1 rather than `%` or Render public IPs. Serve stays private to the tailnet. Do not turn on Funnel.

7. Check `Get-NetTCPConnection -LocalPort 3306 -State Listen` after restart: MySQL should listen on 127.0.0.1 only. Do not create public inbound firewall rules for 3306/13306. Keep XAMPP, Tailscale and Windows online and prevent sleep while serving the farm.

### Tailnet policy

Merge this with your existing policy carefully, using the real administrator identity if `autogroup:admin` is unsuitable. **Remove or narrow any existing allow-all rules that also grant access to these nodes**: Tailscale allow rules are additive. Merely adding this block beside an allow-all rule does not restrict access.

```json
{
  "tagOwners": {
    "tag:poultry-db": ["autogroup:admin"],
    "tag:poultry-render": ["autogroup:admin"]
  },
  "grants": [
    {
      "src": ["tag:poultry-render"],
      "dst": ["tag:poultry-db"],
      "ip": ["tcp:13306"]
    }
  ]
}
```

Validate this in the Tailscale policy editor. Verify an authorized Render node can reach port 13306, and an unapproved node cannot. Port 3306 on the Windows tailnet address must not be granted. Tagging the Render auth key establishes its identity; do not use an untagged broadly privileged key.

## Manual backend repository setup

The inspected repository `adebaraahmad16/Poultrypro-backend` currently has backend files at its root but imports `../../shared/...`, which is missing. It also tracks `.env`, `node_modules`, and server logs. Its tracked `.env` contains JWT/admin secrets. Rotate the exposed JWT secret and admin password/hash before production use; deleting the current file does not remove it from Git history. Plan history cleanup with the repository owner without overwriting other work.

Prepare the corrected layout from the Poultry-Pro workspace:

```powershell
node scripts/prepare-render-backend.mjs
```

The command prints a unique directory under `deployment/`. Review its contents and publish them to a clean branch in **adebaraahmad16/Poultrypro-backend** with this root layout:

```text
backend/package.json
backend/server.js
backend/config/
backend/routes/
backend/services/
backend/scripts/
shared/
render.yaml
.gitignore
README.md
```

For a reviewed manual publish, clone the backend repository into a separate folder and create a branch, then copy the generated package contents into that clone while preserving its `.git` directory:

```powershell
git clone https://github.com/adebaraahmad16/Poultrypro-backend.git Poultrypro-backend-render
cd Poultrypro-backend-render
git switch -c render-xampp
# Copy the generated package contents here, including its .gitignore.
git rm -r --cached --ignore-unmatch node_modules .env server.log server-error.log
git add backend shared render.yaml .gitignore README.md
git diff --cached --stat
git commit -m "Prepare private XAMPP connection for Render"
git push -u origin render-xampp
```

The `git rm --cached` command removes only those named paths from the new branch index, retaining local files. It does not erase exposed history; credential rotation remains required. Review the staged changes before committing. No branch or remote files were changed by this session.

Use that branch in Render. Do not copy the actual `.env`, node_modules, logs, XAMPP data directory or frontend database records. Keep Root Directory **empty**, not `backend`, because `shared/` must remain available. The export was prepared locally; it has not been pushed to GitHub in this session.

## Manual Render setup

Create a Blueprint/Web Service from the corrected backend branch. Use Node.js runtime (no Docker). The Blueprint specifies:

```text
Build: npm ci --prefix backend --omit=dev && node backend/scripts/install-tailscale.mjs
Start: npm --prefix backend run start:render
Health check: /health
```

Do not set HTTP `PORT`; Render supplies it. Set these service environment values, all backend-only:

| Variable | Value |
| --- | --- |
| NODE_ENV | production |
| NODE_VERSION | 22 |
| FRONTEND_URL | https://poultry-pro-pi.vercel.app |
| DB_HOST | 127.0.0.1 (the Render-local bridge, not Windows localhost) |
| DB_PORT | 13306 |
| DB_NAME | the unchanged existing XAMPP database name |
| DB_USER | poultrypro_app |
| DB_PASSWORD | the new dedicated account password |
| DB_SSL | false for this private tunnel setup |
| TS_AUTHKEY | tagged reusable ephemeral Render auth key |
| TS_DB_HOST | actual Windows Tailscale 100.x address |
| TS_DB_PORT | 13306, the Windows private Serve port |
| TS_VERSION | 1.104.1, verified in the official stable package index during implementation |
| JWT_SECRET | new strong secret; rotate the previously tracked value |
| ADMIN_EMAIL | actual admin email |
| ADMIN_PASSWORD_HASH | bcrypt hash for the new admin password |
| PAYSTACK_SECRET_KEY | existing payment secret, only if checkout is needed |

`DB_SSL=false` does not expose remote traffic unencrypted: the entire remote TCP hop is encrypted/authenticated by Tailscale. The hops outside the tunnel are local loopback connections. Keep optional verified MySQL TLS enabled only if you separately provision valid certificates; do not disable certificate verification to make TLS work.

The Blueprint uses Render's free compute tier, unrelated to PoultryPro's paid subscription plans. Free service sleep/restarts recreate the ephemeral tailnet node and require a still-valid reusable auth key. Monitor memory use with both Node and tailscaled. If the service cannot download/run binaries, spawn processes, contact Tailscale control/relay endpoints, satisfy your tailnet policy, or fit memory limits, this deployment is not viable on that configuration. Do not switch to a direct public MySQL connection as a workaround.

## Verification before declaring deployment complete

1. On Render, confirm Tailscale authentication and node authorization, bridge startup, and API startup on the assigned HTTP port. Never print secrets in logs.
2. `GET <actual-render-url>/health` must return 200. This proves only the API process is alive.
3. `GET <actual-render-url>/health/ready` must return 200 with `database: connected`. A 503 means Windows/XAMPP/the tunnel/credentials remain unavailable.
4. From the Render service shell run `npm --prefix backend run db:check`. This reads account identity and required table names without modifying records. The deployment currently keeps its Tailscale socket private to the supervisor, while MySQL is available through the local 13306 bridge to this command.
5. Verify `GET /api/subscription/plans`, then real admin login and farmer login with existing accounts. Verify an unauthenticated admin request gets 401 and a farmer token gets 403 on admin routes.
6. Create a clearly identified test farm/account if permitted, test daily feed/mortality/health/finance records and corrections there, and confirm existing farms/subscriptions remain unchanged. Do not write test transactions into real flocks without the farmer's authorization.
7. Temporarily stop only the Windows Serve forwarder using `tailscale serve --tcp=13306 off`. Verify readiness and data APIs return 503, the frontend shows the connectivity error, and failed saves do not fabricate records. Restore the same Serve command and retry reads. Do not automatically replay an uncertain write; inspect history first.
8. Test from an unauthorized tailnet node: TCP 13306 must be denied. Confirm no router forwarding or public MySQL listener exists.

## Manual Vercel setup

Retrieve the actual assigned Render URL after creation. Set `VITE_API_BASE_URL=<actual-render-url>/api` in the existing Vercel project's Production environment and redeploy. The frontend uses this shared API configuration; no database credentials or Tailscale key belong in React. Verify farmer/admin login, registration, farm/flock selection, daily records, feed, mortality, health, finances and subscriptions on the real site. Direct admin entry also needs the existing `vercel.json` fix deployed.

## Availability and implemented validation

Windows, XAMPP, the internet connection, Tailscale, the Render node and its credentials must stay available. If any is offline, database-dependent operations are unavailable. Connection pooling replaces failed connections when connectivity returns, but does not create availability while the computer is offline or asleep. No cloud database replica or migration is configured.

Local checks use disposable test schemas or read-only access to the existing database. They cover original records/subscriptions, transaction corrections, safe 503 errors during a simulated outage, prevention of frontend fallback saves, and real MySQL byte streams through a loopback bridge with a **simulated CLI transport**. That simulation does not authenticate to Tailscale or prove a Render-to-XAMPP link. Production networking and deployment are not yet verified. Validation completed locally: 59 daily-record checks, 56 subscription/auth checks, 30 poultry-scope checks, frontend error/config/session tests, and TCP transport/outage checks. A read-only comparison confirmed unchanged row counts across all 26 existing XAMPP tables.

Run from the workspace root:

```text
node --test src/services/__tests__/backendAvailability.test.js src/services/__tests__/sessionService.test.js src/services/__tests__/productionConfiguration.test.js
npm run build
```

Run from `backend`:

```text
node tests/xamppDeployment.integration.test.js
node tests/dailyRecords.integration.test.js
node tests/subscriptions.integration.test.js
node tests/poultryScope.integration.test.js --browser --preview
```

References: [Tailscale userspace networking](https://tailscale.com/docs/concepts/userspace-networking), [Tailscale private TCP Serve](https://tailscale.com/docs/reference/tailscale-cli/serve), [Tailscale nc](https://tailscale.com/docs/reference/tailscale-cli#nc), [Windows installation](https://tailscale.com/docs/install/windows), [Render native runtimes](https://render.com/docs/native-runtimes), [Render Blueprint configuration](https://render.com/docs/blueprint-spec).
