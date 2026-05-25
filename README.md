# ⚡ AIPILOT: Persistent Failure Memory for AI Coding

> **VIETNAMESE VERSION BELOW / TIẾNG VIỆT BÊN DƯỚI**

AIPILOT is **the local-first memory layer that stops AI coding agents from repeating the same debugging mistakes**. 

Dedicated to the developer and Vibercode community, AIPILOT is a 100% free, open-source, offline-first workflow utility. It acts as a passive sidecar stream observer—capturing agent compilation/test failures, normalizes trace outputs into unique error signatures, and records the successful git diff patches that resolved them. 

When your AI agent (like Cline, OpenHands, AutoGPT) hits the same error, AIPILOT prints a non-authoritative recovery guidance hint to `stderr`, pointing the agent immediately to the historically successful fix and stopping it from wasting hours in trial-and-error debugging loops.

---

## How It Works (The Sidecar Model)

Unlike intrusive middleware that mutates stdin or modifies model weights, AIPILOT runs cleanly at the process boundaries:
1.  **Passive Observation**: Wraps process execution (`aipilot run -- [cmd]`), piping stdout/stderr in real-time with virtually zero overhead.
2.  **Failure Capture**: Logs exit codes $>0$ and traceback stack traces, creating normalized error signatures by stripping path prefixes and numbers.
3.  **Diff Mapping**: When subsequent build commands pass, it computes the unified `git diff` patch and maps it directly as the successful recovery solution for that error signature.
4.  **speculative Guidance**: If the signature recurrs, it alerts the agent via non-authoritative hints in `stderr`, showing the exact files and summaries that resolved the issue historically.

---

## Installation & Quickstart

Get up and running in 30 seconds:

```bash
# 1. Clone the repository
git clone https://github.com/tuoaoa/global-token-saver.git aipilot
cd aipilot

# 2. Install dependencies & link binary globally
npm install
npm link

# 3. Initialize local WAL SQLite database
aipilot init

# 4. Observe execution failure memories
aipilot run -- npm test
```

---

## Core CLI Commands

*   **`aipilot init`**: Silently initializes the SQLite database at `~/.config/global-ai-brain/local_brain.db` in high-performance Write-Ahead Logging (WAL) mode.
*   **`aipilot run -- [command]`**: Runs observed tasks, mapping stderr failures and git diff resolutions.
*   **`aipilot recall "[query]"`**: Searches the database for historical failures and mapped recovery files.
*   **`aipilot show [run_id]`**: Renders the complete raw traceback logs and side-by-side unified git patch diff.

---

# ⚡ AIPILOT: Trí Nhớ Lỗi Kéo Dài Cho AI Coding (Vietnamese Version)

AIPILOT là **lớp trí nhớ local giúp các AI coding agent không lặp lại cùng một sai lầm biên dịch/test**.

Được xây dựng dành riêng cho cộng đồng Developer và cộng đồng Vibercode Việt Nam, AIPILOT là một công cụ tiện ích mã nguồn mở miễn phí 100% và chạy hoàn toàn offline bảo mật. Công cụ đóng vai trò như một sidecar thụ động—chụp lại các vết lỗi traceback biên dịch, băm chúng thành signature đặc trưng, và tự động ánh xạ các thay đổi git diff đã sửa lỗi thành công trong quá khứ.

Khi AI Agent (như Cline, OpenHands, AutoGPT) gặp lại lỗi tương tự, AIPILOT sẽ xuất gợi ý cứu hộ trực tiếp vào luồng `stderr`, hướng Agent tới vùng code sửa lỗi thành công lịch sử, dập tắt ngay vòng lặp đoán mò tốn kém.

---

## Hướng Dẫn Sử Dụng Nhanh

Thiết lập nhanh trong 30 giây:

```bash
# 1. Tải repository về local máy
git clone https://github.com/tuoaoa/global-token-saver.git aipilot
cd aipilot

# 2. Cài đặt dependency & link lệnh chạy toàn cục
npm install
npm link

# 3. Khởi tạo cơ sở dữ liệu SQLite local
aipilot init

# 4. Trải nghiệm chạy test quan sát lỗi
aipilot run -- npm test
```

---

## 4 Lệnh Core Vận Hành

*   **`aipilot init`**: Khởi tạo âm thầm cơ sở dữ liệu SQLite tại `~/.config/global-ai-brain/local_brain.db` dưới cấu hình journal WAL tối ưu tốc độ.
*   **`aipilot run -- [lệnh]`**: Chạy bao bọc test/build, tự động lưu vết và ánh xạ git diff sửa thành công.
*   **`aipilot recall "[từ_khóa]"`**: Truy vấn nhanh các vết lỗi lịch sử để cung cấp gợi ý cứu hộ.
*   **`aipilot show [run_id]`**: Renders chi tiết traceback lỗi và hiển thị full diff sửa đổi của run tương ứng.

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.
