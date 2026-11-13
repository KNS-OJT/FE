import type { ApiError } from './errors';
import type { FormInstance } from 'antd';

/** validateFields() nhưng không ném lỗi: form tự hiển thị lỗi tại field, trả null nếu chưa hợp lệ. */
export async function validated<T>(form: FormInstance<T>): Promise<T | null> {
  try {
    return await form.validateFields();
  } catch {
    return null;
  }
}


/** Hiện lỗi theo ô từ BE (errors[].field) ngay dưới ô nhập. Trả về true nếu đã hiện được ít nhất một lỗi. */
export function applyFieldErrors<T>(form: FormInstance<T>, err: ApiError): boolean {
  if (!err.fieldErrors) return false;
  const known = Object.keys(form.getFieldsValue(true) ?? {});
  const fields = Object.entries(err.fieldErrors)
    .filter(([name]) => known.includes(name))
    .map(([name, msg]) => ({ name: name as never, errors: [msg] }));
  if (fields.length) form.setFields(fields);
  return fields.length > 0;
}
