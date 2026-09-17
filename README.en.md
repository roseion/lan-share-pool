# LAN Share Pool — Visual File Wall

Turn any shared folder on your NAS or server into a **visual file wall** that every device on your LAN can open instantly: automatic categorization, thumbnail previews, per-file notes synced across devices, and manual grouping.

- **Backend:** Node.js (**zero npm dependencies**, uses the built-in `node:sqlite`)
- **Frontend:** single-file HTML (no build step)
- **Deploy:** one command, or ship it as a Docker image

> 中文说明见 [README.md](README.md)

---

## Features

- **Single entry point** — one URL for phone, desktop and tablet, no login required
- **Automatic categories** — image / video / document / code / archive / software / other
- **Thumbnail wall** — inline preview for images and videos, icons for the rest
- **Per-file notes** — open a card and write; persisted in SQLite, visible on every device
- **Grouping** — create groups and **batch-select** cards to add many files at once
- **Search, drag-to-sort, dark mode, sticky-note wall**
- **Upload** — push files into the shared folder straight from the browser
- **Rescan** — re-index the disk and prune metadata of deleted files

---

## Requirements

- **Node.js ≥ 22.5.0** (uses the built-in `node:sqlite` module)

```bash
node -v
```

---

## Quick Start

```bash
git clone https://github.com/roseion/lan-share-pool.git
cd lan-share-pool
npm start
```

After starting:

- Listening on `http://0.0.0.0:8081`
- Default shared folder: the repo's `shared/` directory

Open `http://<your-ip>:8081` in a browser.

---

## Configuration

On first run a `config.json` is created in the project root:

```json
{
  "port": 8081,
  "shareFolders": ["/absolute/path/to/share"]
}
```

You can also add or remove shared folders from the in-app **Settings** panel; changes take effect immediately.

### Environment variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Listening port | `8081` |
| `CONFIG_PATH` | Path to config file | `<root>/config.json` |
| `DB_PATH` | SQLite database path | `<root>/data/sidecar.db` |

---

## REST API Overview

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check + scan summary |
| `GET` / `PUT` | `/api/config` | Read / save config (port, shared folders) |
| `GET` | `/api/files?q=` | File list (search by name / note) |
| `POST` | `/api/refresh` | Rescan shared folders |
| `GET` / `PATCH` | `/api/meta/:id` | Read / update a file's note |
| `GET` / `POST` | `/api/notes` | List / create sticky notes |
| `PATCH` / `DELETE` | `/api/notes/:id` | Update / delete a sticky note |
| `GET` / `POST` | `/api/groups` | List / create groups |
| `PATCH` / `DELETE` | `/api/groups/:id` | Update / delete a group |
| `POST` | `/api/upload` | Upload a file (`X-File-Name` header carries the name) |
| `GET` | `/files/:path` | Preview / download (HTTP Range supported for video seeking) |

---

## Testing

```bash
npm test                          # backend API + scanner unit tests
node test/verify-frontend.cjs     # frontend wiring & syntax checks
```

---

## Deploying to a NAS / Server

### Option 1: Run Node directly

Works anywhere Node ≥ 22.5 is available. For older-glibc NAS boxes (e.g. some Synology models), use the community `glibc-217` build of Node.

```bash
node server/server.js
```

For long-running use, a systemd unit on Linux:

```ini
[Unit]
Description=LAN Share Pool
After=network.target

[Service]
Type=simple
WorkingDirectory=/path/to/lan-share-pool
ExecStart=/path/to/node /path/to/lan-share-pool/server/server.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

### Option 2: Docker

```bash
docker build -t lan-share-pool .
docker run -d --name lan-share-pool \
  -p 8081:8081 \
  -v /path/to/your/share:/app/shared \
  -v /path/to/data:/app/data \
  --restart unless-stopped \
  lan-share-pool
```

> The bundled `shared/` folder is only a sample share. Mount your own directory in production. The app is **non-intrusive**: it never modifies your files or writes anything into the shared folders — all metadata lives in a separate SQLite database.

---

## Project Layout

```
.
├── server/             # backend (zero dependencies)
│   ├── server.js       # HTTP server & routing
│   ├── scanner.js      # directory scan & categorization
│   ├── db.js           # node:sqlite wrapper
│   └── config.js       # config load/save
├── public/
│   └── index.html      # single-file frontend app
├── test/               # tests
├── demo/               # early Vue 3 + Vite exploration (incl. a single-file demo)
├── shared/             # sample share folder (runtime data, git-ignored)
└── PRODUCT_DESIGN.md   # product design document (Chinese)
```

---

## License

[MIT](LICENSE)
