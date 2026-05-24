# global-token-saver 🚀

> **Bilingual:** [Tiếng Việt](#tiếng-việt) | [English](#english)

---

## Tiếng Việt

**global-token-saver** là công cụ dòng lệnh (CLI) chính thức của hệ sinh thái [AIPILOT.VN](https://aipilot.vn). Công cụ này giúp lưu trữ thông tin xác thực bảo mật và kích hoạt cơ chế nén Token thông minh cho các AI Agent (Cline, Cursor, Hermes) trên máy tính của bạn.

### 💡 Tính năng nổi bật
* **Thiết lập 3 giây:** Cấu hình nhanh chóng thông qua `npx`.
* **Đồng bộ hóa an toàn:** Kết nối mã hóa Client-Side với cụm máy chủ VPS Cloud Brain cục bộ.
* **Tiết kiệm đến 97% chi phí:** Giảm thiểu triệt để số lượng Token đầu vào gửi tới các mô hình AI lớn bằng cách loại bỏ mã nguồn trùng lặp và lặp vô hạn.

### 🛠️ Hướng dẫn cài đặt & sử dụng

Chạy lệnh khởi tạo trực tiếp trên Terminal của bạn:

```bash
npx global-token-saver init
```

Hệ thống sẽ yêu cầu bạn nhập khóa xác thực **AIPILOT.VN API Key** của bạn (truy cập [https://aipilot.vn](https://aipilot.vn) để lấy khóa miễn phí). Khi cấu hình hoàn tất, thông tin sẽ được lưu an toàn tại đường dẫn: `~/.config/global-ai-brain/config.json`.

### 🔌 Tích hợp MCP Server (Cursor & Cline)

Bạn có thể chạy `mcp_server.js` làm máy chủ Model Context Protocol (MCP) để AI Agent (như Cline hoặc Cursor) tự động gọi các công cụ tối ưu hóa token.

#### Cấu hình cho Cursor IDE:
1. Mở cài đặt **Settings** > **Features** > **MCP**.
2. Thêm mới một MCP Server:
   - **Name:** `aimemory-mcp-server`
   - **Type:** `command`
   - **Command:** `node /đường-dẫn-cục-bộ-của-bạn/global-token-saver/mcp_server.js`

#### Cấu hình cho Cline:
Thêm đoạn cấu hình sau vào tệp tin cấu hình MCP của bạn (`mcp_settings.json`):

```json
"mcpServers": {
  "aimemory-mcp-server": {
    "command": "node",
    "args": [
      "/đường-dẫn-cục-bộ-của-bạn/global-token-saver/mcp_server.js"
    ],
    "disabled": false,
    "alwaysAllow": []
  }
}
```

---

## English

**global-token-saver** is the official Command-Line Interface (CLI) tool for the [AIPILOT.VN](https://aipilot.vn) ecosystem. It securely registers and configures your local environment, activating smart token prunings for AI Agents like Cline, Cursor, and Hermes on your system.

### 💡 Key Features
* **3-Second Setup:** Instant configuration powered by `npx`.
* **Secure Sync:** Client-side encrypted handshakes connecting local systems with the high-performance VPS Cloud Brain substrate.
* **Save up to 97% Tokens:** Eradicates infinite AI agent loop costs and heavy context usage.

### 🛠️ Installation & Usage

Execute the following command directly in your terminal:

```bash
npx global-token-saver init
```

The system will prompt you for your **AIPILOT.VN API Key** (visit [https://aipilot.vn](https://aipilot.vn) to claim your free key). Once entered, configuration files are securely stored at: `~/.config/global-ai-brain/config.json`.

### 🔌 MCP Server Integration (Cursor & Cline)

You can run `mcp_server.js` as a native Model Context Protocol (MCP) server, enabling your AI agents (e.g. Cline, Cursor) to autonomously execute smart token savings and memory hydration.

#### Cursor IDE Configuration:
1. Open **Settings** > **Features** > **MCP**.
2. Click **+ Add New MCP Server**:
   - **Name:** `aimemory-mcp-server`
   - **Type:** `command`
   - **Command:** `node /your-absolute-local-path/global-token-saver/mcp_server.js`

#### Cline Configuration:
Append the following server block into your active MCP settings (`mcp_settings.json`):

```json
"mcpServers": {
  "aimemory-mcp-server": {
    "command": "node",
    "args": [
      "/your-absolute-local-path/global-token-saver/mcp_server.js"
    ],
    "disabled": false,
    "alwaysAllow": []
  }
}
```

---

⚡ Engineered for next-gen contextual prunings. Powered by **[AIPILOT.VN](https://aipilot.vn)**.
