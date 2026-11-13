# Quy ước HTTP status & định dạng lỗi — P03 (đề xuất cho BE Spring Boot)

Tham khảo từ tài liệu backend NestJS của một dự án thương mại điện tử khác, **chỉ giữ phần hợp với P03** (hệ thống nội bộ, 4 role, không có thanh toán, vận chuyển hay gửi email).

## 1. Những gì lấy và không lấy

| Từ tài liệu tham khảo | P03 | Lý do |
|---|---|---|
| Một định dạng lỗi chung cho mọi API (`errorCode`, `message`, `errors[]`) | **Lấy** | FE hiển thị đúng lỗi theo từng ô, theo mã nghiệp vụ |
| Mã 400 / 401 / 403 / 404 / 409 / 422 / 429 / 500 | **Lấy** | Đúng các tình huống của P03 (bảng mục 2) |
| 201 khi tạo mới, 204 khi không có body | **Lấy** | Chuẩn REST |
| 429 khi gửi quá nhiều request | **Lấy cho đăng nhập** | Chống dò mật khẩu; SRS có `failed_login_count`, `locked_until` |
| Bọc mọi kết quả thành công trong `{ success, data, meta }` | **Không bắt buộc** | BE P03 đã thống nhất trả dữ liệu trực tiếp và phân trang `{ items, page, size, totalElements, totalPages }` (page từ 0). FE vẫn tự gỡ lớp bọc nếu sau này BE đổi |
| 503 cho SMTP, PayOS, GHN, Gemini | **Không** | P03 không gọi dịch vụ bên ngoài. Chỉ dùng 503 khi DB mất kết nối |
| Role BUYER / SELLER / STAFF, giỏ hàng, OTP, đấu giá | **Không** | Khác nghiệp vụ. P03 chỉ có REQUESTER, WAREHOUSE_STAFF, PURCHASING_STAFF, MANAGER |
| ID dạng UUID (`ParseUUIDPipe`) | **Không** | P03 dùng `bigint` (SRS mục 7) |

## 2. Khi nào trả mã nào (theo nghiệp vụ P03)

| Mã | Khi nào trong P03 | `errorCode` gợi ý | FE xử lý |
|---|---|---|---|
| 200 | GET; PUT; các thao tác `/submit`, `/approve`, `/reject`, `/cancel`, `/order`, `/confirm` | — | Báo thành công, tải lại dữ liệu |
| 201 | Tạo PR, PO, sản phẩm, nhóm hàng, nhà cung cấp, tài khoản, phiếu xuất | — | Chuyển sang trang chi tiết |
| 400 | Sai kiểu / thiếu trường / số lượng ≤ 0 / PR không có dòng hàng (BR-12) / từ chối không lý do (BR-10) / client gửi kèm `status`, `reviewedBy` (IA-IN07) | `VALIDATION_ERROR`, `REASON_REQUIRED` | Hiện lỗi dưới từng ô theo `errors[].field` |
| 401 | Chưa gửi token, token hết hạn hoặc sai chữ ký; đăng nhập sai | — | Xóa phiên → màn đăng nhập. Đăng nhập sai: câu chung, không nói sai tên hay sai mật khẩu |
| 403 | Sai role (BR-09); tự duyệt PR / tự xác nhận phiếu xuất / tự duyệt điều chỉnh (BR-08, BR-23, BR-24) | `SELF_APPROVAL_FORBIDDEN` | Thông báo không có quyền; đường dẫn bị cấm → trang 403 |
| 404 | Không có bản ghi; **hoặc** Requester mở chứng từ của người khác (SRS IN11 cho phép 403/404) | — | Câu chung "không tìm thấy hoặc không có quyền xem" — không xác nhận ID có tồn tại |
| 409 | Trùng SKU (BR-01), trùng tên nhóm, trùng username; PR chưa duyệt mà lập PO (BR-02); PR đã có PO (BR-19); chuyển trạng thái sai (ví dụ xác nhận phiếu đã Confirmed); hai người sửa cùng lúc | `SKU_DUPLICATED`, `CATEGORY_NAME_DUPLICATED`, `USERNAME_DUPLICATED`, `PR_NOT_APPROVED`, `PR_ALREADY_HAS_PO`, `INVALID_STATUS_TRANSITION`, `CONCURRENT_UPDATE` | Hiện câu tiếng Việt theo `errorCode`; trùng dữ liệu thì báo đỏ ở ô tương ứng |
| 422 | Dữ liệu đúng cú pháp nhưng vi phạm nghiệp vụ: **xuất vượt tồn (BR-05)**, nhận vượt số đặt (BR-06, BR-21), đặt vượt số đã duyệt, chọn sản phẩm / NCC đã ngừng | `INSUFFICIENT_STOCK`, `OVER_RECEIVE`, `QUANTITY_EXCEEDS_APPROVED`, `INACTIVE_PRODUCT`, `INACTIVE_SUPPLIER` | `INSUFFICIENT_STOCK` → đúng câu SRS: *"Số lượng xuất vượt quá tồn kho khả dụng"* |
| 429 | Đăng nhập sai nhiều lần / gọi API dồn dập | — | "Thao tác quá nhanh, thử lại sau N giây" (đọc header `Retry-After`) |
| 500 | Lỗi không lường trước, transaction rollback | — | Câu chung. **FE không hiển thị message của server** |
| 503 | DB mất kết nối | — | Câu chung "tạm thời không khả dụng" |

409 hay 422 cho cùng một lỗi đều được — FE dựa vào `errorCode` là chính. Quan trọng là **cả nhóm dùng thống nhất**.

## 3. Định dạng body lỗi đề xuất

```json
{
  "statusCode": 400,
  "errorCode": "VALIDATION_ERROR",
  "message": "Dữ liệu không hợp lệ",
  "errors": [{ "field": "quantity", "rule": "Positive", "message": "Số lượng phải lớn hơn 0" }],
  "timestamp": "2026-11-14T01:42:00Z",
  "path": "/api/pr"
}
```

- `message` viết **tiếng Việt** (FE hiển thị trực tiếp cho lỗi 4xx).
- `errors[].field` trùng tên trường trong body request (`reason`, `items[0].quantity`, `sku`…).
- **Không** đưa stack trace, câu SQL, tên bảng, tên class Java vào `message` — kể cả lỗi 500.
- Với Spring Boot: một `@RestControllerAdvice` bắt `MethodArgumentNotValidException` (→ 400 + `errors[]`), `AccessDeniedException` (→ 403), exception nghiệp vụ tự định nghĩa mang `errorCode` (→ 409/422), và `Exception` chung (→ 500, message cố định).

## 4. FE đã làm sẵn (src/lib/errors.ts, src/lib/http.ts)
- Đọc `errorCode` (hoặc `code`), `message` (hoặc `detail` của Spring ProblemDetail), `errors[]` (hoặc `fieldErrors`).
- Bỏ qua tên mã HTTP tiếng Anh (`"Forbidden"`, `"Bad Request"`) để không hiện tiếng Anh cho người dùng.
- Bảng câu tiếng Việt cho các `errorCode` ở mục 2; mã lạ → câu theo HTTP status.
- 401 → tự đăng xuất; 5xx → không bao giờ hiện message server, không đọc `errors[]`.
- Tự gỡ lớp bọc `{ success: true, statusCode, data }` nếu BE dùng.
