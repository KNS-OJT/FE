import { describe, expect, it } from 'vitest';
import { byteLength, passwordProblems, passwordStrength, validatePassword } from '@/lib/password';

describe('byteLength', () => {
  it('chữ ASCII: 1 byte mỗi ký tự', () => {
    expect(byteLength('abc123')).toBe(6);
  });
  it('chữ tiếng Việt có dấu chiếm 2–3 byte', () => {
    expect(byteLength('é')).toBe(2);
    expect(byteLength('ệ')).toBe(3);
    expect(byteLength('Việt')).toBe(6); // V(1) i(1) ệ(3) t(1)
  });
});

describe('passwordProblems', () => {
  it('mật khẩu tốt: không lỗi, không ép chữ hoa hay ký tự đặc biệt (NIST SP 800-63B)', () => {
    expect(passwordProblems('xylophone', { username: 'an' })).toEqual([]);
    expect(passwordProblems('ngay mai troi nang')).toEqual([]);
  });
  it('ngắn hơn 8 ký tự', () => {
    expect(passwordProblems('abc12')).toEqual(['Mật khẩu phải có ít nhất 8 ký tự.']);
  });
  it('đếm ký tự theo chữ, không theo byte (8 chữ có dấu vẫn đủ độ dài)', () => {
    expect(passwordProblems('ệệệệệệệệ')).toEqual([]);
  });
  it('72 byte là giới hạn, 73 byte bị từ chối', () => {
    expect(passwordProblems('x'.repeat(72)).some((p) => p.includes('72 byte'))).toBe(false);
    expect(passwordProblems('x'.repeat(73)).some((p) => p.includes('72 byte'))).toBe(true);
  });
  it('chữ có dấu vượt 72 byte dù ít hơn 72 ký tự', () => {
    const pw = 'ệ'.repeat(25); // 25 ký tự nhưng 75 byte
    expect([...pw].length).toBeLessThan(72);
    expect(passwordProblems(pw).some((p) => p.includes('72 byte'))).toBe(true);
  });
  it('trùng hoặc chứa tên đăng nhập, không phân biệt hoa thường', () => {
    expect(passwordProblems('NguyenVan', { username: 'nguyenvan' })).toContain('Mật khẩu không được trùng hoặc chứa tên đăng nhập.');
    expect(passwordProblems('xx-nguyenvan-99', { username: 'NguyenVan' })).toContain('Mật khẩu không được trùng hoặc chứa tên đăng nhập.');
  });
  it('tên đăng nhập quá ngắn (<3) chỉ bị chặn khi trùng hẳn, tránh báo nhầm', () => {
    expect(passwordProblems('xylophone-an', { username: 'an' })).toEqual([]);
  });
  it('mật khẩu phổ biến bị chặn, không phân biệt hoa thường', () => {
    for (const pw of ['12345678', 'password', 'matkhau123', 'abc12345', 'qwerty123', 'Admin123']) {
      expect(passwordProblems(pw), pw).toContain('Mật khẩu quá phổ biến, rất dễ bị đoán.');
    }
  });
  it('gộp nhiều lỗi cùng lúc', () => {
    expect(passwordProblems('abc', { username: 'abc' })).toHaveLength(2);
  });
});

describe('validatePassword', () => {
  it('bỏ qua giá trị rỗng (rule required lo phần đó)', async () => {
    await expect(validatePassword('', 'u')).resolves.toBeUndefined();
    await expect(validatePassword(undefined)).resolves.toBeUndefined();
  });
  it('từ chối bằng lỗi đầu tiên', async () => {
    await expect(validatePassword('12345678')).rejects.toThrow('Mật khẩu quá phổ biến');
  });
});

describe('passwordStrength', () => {
  it('Yếu (0): quá ngắn, phổ biến, hoặc lặp ký tự', () => {
    expect(passwordStrength('')).toBe(0);
    expect(passwordStrength('abc12')).toBe(0);
    expect(passwordStrength('password')).toBe(0);
    expect(passwordStrength('aaaaaaaaaaaaaaaaaaaa')).toBe(0);
  });
  it('tăng dần theo độ dài và độ đa dạng', () => {
    expect(passwordStrength('xylophone')).toBe(0);
    expect(passwordStrength('xylophones1')).toBe(1);
    expect(passwordStrength('Xylophones123')).toBe(2);
    expect(passwordStrength('Xylophones-123-ok')).toBe(3);
  });
  it('cụm từ dài toàn chữ thường vẫn đạt Mạnh', () => {
    expect(passwordStrength('ngay mai troi se nang')).toBe(3);
  });
  it('luôn nằm trong 0..3', () => {
    expect(passwordStrength('Aa1!'.repeat(30))).toBeLessThanOrEqual(3);
  });
});
