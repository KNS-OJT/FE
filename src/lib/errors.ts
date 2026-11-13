import { AxiosError } from 'axios';

/**
 * Lỗi đã chuẩn hóa cho UI.
 * FE đọc được các dạng body lỗi phổ biến:
 *  - { statusCode, errorCode, message, errors: [{ field, rule, message }], timestamp, path }  (quy ước đề xuất cho nhóm)
 *  - Spring ProblemDetail { title, detail, status, ... } và Spring mặc định { status, error, message, path }
 */
export interface ApiError {
  status: number; // 0 = không kết nối được máy chủ
  code?: string; // errorCode nghiệp vụ, vd INSUFFICIENT_STOCK
  message: string;
  fieldErrors?: Record<string, string>;
}

/** Câu thông báo cho errorCode nghiệp vụ của P03 (BR trong SRS). Mã chưa có trong bảng → dùng câu theo HTTP status. */
export const BUSINESS_MESSAGES: Record<string, string> = {
  VALIDATION_ERROR: 'Dữ liệu chưa hợp lệ. Kiểm tra lại các ô được đánh dấu.',
  INSUFFICIENT_STOCK: 'Số lượng xuất vượt quá tồn kho khả dụng', // nguyên văn SRS IN12 / BR-05
  SKU_DUPLICATED: 'SKU đã tồn tại (kể cả sản phẩm đã ngừng kinh doanh).', // BR-01
  CATEGORY_NAME_DUPLICATED: 'Tên nhóm hàng đã tồn tại.',
  USERNAME_DUPLICATED: 'Tên đăng nhập đã tồn tại.',
  SELF_APPROVAL_FORBIDDEN: 'Bạn không thể tự duyệt hoặc tự xác nhận chứng từ do chính mình tạo.', // BR-08, BR-23, BR-24
  PR_NOT_APPROVED: 'Chỉ lập được đơn đặt hàng từ đề nghị mua đã duyệt.', // BR-02
  PR_ALREADY_HAS_PO: 'Đề nghị mua này đã có đơn đặt hàng.', // BR-19
  QUANTITY_EXCEEDS_APPROVED: 'Số lượng đặt vượt số lượng đã duyệt.',
  OVER_RECEIVE: 'Số lượng nhận vượt số còn lại trên đơn đặt hàng.', // BR-06, BR-21
  REASON_REQUIRED: 'Vui lòng nhập lý do.', // BR-10
  INVALID_STATUS_TRANSITION: 'Thao tác không còn hợp lệ với trạng thái hiện tại. Tải lại trang để xem trạng thái mới nhất.',
  CONCURRENT_UPDATE: 'Dữ liệu vừa được người khác cập nhật. Tải lại trang rồi thử lại.',
  INACTIVE_PRODUCT: 'Sản phẩm đã ngừng kinh doanh, không thể chọn.',
  INACTIVE_SUPPLIER: 'Nhà cung cấp đã ngừng hợp tác, không thể chọn.',
};

const STATUS_MESSAGES: Record<number, string> = {
  0: 'Không kết nối được máy chủ. Kiểm tra mạng hoặc thử lại sau.',
  400: 'Dữ liệu chưa hợp lệ. Kiểm tra lại các ô được đánh dấu.',
  401: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  403: 'Bạn không có quyền thực hiện thao tác này.',
  // SRS IN11 cho phép trả 404 khi truy cập chứng từ của người khác → không khẳng định "không tồn tại".
  404: 'Không tìm thấy dữ liệu hoặc bạn không có quyền xem.',
  409: 'Thao tác bị từ chối vì dữ liệu trùng hoặc không hợp lệ với trạng thái hiện tại.',
  422: 'Yêu cầu vi phạm quy tắc nghiệp vụ nên không xử lý được.',
  429: 'Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.',
  500: 'Hệ thống gặp lỗi. Vui lòng thử lại sau.',
  503: 'Hệ thống tạm thời không khả dụng. Vui lòng thử lại sau.',
};
const statusMessage = (s: number) => STATUS_MESSAGES[s] ?? (s >= 500 ? STATUS_MESSAGES[500] : 'Đã có lỗi xảy ra. Vui lòng thử lại.');

/** Tên mã HTTP tiếng Anh (Spring/Nest điền vào trường error/message) — không hiển thị cho người dùng. */
const REASON_PHRASES = /^(bad request|unauthorized|forbidden|access denied|not found|conflict|unprocessable entity|too many requests|internal server error|service unavailable)\.?$/i;

function collectFieldErrors(body: Record<string, unknown>): Record<string, string> | undefined {
  const fe = body.fieldErrors ?? body.errors;
  const out: Record<string, string> = {};
  if (Array.isArray(fe)) {
    for (const it of fe) {
      if (!it || typeof it !== 'object') continue;
      const o = it as Record<string, unknown>;
      const f = o.field ?? o.property;
      const m = o.message ?? o.defaultMessage;
      if (typeof f === 'string' && m != null) out[f] = String(m);
    }
  } else if (fe && typeof fe === 'object') {
    for (const [k, v] of Object.entries(fe as Record<string, unknown>)) out[k] = String(v);
  }
  return Object.keys(out).length ? out : undefined;
}

export function toApiError(err: unknown): ApiError {
  if (isApiError(err)) return err;
  if (!(err instanceof AxiosError)) return { status: 0, message: statusMessage(-1) };
  if (!err.response) return { status: 0, message: statusMessage(0) };

  const { status, data, headers } = err.response;
  const body = (data && typeof data === 'object' ? data : {}) as Record<string, unknown>;
  const code = [body.errorCode, body.code].find((x) => typeof x === 'string') as string | undefined;
  // Không đọc trường `error` / `title`: đó là tên mã HTTP tiếng Anh.
  const serverMsg = [body.message, body.detail].find((x) => typeof x === 'string' && x.trim() && !REASON_PHRASES.test(x.trim())) as string | undefined;

  let message = (code && BUSINESS_MESSAGES[code]) || (status >= 400 && status < 500 && status !== 401 && status !== 429 && serverMsg) || statusMessage(status);
  if (status === 429) {
    const retry = Number(headers?.['retry-after']);
    if (retry > 0) message = `Bạn thao tác quá nhanh. Vui lòng thử lại sau ${retry} giây.`;
  }
  // 5xx: không bao giờ hiển thị message của server (có thể lộ stack trace, câu SQL).
  return { status, code, fieldErrors: status < 500 ? collectFieldErrors(body) : undefined, message };
}

export function isApiError(e: unknown): e is ApiError {
  return typeof e === 'object' && e !== null && 'status' in e && 'message' in e && !(e instanceof Error);
}

export const errMsg = (e: unknown) => toApiError(e).message;
