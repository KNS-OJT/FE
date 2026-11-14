import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);
const TZ = 'Asia/Ho_Chi_Minh';

export const fmtDateTime = (v?: string | null) => (v ? dayjs.utc(v).tz(TZ).format('DD/MM/YYYY HH:mm') : '—');
export const fmtDate = (v?: string | null) => (v ? dayjs(v).format('DD/MM/YYYY') : '—');
const nf = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 3 });
export const fmtNum = (v?: number | null) => (v == null ? '—' : nf.format(v));
