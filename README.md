# 局域网共享文件池可视化系统

把 NAS / 服务器上的一个共享文件夹，变成局域网内**任何设备打开即用**的可视化文件墙：自动按类型分类、缩略图预览、可给文件写备注并跨设备同步、支持手动分组。

- 后端：Node.js（**零 npm 依赖**，SQLite 用 Node 内置 `node:sqlite`）
- 前端：单文件 HTML（无需构建）
- 部署：一条命令，或打包成 Docker 镜像

> English version: [README.en.md](README.en.md)

---

## 特性

- **单入口直达**：一个地址，手机 / 电脑 / 平板通用，无需登录
- **自动分类**：图片 / 视频 / 文档 / 代码 / 压缩包 / 软件 / 其他
- **缩略图墙**：图片、视频直接预览，其它类型显示图标
- **文件备注**：点开即写，SQLite 持久化，换设备仍在
- **分组管理**：手动分组，卡片可**批量选择**一次性加入分组
- **搜索 / 拖拽排序 / 深色模式 / 便利贴留言板**
- **上传**：从浏览器把文件传进共享目录
- **实时刷新**：重新扫描磁盘，清理已消失文件的元数据

---

## 环境要求

- **Node.js ≥ 22.5.0**（依赖内置 `node:sqlite` 模块）

检查版本：

```bash
node -v
```

---

## 快速开始

```bash
git clone https://github.com/roseion/lan-share-pool.git
cd lan-share-pool
npm start
```

启动后：

- 监听地址：`http://0.0.0.0:8081`
- 默认共享目录：仓库内的 `shared/` 文件夹

在浏览器打开 `http://<本机IP>:8081` 即可。

---

## 配置

首次运行会在项目根目录生成 `config.json`：

```json
{
  "port": 8081,
  "shareFolders": ["/absolute/path/to/share"]
}
```

也可以直接在界面右上角「设置」里增删共享文件夹，保存后立即生效。

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `PORT` | 监听端口 | `8081` |
| `CONFIG_PATH` | 配置文件路径 | `<项目根>/config.json` |
| `DB_PATH` | SQLite 数据库路径 | `<项目根>/data/sidecar.db` |

---

## REST API 概览

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/health` | 健康检查 + 扫描概览 |
| `GET` / `PUT` | `/api/config` | 读取 / 保存配置（端口、共享目录） |
| `GET` | `/api/files?q=` | 文件列表（可按名称/备注搜索） |
| `POST` | `/api/refresh` | 重新扫描共享目录 |
| `GET` / `PATCH` | `/api/meta/:id` | 读取 / 更新文件备注 |
| `GET` / `POST` | `/api/notes` | 便利贴列表 / 新建 |
| `PATCH` / `DELETE` | `/api/notes/:id` | 修改 / 删除便利贴 |
| `GET` / `POST` | `/api/groups` | 分组列表 / 新建 |
| `PATCH` / `DELETE` | `/api/groups/:id` | 修改 / 删除分组 |
| `POST` | `/api/upload` | 上传文件（请求头 `X-File-Name` 指定文件名） |
| `GET` | `/files/:path` | 预览 / 下载（支持 HTTP Range，可拖动播放视频） |

---

## 测试

```bash
npm test                          # 后端 API + 扫描器单元测试
node test/verify-frontend.cjs     # 前端接线与语法校验
```

---

## 部署到 NAS / 服务器

### 方式一：直接跑 Node

适用于已有 Node ≥ 22.5 的设备；群晖等 glibc 较旧的 NAS 可用官方社区的 `glibc-217` 构建版本。

```bash
# 项目目录内
node server/server.js
```

长期运行可用 systemd（Linux）：

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

### 方式二：Docker

```bash
docker build -t lan-share-pool .
docker run -d --name lan-share-pool \
  -p 8081:8081 \
  -v /path/to/your/share:/app/shared \
  -v /path/to/data:/app/data \
  --restart unless-stopped \
  lan-share-pool
```

> 说明：仓库内的 `shared/` 仅作示例共享目录；实际使用时把它挂载成你自己的目录即可，程序**零侵入**——不改动、不在源目录里生成任何文件，所有元数据都写进独立的 SQLite。

---

## 目录结构

```
.
├── server/             # 后端（零依赖）
│   ├── server.js       # HTTP 服务与路由
│   ├── scanner.js      # 目录扫描与分类
│   ├── db.js           # node:sqlite 封装
│   └── config.js       # 配置读写
├── public/
│   └── index.html      # 前端单文件应用
├── test/               # 测试
├── demo/               # 早期 Vue 3 + Vite 探索版（含单文件 demo，可忽略）
├── shared/             # 示例共享目录（运行时数据，不入库）
└── PRODUCT_DESIGN.md   # 产品设计文档
```

---

## License

[MIT](LICENSE)
