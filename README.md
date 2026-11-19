# Đập Chuột

Mini game phản xạ chạy trên trình duyệt: lưới 3×3, mỗi lượt 30 giây, đập trúng được 1 điểm.

Repo có ba bản game:

| Bản | Thư mục | Chơi online |
|---|---|---|
| Game gốc | `app/` | — |
| Poodle Bão tuyết | `app-poodle/` | https://thanhmeeo.github.io/moemoe/app-poodle/ |
| Đập Noel · Giáng sinh (Martin +3, Xuka +1, Mina −2) | `app-noel/` | https://thanhmeeo.github.io/moemoe/app-noel/ |

## Cấu trúc

| Thư mục / file | Nội dung |
|---|---|
| `YEU-CAU.md` | Yêu cầu ban đầu |
| `design/` | Design system: `tokens.css`, trang xem trước `design-system.html` |
| `docs/` | Tài liệu: tổng quan, chức năng, màn hình, quy tắc & dữ liệu, kế hoạch test |
| `app/` | Game gốc |
| `app-poodle/` | Bản Poodle Bão tuyết (chạy độc lập, có `tokens.css` riêng) |
| `server.js` | Server Node.js nhỏ phục vụ các thư mục trên |
| `Dockerfile`, `compose.yaml` | Đóng gói và chạy bằng Docker |

## Cách chạy bằng Docker

**Cần có:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/macOS) hoặc Docker Engine + Docker Compose (Linux). Mở Docker Desktop và chờ biểu tượng chuyển sang "running".

1. Mở Terminal (hoặc PowerShell trên Windows) tại thư mục repo:

   ```bash
   cd moemoe
   ```

2. Build và khởi động (chạy nền):

   ```bash
   docker compose up -d --build
   ```

3. Mở trình duyệt:
   - Game gốc: **http://localhost:3000** (tự chuyển sang `/app/`)
   - Bản Poodle: **http://localhost:3000/app-poodle/**
   - Tài liệu: http://localhost:3000/docs/ · Design system: http://localhost:3000/design/design-system.html

4. Xem log khi cần:

   ```bash
   docker compose logs -f app
   ```

5. Dừng:

   ```bash
   docker compose down
   ```

Sửa code xong thì chạy lại bước 2 để build bản mới.

**Lỗi thường gặp**

- `port is already allocated`: cổng 3000 đang bị chương trình khác dùng (ví dụ một dự án Docker khác). Dừng chương trình đó, hoặc sửa dòng `"3000:3000"` trong `compose.yaml` thành `"3001:3000"` rồi mở http://localhost:3001.
- `Cannot connect to the Docker daemon`: Docker Desktop chưa chạy.

## Chạy không cần Docker

Cần Node.js 18 trở lên:

```bash
npm start
```

Rồi mở http://localhost:3000. Hoặc mở thẳng file `app/index.html` / `app-poodle/index.html` bằng trình duyệt.
