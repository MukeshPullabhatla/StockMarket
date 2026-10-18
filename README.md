# Stock Trend Dashboard

A live stock market dashboard with a built-in AI assistant. It tracks watchlisted
tickers and market movers in real time, and lets you ask a chatbot questions
about the market in plain English — the assistant fetches live data itself
before it answers, instead of relying on stale training knowledge.

## What it does

- **Live quotes & charts** — price, change, day high/low, and volume for any
  ticker, plus historical close-price history for trend charts.
- **Market movers** — top gainers, losers, and most-active stocks.
- **Watchlist** — add/remove symbols, persisted server-side.
- **Real-time updates** — a WebSocket connection pushes fresh quotes to the
  browser on a poll interval, so prices update without refreshing.
- **AI chat assistant** — ask things like *"how is AAPL doing today?"* or
  *"what are the top movers?"* and get an answer grounded in current data.

## Architecture

```
frontend/  React + TypeScript (Vite), recharts for charts
backend/   FastAPI (Python), yfinance for market data, SQLite-backed watchlist
```

- `backend/app/api/stocks.py` — REST endpoints for quotes, history, and movers.
- `backend/app/api/watchlist.py` — CRUD endpoints for the watchlist.
- `backend/app/api/ws.py` + `services/broadcaster.py` — WebSocket price feed;
  a background poll loop periodically re-fetches quotes for watched/mover
  symbols and broadcasts them to connected clients.
- `backend/app/services/market_data.py` — wraps `yfinance` for quotes,
  history, and screener-based movers.
- `backend/app/api/chat.py` + `services/chat_service.py` — the AI chat
  endpoint (see below).
- `backend/app/api/visits.py` + `services/visitor_store.py` — site visitor
  counter. Each visitor counts once per day (salted hash of IP + user agent,
  kept only for the current day; raw IPs are never stored; bots are skipped).
  The footer shows the total once it reaches `VISITOR_COUNT_MIN` in
  `frontend/src/siteConfig.ts`.
- `frontend/src/components/` — `Dashboard`, `Watchlist`, `MarketMovers`,
  `StockChart`, and `ChatPanel`, plus `Layout` (nav bar and footer).
- `frontend/src/pages/` — site pages, routed with `react-router`: Home (`/`),
  Stocks (`/stocks`), Contact (`/contact`); the dashboard lives at
  `/stocks/dashboard`. Name, email and links are set in
  `frontend/src/siteConfig.ts`.

## How the LLM/AI integration works

The chat assistant lives in [backend/app/services/chat_service.py](backend/app/services/chat_service.py) and is
powered by an LLM through the **Groq API** (`AsyncGroq`, model configured via
`GROQ_MODEL`, e.g. `openai/gpt-oss-120b`).

The key design point: **the model is not trusted to know current prices**.
Its system prompt explicitly tells it that any price/trend data from training
is stale, and that it must call a tool to fetch live numbers before answering.
This is the same tool-calling ("function calling") pattern used by most
LLM-powered agents:

1. The frontend (`ChatPanel.tsx`) sends the full conversation to
   `POST /api/chat`.
2. The backend calls the Groq chat-completions API with three tool
   definitions the model can invoke:
   - `get_quote(symbols)` — live price/change for one or more tickers.
   - `get_history_summary(symbol, period)` — recent closing prices for a
     trend description.
   - `get_movers(category)` — current top gainers/losers/most-active.
3. If the model decides it needs data, it returns a `tool_calls` response
   instead of text. The backend executes the requested tool(s) against
   `services/market_data.py` (which hits `yfinance`), feeds the results back
   into the conversation as `tool` messages, and asks the model again — up
   to `MAX_TOOL_ROUNDS` (5) rounds.
4. Once the model has what it needs, it streams a plain-text answer back to
   the client over Server-Sent Events (`text/event-stream`), along with
   `tool` events (so the UI can show "Looking up quote…") and a final `done`
   event.

So the LLM acts as a reasoning/orchestration layer on top of the app's own
market-data service — it decides *which* data it needs and *when*, but every
number it cites comes from a live tool call, not from the model itself.

## Running locally

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Configuration

Copy `.env.example` to `.env` and set:

