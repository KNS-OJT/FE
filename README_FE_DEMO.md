# P03 Frontend — bản demo (UI + nối REST API)

React 19 · TypeScript · Vite · Ant Design 5 · React Router · TanStack Query · Axios · Zustand

## 1. Đưa vào repo `D:\FE_OJT`

```powershell
cd D:\FE_OJT
git checkout develop
git pull
git checkout -b feature/fe-demo-ui-api
```

1. **Xóa toàn bộ thư mục `src` cũ** (bản khung Codex), rồi chép thư mục `src` mới vào.
2. Chép thêm `README_FE_DEMO.md`. Thêm các dòng trong `.env.example` mới vào `.env.example` của repo.
3. Tạo `.env.local` (không commit):
   ```
   VITE_API_BASE_URL=/api
   VITE_DEV_PROXY_TARGET=http://localhost:8080
   VITE_DEMO_MOCK_MISSING=true
   ```
4. Cài thêm font giao diện (tự host, không tải từ Google) và thư viện test còn thiếu, rồi kiểm tra:
   ```powershell
   npm.cmd install @fontsource/be-vietnam-pro
   npm.cmd install -D @testing-library/dom
   npm.cmd run lint
   npm.cmd run typecheck
   npm.cmd test
   npm.cmd run build
   ```
5. Chạy BE (`localhost:8080`), rồi `npm.cmd run dev` → mở `http://localhost:5173`.
6. Commit, push, tạo PR vào `develop`.

`vite.config.ts` của repo đã có alias `@` và proxy `/api → 8080`, không cần sửa.

## 2. Hệ thiết kế

- Màu gốc: `#81A6C6` (xanh thép), `#AACDDC` (xanh trời), `#F3E3D0` (cát), `#9FA1FF` (tím nhạt). Toàn bộ token nằm ở `src/theme.ts`; nút chính dùng `#3D6B91` (bản đậm của xanh thép) để chữ trắng đạt tương phản AA.
- Màu cát chỉ dùng cho thứ **đang chờ xử lý** (nhãn "Chờ duyệt", dòng tồn thấp); tím nhạt là màu nhấn (focus bàn phím, nhãn "Nhận một phần").
- Font: Be Vietnam Pro (dấu tiếng Việt chuẩn), số trong bảng dùng tabular-nums.
- Nhãn trạng thái: `src/components/StatusTag.tsx` (viên thuốc có chấm màu). Logo: `BrandMark.tsx`; hình kệ hàng ở màn đăng nhập: `ShelfIllustration.tsx`.

## 3. Phần nào nối API thật, phần nào mô phỏng

| Chức năng | Trạng thái | API |
|---|---|---|
| Đăng nhập, đăng xuất, hết phiên | ✅ API thật | `POST /api/auth/login` |
| Dashboard 5 thẻ | ✅ | `GET /api/dashboard` |
| Nhóm hàng | ✅ | `GET/POST /api/categories`, `PUT /api/categories/{id}` |
| Sản phẩm + ngưỡng tồn | ✅ | `/api/products`, `PUT /api/products/{id}/min-stock` |
| Tồn kho / tồn thấp | ✅ | `GET /api/stock`, `GET /api/stock/low` |
| Sổ kho | ✅ | `GET /api/stock-transactions` |
| PR: tạo, sửa, gửi, duyệt, từ chối, hủy | ✅ | `/api/pr`, `/api/pr/{id}/submit\|approve\|reject\|cancel` |
| Nhà cung cấp | ✅ | `/api/suppliers` |
| PO: tạo từ PR, sửa nháp, phát hành | ✅ | `/api/po`, `POST /api/po/{id}/order` |
| Người dùng: tạo, khóa, đổi vai trò | ✅ | `/api/users`, `/lock`, `/role` |
| Phiếu xuất: tạo/sửa nháp | ✅ | `/api/stock-issues` |
| Phiếu xuất: gửi, xác nhận, từ chối | ⏳ nút khóa, ghi "Backend chưa có API" | chưa có |
| **Phiếu nhập kho** | 🟡 **MÔ PHỎNG** khi `VITE_DEMO_MOCK_MISSING=true`, có banner cảnh báo, **không đổi tồn thật** | chưa có |
| Hủy PO | ⏳ nút khóa | chưa có |

## 4. Kịch bản demo gợi ý (khoảng 10 phút)

Chuẩn bị 5 tài khoản: 1 Requester, 1 Warehouse, 1 Purchasing, **2 Manager** (để chứng minh không tự duyệt).

