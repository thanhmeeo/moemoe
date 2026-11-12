# Đập Chuột — Yêu cầu

Mini game chạy trên trình duyệt. Một lượt chơi 10 giây, người chơi bấm vào chuột xuất hiện trên lưới 3×3 để ghi điểm.

## 1. Luật chơi

| # | Luật |
|---|------|
| L1 | Bảng chơi là lưới 3×3 = 9 ô (hang chuột). |
| L2 | Mỗi lượt kéo dài đúng **10 giây**, đếm ngược từ lúc bấm "Bắt đầu". |
| L3 | Tại mỗi thời điểm có **tối đa 1 con chuột** trên bảng. |
| L4 | Chuột hiện ở một ô ngẫu nhiên, ở lại **0,8 giây** rồi biến mất nếu không bị bấm. |
| L5 | Chuột mới xuất hiện sau **0,3 giây** kể từ khi chuột cũ biến mất hoặc bị đập. |
| L6 | Chuột mới không xuất hiện lại đúng ô vừa xong. |
| L7 | Bấm trúng ô đang có chuột → chuột bị đập, biến mất ngay. |
| L8 | Hết 10 giây → dừng lượt, chuột đang hiện biến mất, không nhận thêm thao tác bấm trên lưới. |
| L9 | Hỗ trợ cả chuột máy tính (click) và chạm (touch). |

## 2. Cách tính điểm

| # | Hành động | Điểm |
|---|-----------|------|
| D1 | Bấm trúng ô đang có chuột | **+1** |
| D2 | Bấm vào ô trống | 0 (không trừ điểm) |
| D3 | Bấm lặp vào chuột đã bị đập | 0 |
| D4 | Chuột tự biến mất mà không bị đập | 0 |
| D5 | Mỗi lượt bắt đầu từ 0 điểm; không có combo, hệ số nhân hay điểm âm | — |
| D6 | Điểm cao nhất được lưu trong trình duyệt (localStorage), giữ nguyên khi tải lại trang | — |

## 3. Màn hình

### 3.1 Màn hình bắt đầu
- Tên game và hướng dẫn: "Bấm vào chuột để ghi điểm. Bạn có 10 giây!"
- Nút **Bắt đầu**; hiển thị điểm cao nhất (0 nếu chưa chơi).

### 3.2 Màn hình chơi
- Thanh trạng thái phía trên: `Điểm: N` và `Thời gian: S` (đếm ngược 10 → 0).
- Lưới 3×3 ở giữa, 9 ô hình vuông cùng kích thước, đủ lớn để chạm bằng ngón tay.
- Ô có chuột hiển thị 🐭; ô trống hiển thị hình hang. Đập trúng có hiệu ứng ngắn và điểm tăng ngay.

### 3.3 Màn hình kết thúc
- Tiêu đề "Hết giờ!", điểm lượt vừa chơi, điểm cao nhất.
- Phá kỷ lục thì hiện "Kỷ lục mới!".
- Nút **Chơi lại**: đặt lại điểm và thời gian rồi bắt đầu lượt mới.

### 3.4 Yêu cầu chung
- Responsive từ màn hình điện thoại 360px, không cần cuộn trang khi chơi.
- Chữ rõ ràng, tương phản tốt.

## 4. Tiêu chí hoàn thành

| # | Tiêu chí | Đạt |
|---|----------|-----|
| T1 | Hiển thị lưới đúng 9 ô | ☐ |
| T2 | Bấm Bắt đầu thì đếm ngược từ 10 giây, cập nhật mỗi giây | ☐ |
| T3 | Chuột xuất hiện ngẫu nhiên, mỗi lúc 1 con, ở lại 0,8 giây, không lặp ô liền trước | ☐ |
| T4 | Bấm trúng chuột: +1 điểm, chuột biến mất ngay | ☐ |
| T5 | Bấm ô trống hoặc bấm lặp không đổi điểm | ☐ |
| T6 | Hết giờ: không còn chuột, không ghi thêm điểm, hiện màn hình kết thúc đúng điểm | ☐ |
| T7 | Chơi lại đặt điểm về 0, thời gian về 10 giây, không còn bộ đếm hay chuột từ lượt trước | ☐ |
| T8 | Điểm cao nhất còn nguyên sau khi tải lại trang | ☐ |
| T9 | Chạy bằng cách mở trang trong trình duyệt hiện đại, không cần server riêng | ☐ |
| T10 | Dùng được bằng cả chuột và cảm ứng; ô bấm tối thiểu ~64px | ☐ |
| T11 | Chơi trọn một lượt không có lỗi trong console | ☐ |

## 5. Ngoài phạm vi
Nhiều mức độ khó, chuột đặc biệt, combo, âm thanh, bảng xếp hạng online, đăng nhập.