| Variable | Description |
|---|---|
| `GROQ_API_KEY` | API key for Groq (required for the chat assistant to work). |
| `GROQ_MODEL` | Groq model id to use (default: `openai/gpt-oss-120b`). |
| `POLL_INTERVAL_SECONDS` | How often the backend polls live prices for the WebSocket feed. |
| `CHAT_LIMIT_PER_HOUR` / `CHAT_LIMIT_PER_DAY` | AI chat messages allowed per visitor (default 15 / 50). |
| `CHAT_LIMIT_SITE_PER_DAY` | AI chat messages allowed for the whole site per day, protecting the Groq quota (default 500). |
| `ADMIN_KEY` | Secret needed to change the shared default watchlist (sent as an `X-Admin-Key` header). Leave empty to disable edits. |

### Abuse protection

- **AI chat** is rate-limited per visitor IP and site-wide (limits above; a
  blocked visitor sees a friendly "try again in N minutes" message). Messages
  are capped at 1,000 characters and only the last 20 messages of history are
  sent to the model.
- **Watchlists are personal**: each visitor's list is stored in their own
  browser (`localStorage`), seeded from the shared default list on first
  visit. Only the site owner can change that default list:

  ```bash
  curl -X POST https://<your-site>/api/watchlist -H "X-Admin-Key: <ADMIN_KEY>" \
    -H "Content-Type: application/json" -d '{"symbol": "MSFT"}'
  curl -X DELETE https://<your-site>/api/watchlist/MSFT -H "X-Admin-Key: <ADMIN_KEY>"
  ```
- **Market data is cached** server-side and shared across visitors (quotes
  15s, movers 60s, chart history 5 min, company names 1 day), so traffic
  spikes don't get the server throttled by Yahoo Finance. Quote requests are
  capped at 25 symbols.

Without `GROQ_API_KEY`, the rest of the dashboard (quotes, charts, watchlist,
movers) still works — only the chat assistant is disabled.

### Docker

```bash
docker compose up --build
```

Runs the backend and frontend (served via nginx) together, using `.env` for
backend configuration. `docker-compose.yml` maps the frontend to host port
`80` (`http://localhost`); change the `ports:` line under `frontend` to
`"3000:80"` instead if you'd rather use `http://localhost:3000` locally.

## Deploying for free (Oracle Cloud "Always Free" tier)

This walks through hosting the app on a VM that's free forever (not a trial),
reachable from any browser over plain HTTP, using the `docker-compose.yml` in
this repo almost unchanged. It assumes you don't own a domain — you'll access
the app via the VM's public IP address. Step 11 then optionally adds a free
domain name (DuckDNS) and HTTPS.

Total cost: $0/month, using Oracle Cloud Infrastructure's (OCI) Always Free
tier (an Ampere A1 ARM VM with 1-4 OCPUs / 6-24GB RAM, free forever).

### 1. Create an Oracle Cloud account