1. **Đăng nhập sai mật khẩu** → thông báo chung (không lộ sai user hay sai pass).
2. **Requester**: menu chỉ có Tổng quan, Đề nghị mua, Phiếu xuất kho, Sản phẩm, Nhóm hàng. Tạo PR 2 dòng; thử số lượng 0 → báo lỗi; sửa rồi **Lưu & gửi duyệt**.
3. **Manager 1**: thấy PR ở tab "Chờ tôi duyệt" → **Duyệt**. Tự tạo một PR rồi mở ra → không có nút Duyệt, hiện cảnh báo **BR-08**. *(Case không hợp lệ theo luật nghiệp vụ.)*
4. **Manager 2**: mở PR của Manager 1 → **Từ chối** không nhập lý do → bị chặn (**BR-10**) → nhập lý do → Bị từ chối.
5. **Purchasing**: **Tạo PO từ PR** → chỉ thấy PR đã duyệt, chưa có PO (**BR-02, BR-19**); số lượng không nhập vượt số đã duyệt → **Lưu & đặt hàng**.
6. **Warehouse**: mở PO → **Lập phiếu nhận hàng** (màn mô phỏng) → xác nhận; thử nhận vượt → bị chặn (**BR-06**). Xem Tồn kho, Cảnh báo tồn thấp, Sổ kho (chỉ xem). Tạo sản phẩm trùng SKU → báo lỗi (**BR-01**). Tạo phiếu xuất vượt tồn → cảnh báo *"Số lượng xuất vượt quá tồn kho khả dụng"* (**BR-05**).
7. **Requester** gõ thẳng `/po` hoặc `/users` → trang **403**.

Nói rõ với thầy: phiếu nhập và xác nhận xuất là **giao diện hoàn chỉnh, đang chờ API backend**.

## 5. Tên trường JSON FE đang đọc (nhờ BE xác nhận)

Tài liệu BE chưa ghi đủ tên trường nên FE đọc theo **danh sách tên ứng viên**; tên đầu tiên là tên mong muốn. Code ở `src/api/*.ts` (hàm `str/num(o, 'tên1', 'tên2')`). Khi BE chốt Swagger, chỉ cần sửa ở đó.

| Đối tượng | Trường FE đọc (tên ưu tiên trước) |
|---|---|
| PR | `id`, `requestCode`/`code`, `requesterId`, `requesterName`, `reason`, `status`, `createdAt`, `submittedAt`, `reviewedBy`, `reviewedByName`, `reviewedAt`, `reviewReason`, `cancelReason`, `items[]{id, productId, sku, productName, unit, quantity, note}` |
| Body tạo/sửa PR | `{ reason, items: [{ productId, quantity, note }] }` |
| Từ chối / hủy PR | `{ reason, reviewReason }` / `{ reason, cancelReason }` |
| PO | `id`, `orderCode`/`code`, `purchaseRequestId`, `supplierId`, `supplierName`, `orderDate`, `expectedDeliveryDate`, `status`, `items[]{id, purchaseRequestItemId, productId, quantity, receivedQuantity}` |
| Body tạo PO | `{ purchaseRequestId, supplierId, expectedDeliveryDate(YYYY-MM-DD), note, items: [{ purchaseRequestItemId, productId, quantity }] }` |
| Sản phẩm | `id`, `sku`, `name`, `categoryId`, `categoryName`, `unit`, `active`, `createdAt` |
| Tồn kho | `productId`, `sku`, `productName`, `categoryName`, `unit`, `quantity`, `minimumStock`, `updatedAt` |
| Sổ kho | `id`, `createdAt`, `productId`, `sku`, `productName`, `transactionType`/`type`, `quantity`, `balanceAfter`, `createdBy`, `note` |
| Nhà cung cấp | `id`, `name`/`supplierName`, `contactPerson`, `phone`, `email`, `address`, `active` |
| User | `id`, `username`, `fullName`, `email`, `role`, `active`, `lastLoginAt`, `createdAt` |
| Phiếu xuất | `id`, `issueCode`/`code`, `requestedBy`, `reason`, `note`, `status`, `requestedAt`, `items[]{id, productId, quantity}` |
| Lỗi | `{ statusCode, errorCode, message, errors: [{ field, message }] }` — xem `docs/API_ERROR_CONVENTIONS.md` |

Body **không bao giờ** gửi `status`, `reviewedBy`, `confirmedBy`, `requesterId`, `createdBy` (IA-IN07).

## 6. Bảo mật đã áp dụng
- Token chỉ đọc/ghi ở `src/auth/session.ts` (sessionStorage), tự đăng xuất khi hết `expiresIn`, 401 → về trang đăng nhập.
- Đăng xuất xóa cache dữ liệu; người đăng nhập sau không bị đưa về trang của người trước.
- Chặn open redirect sau đăng nhập; không dùng `dangerouslySetInnerHTML`/`innerHTML`/`eval` (ESLint chặn).
- Lỗi 5xx không hiển thị message gốc của server.
- Nút xác nhận bị khóa trong lúc gửi (chống bấm hai lần); menu/route/nút theo ma trận quyền `src/auth/permissions.ts` — BE vẫn là nơi kiểm tra quyền thật.

## 7. Điểm BE lệch SRS (đưa vào review IA)
- `/api/stock`, `/api/stock-transactions` mọi role xem được; SRS IN04/IN13 chỉ Warehouse, Manager. FE đã ẩn theo SRS.
- Purchasing không tạo được phiếu xuất (SRS IN11 cho mọi role).
- Warehouse chỉ thấy phiếu xuất của mình → sau này không xác nhận được phiếu người khác (IN12).
- Sổ kho chỉ trả ID người thực hiện; dòng PO/phiếu xuất chỉ trả `productId`.
- Chưa có mở khóa tài khoản, hủy PO, phiếu nhập, xác nhận xuất.
