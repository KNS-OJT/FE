/**
 * Kiểm tra mật khẩu phía giao diện theo NIST SP 800-63B: kiểm tra độ dài, danh sách mật khẩu phổ biến
 * và việc dùng lại tên đăng nhập; KHÔNG ép chữ hoa / ký tự đặc biệt. BE vẫn là nơi kiểm tra cuối cùng.
 */

export const MIN_PASSWORD_LENGTH = 8;
/** bcrypt chỉ dùng 72 byte đầu của mật khẩu; phần dư bị cắt âm thầm. */
export const MAX_PASSWORD_BYTES = 72;

const encoder = new TextEncoder();

/** Số byte UTF-8. Chữ tiếng Việt có dấu chiếm 2–3 byte nên không thể dùng `.length`. */
export const byteLength = (s: string): number => encoder.encode(s).length;

const COMMON_PASSWORDS = new Set([
  '12345678', '123456789', '1234567890', '87654321', '11111111', '00000000', '12341234', '123123123',
  '123456abc', 'abc12345', 'abcd1234', 'abcdefgh', 'aaaaaaaa', 'password', 'password1', 'password12',
  'password123', 'passw0rd', 'p@ssw0rd', 'p@ssword', 'matkhau', 'matkhau1', 'matkhau12', 'matkhau123',
  'matkhau1234', 'mat khau 123', 'qwerty123', 'qwertyui', 'qwertyuiop', 'qwerty12', 'asdfghjk', 'asdf1234',
  'zxcvbnm1', 'iloveyou', 'iloveyou1', 'letmein1', 'welcome1', 'welcome123', 'admin123', 'admin1234',
  'administrator', 'manager123', 'warehouse1', 'user1234', 'test1234', 'changeme', 'changeme1', 'default123',
  'khohang123', 'muahang123', 'p03p03p03', 'abc123456', 'monkey123', 'dragon123', 'football1', 'baseball1',
]);

/** Danh sách lỗi (tiếng Việt). Mảng rỗng = hợp lệ. */
export function passwordProblems(pw: string, opts: { username?: string } = {}): string[] {
  const problems: string[] = [];
  if ([...pw].length < MIN_PASSWORD_LENGTH) problems.push(`Mật khẩu phải có ít nhất ${MIN_PASSWORD_LENGTH} ký tự.`);
  if (byteLength(pw) > MAX_PASSWORD_BYTES) {
    problems.push(`Mật khẩu tối đa ${MAX_PASSWORD_BYTES} byte (chữ có dấu chiếm 2–3 byte mỗi ký tự).`);
  }
  const user = (opts.username ?? '').trim().toLowerCase();
  const lower = pw.toLowerCase();
  if (user && (lower === user || (user.length >= 3 && lower.includes(user)))) {
    problems.push('Mật khẩu không được trùng hoặc chứa tên đăng nhập.');
  }
  if (COMMON_PASSWORDS.has(lower)) problems.push('Mật khẩu quá phổ biến, rất dễ bị đoán.');
  return problems;
}

/** Validator dùng cho Form.Item: từ chối bằng lỗi đầu tiên. Chuỗi rỗng do rule `required` xử lý. */
export function validatePassword(pw: string | undefined, username?: string): Promise<void> {
  if (!pw) return Promise.resolve();
  const [first] = passwordProblems(pw, { username });
  return first ? Promise.reject(new Error(first)) : Promise.resolve();
}

export type PasswordStrength = 0 | 1 | 2 | 3;

/** Chỉ để hiển thị thanh độ mạnh (0 = Yếu … 3 = Mạnh), không thay cho `passwordProblems`. */
export function passwordStrength(pw: string): PasswordStrength {
  const chars = [...pw];
  if (chars.length < MIN_PASSWORD_LENGTH || COMMON_PASSWORDS.has(pw.toLowerCase()) || new Set(chars).size < 5) return 0;
  const classes = [/\p{Ll}/u, /\p{Lu}/u, /\p{N}/u, /[^\p{L}\p{N}]/u].filter((re) => re.test(pw)).length;
  const points = (chars.length >= 10 ? 1 : 0) + (chars.length >= 14 ? 1 : 0) + (chars.length >= 18 ? 1 : 0) + (classes >= 3 ? 1 : 0);
  return Math.min(3, points) as PasswordStrength;
}

export const STRENGTH_LABELS = ['Yếu', 'Trung bình', 'Khá', 'Mạnh'] as const;