1. Go to [oracle.com/cloud/free](https://www.oracle.com/cloud/free/) and sign
   up. It asks for a credit/debit card for identity verification — you are
   **not charged** unless you explicitly upgrade out of the free tier.
2. Pick a **Cloud account name** (aka tenancy name): lowercase letters,
   numbers, and hyphens only, must be globally unique across all Oracle Cloud
   customers. It becomes part of your console login URL and can't be changed
   later, but has no bearing on the app itself — any unique string works
   (e.g. `yourname-stockdash`).

### 2. Create a Virtual Cloud Network (VCN) with internet access

Don't use the "create new VCN" shortcut buried inside the instance-creation
wizard — in testing, it silently created a subnet without an internet
gateway, which permanently disabled the "assign a public IP" option with no
clear error. Create the network on its own first, via the proper wizard:

1. **☰ Menu → Networking → Virtual Cloud Networks → Start VCN Wizard**.
2. Choose **Create VCN with Internet Connectivity** → **Start VCN Wizard**.
3. Give it a name (e.g. `stock-dashboard-vcn`), leave all other fields at
   their defaults, click **Next**, then **Create**.
4. This provisions, automatically: a VCN, a **public subnet** (with an
   **Internet Gateway** attached) and a private subnet (with a NAT gateway,
   which you won't need), plus default security lists and route tables.

### 3. Create the compute instance

1. **☰ Menu → Compute → Instances → Create Instance**.
2. **Name**: anything, e.g. `stock-dashboard`.
3. **Image and shape** → click **Edit**:
   - Image: **Canonical Ubuntu 22.04**.
   - Shape: click **Change shape**, select **Ampere** → **VM.Standard.A1.Flex**
     (marked "Always Free-eligible"; 1 OCPU / 6GB RAM is plenty for this app).
4. **Networking**:
   - Primary network: **Select existing virtual cloud network** → the VCN
     created in step 2.
   - Subnet: the **public** subnet from that VCN (named like
     `public subnet-stock-dashboard-vcn`).
   - Under **Public IPv4 address assignment**, make sure
     **Automatically assign public IPv4 address** is checked. (This is only
     selectable because the VCN has a real public subnet — see step 2.)
   - Leave private IPv4 and IPv6 assignment at their defaults.
5. **Add SSH keys**: choose **Generate a key pair for me**, then click
   **Download private key** immediately — it's shown only once. Save it
   somewhere findable (e.g. `~/Downloads/ssh-key-<date>.key`).
6. **Storage**: leave the boot volume and all other options at their
   defaults — the default ~47GB boot volume is plenty.
7. Review the summary — confirm **Networking → Public IPv4 address: Yes** —
   then click **Create**.

**If you hit `Out of capacity for shape VM.Standard.A1.Flex in availability
domain AD-x`**: this is common — the free Ampere shape is popular and
capacity is limited per region/availability domain (AD). Fixes, in order:
- Edit the instance and try a different availability domain (AD-1, AD-2,
  AD-3) — capacity is tracked separately per AD.
- Just retry every 10-15 minutes; capacity frees up as other free-tier VMs
  get terminated.
- As a fallback, use shape **VM.Standard.E2.1.Micro** instead (also Always
  Free, AMD-based, smaller but workable for this app).

Once the instance state shows **Running**, open it and copy its
**Public IP address** (shown under Instance details / Primary VNIC).

### 4. Open the firewall at the cloud network level

A fresh VCN's default security list only allows inbound SSH (port 22). Add
rules to let web traffic in:

1. **☰ Menu → Networking → Virtual Cloud Networks → `stock-dashboard-vcn`
   → Security Lists → default security list**.
2. Click **Add Ingress Rules**, and add two rules (use **+ Another Ingress
   Rule** for the second):
   - Source CIDR `0.0.0.0/0`, IP Protocol **TCP**, Destination Port Range `80`
   - Source CIDR `0.0.0.0/0`, IP Protocol **TCP**, Destination Port Range `443`
3. Click **Add Ingress Rules** to save. Confirm the list now shows both new
   rules (ports 80 and 443) alongside the existing SSH rule.

### 5. Connect via SSH

```bash
chmod 600 /path/to/ssh-key-<date>.key   # Linux/macOS/Git Bash; skip on plain Windows cmd
ssh -i /path/to/ssh-key-<date>.key ubuntu@<PUBLIC_IP>
```

The default username on Oracle's Ubuntu images is `ubuntu`.

### 6. Install Docker on the VM

Run on the VM (over the SSH session from step 5):

```bash
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker ubuntu   # lets you drop `sudo` from docker commands after re-logging in
```

### 7. Open the firewall at the OS level

Oracle's Ubuntu images ship with `iptables` rules that reject everything
except SSH and ICMP — independent of the cloud-level security list from step
4. Both layers must allow port 80/443, or connections just hang (time out
rather than being actively refused, which is the tell that this is the
culprit). On the VM:

```bash
sudo iptables -L INPUT -n --line-numbers   # find the line number of the REJECT rule at the bottom
sudo iptables -I INPUT <line-before-reject> -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT <line-before-reject+1> -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save   # persist across reboots; if missing:
# sudo DEBIAN_FRONTEND=noninteractive apt-get install -y iptables-persistent && sudo netfilter-persistent save
```

### 8. Deploy the app

Still on the VM:

```bash
git clone https://github.com/<your-username>/StockMarket.git ~/StockMarket
```

Copy your `.env` (with `GROQ_API_KEY` etc.) onto the server — don't commit it
to git. From your **local machine**:

```bash
scp -i /path/to/ssh-key-<date>.key .env ubuntu@<PUBLIC_IP>:~/StockMarket/.env
```

Then, back on the VM:

```bash
cd ~/StockMarket
sudo docker compose up -d --build
```

This builds both images and starts the containers in the background.
`restart: unless-stopped` in `docker-compose.yml` means they come back up
automatically after a VM reboot.

### 9. Verify it's reachable

From your local machine:

```bash
curl -I http://<PUBLIC_IP>/
```

A `200 OK` means you're done — open `http://<PUBLIC_IP>` in any browser.

If it hangs/times out instead of connecting:
- Re-check step 4 (cloud security list) — this is the most common miss.
- Re-check step 7 (VM-level iptables).
- SSH in and run `curl -I http://localhost/` and `sudo docker ps` on the VM
  itself — if that works locally but not externally, it's a firewall layer
  (steps 4 or 7), not the app.

### 10. Updating the app later

After pushing new code to GitHub:

```bash
ssh -i /path/to/ssh-key-<date>.key ubuntu@<PUBLIC_IP> \
  "cd ~/StockMarket && git pull && sudo docker compose up -d --build"
```

### Known limitations of this setup

- **HTTP only, no padlock** — unless you follow step 11 below to add a free
  domain name and HTTPS.
- **Single VM, no horizontal scaling.** Fine for personal/low-traffic use;
  not meant for production-scale traffic.
- **SQLite on local disk.** The watchlist database lives in a Docker volume
  on this one VM — there's no automatic off-box backup.

### 11. Optional: free domain name + HTTPS (DuckDNS + Caddy)

This gives the app a real address like `https://mukeshkp.duckdns.org` with a
padlock, still for $0. [DuckDNS](https://www.duckdns.org) provides the free
hostname; [Caddy](https://caddyserver.com) (added by
`docker-compose.https.yml`) gets and renews a Let's Encrypt certificate for it
automatically and redirects `http://` to `https://`.

**a. Keep the VM's IP from changing (recommended).** The auto-assigned public
IP is *ephemeral* — it can change if the instance is stopped. OCI can't
convert an ephemeral IP to a reserved one, so you swap it for a new reserved
IP (free; the app will be unreachable for about a minute):

1. Open the instance → **Networking** tab → under **Attached VNICs**, click
   the VNIC name (e.g. `stock-dashboard` *Primary VNIC*).
2. On the VNIC page, open the **IP administration** tab (older consoles:
   **IPv4 Addresses** under *Resources*).
3. On the row for the private IP (e.g. `10.0.0.x`), click **⋮ → Edit**.
4. Under **Public IP type**, choose **No public IP** → **Update**. This
   releases the old ephemeral IP.
5. **⋮ → Edit** on the same row again → **Reserved public IP** → **Create
   new reserved IP**, give it a name (e.g. `stock-dashboard-ip`) → **Update**.

Note the new public IP — it's now permanent, even across stop/start. It will
be different from the old one, so use it in your SSH commands and in step b.

**b. Create the DuckDNS subdomain.**
1. Go to [duckdns.org](https://www.duckdns.org) and sign in (GitHub/Google).
2. Type a name (e.g. `mukeshkp`) in **sub domain** → **add domain**.
3. In the **current ip** box next to it, enter the VM's public IP →
   **update ip**.
4. Copy your **token** from the top of the page — keep it secret.

Check it from your local machine (may take a minute):

```bash
nslookup mukeshkp.duckdns.org   # should print the VM's public IP
```

**c. Keep DuckDNS pointed at the VM.** DuckDNS can drop subdomains that
never get updated, and this also fixes things automatically if the IP ever
changes. On the VM, add a cron job that refreshes it every 5 minutes:

```bash
(crontab -l 2>/dev/null; echo '*/5 * * * * curl -s "https://www.duckdns.org/update?domains=mukeshkp&token=YOUR_TOKEN&ip=" -o ~/duckdns.log') | crontab -
```

(Replace `mukeshkp` and `YOUR_TOKEN`. `cat ~/duckdns.log` should say `OK`
after 5 minutes.)

**d. Make sure port 443 is open** — both the OCI security list (step 4) and
iptables (step 7) must allow TCP 443 as well as 80. Caddy needs port 80 too,
to prove domain ownership to Let's Encrypt.

**e. Start the app with HTTPS.** On the VM, add your hostname to `.env`:

```bash
cd ~/StockMarket
echo "DOMAIN=mukeshkp.duckdns.org" >> .env
sudo docker compose down
sudo docker compose -f docker-compose.yml -f docker-compose.https.yml up -d --build
sudo docker compose -f docker-compose.yml -f docker-compose.https.yml logs -f caddy   # watch for "certificate obtained successfully", then Ctrl+C
```

Open `https://mukeshkp.duckdns.org`. From now on, use both `-f` files when
updating (step 10):

```bash
ssh -i /path/to/ssh-key-<date>.key ubuntu@<PUBLIC_IP> \
  "cd ~/StockMarket && git pull && sudo docker compose -f docker-compose.yml -f docker-compose.https.yml up -d --build"
```

If the certificate fails, it's almost always one of: the DuckDNS name doesn't
resolve to the VM's IP yet (re-check **b**), or port 80/443 is blocked
(re-check **d**). Caddy retries automatically once fixed.

Switching to a paid domain later (e.g. `mukeshkp.dev`) is the same process:
add an **A record** for it pointing at the VM's IP at your registrar, change
`DOMAIN` in `.env`, and re-run the `up` command — Caddy issues a certificate
for the new name automatically.