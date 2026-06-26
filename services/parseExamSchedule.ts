import * as XLSX from 'xlsx';
import { Shift } from '../types';

export interface ParsedBooking {
  roomId: string;
  date: string;       // ISO string
  shift: Shift;
  user: string;       // Mã học phần (môn thi)
  purpose: string;    // Tên đầy đủ trong cell
  proctor: string;    // Trích xuất từ suffix " - TenGV" hoặc "(TenGV)"
  examClassCode?: string;
  moduleName?: string;
}

export interface SheetParseResult {
  sheetName: string;
  weekLabel: string;  // "Tuần 21"
  bookings: ParsedBooking[];
  errors: string[];
}

// ─── Mapping kíp thi ────────────────────────────────────────────────────────
const KIP_MAP: Record<string, Shift> = {
  '1': Shift.KIP_1,
  '2': Shift.KIP_2,
  '3': Shift.KIP_3,
  '4': Shift.KIP_4,
  '5': Shift.KIP_5,
};

/**
 * Từ text kíp ("Kíp 1 - 7h00", "Kíp 2-9h30", "Kíp 5-17h30"), trả về Shift enum.
 * Chỉ dựa vào số kíp đầu tiên xuất hiện.
 */
function parseShiftFromText(text: string): Shift | null {
  const m = String(text).match(/Kíp\s*(\d)/i);
  if (!m) return null;
  return KIP_MAP[m[1]] ?? null;
}

/**
 * Parse ngày từ text header kiểu "Thứ 2 (26.01.2026)" hoặc "Thứ 5 (29.01.2026)".
 * Trả về Date object hoặc null nếu không parse được.
 */
function parseDateFromHeader(text: string): Date | null {
  const m = String(text).match(/(\d{2})\.(\d{2})\.(\d{4})/);
  if (!m) return null;
  const [, day, month, year] = m;
  const d = new Date(Number(year), Number(month) - 1, Number(day));
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Parse ngày từ định dạng DD/MM/YYYY hoặc DD.MM.YYYY
 */
function parseDateFromFlatFormat(text: string): Date | null {
  const m = String(text).match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
  if (!m) return null;
  const [, day, month, year] = m;
  const d = new Date(Number(year), Number(month) - 1, Number(day));
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Tách mã học phần và cán bộ trông thi từ cell value.
 * Ví dụ:
 *   "IT3190 - HaiPV"     → { subject: "IT3190", proctor: "HaiPV" }
 *   "IT3080E (NgocTN)"   → { subject: "IT3080E", proctor: "NgocTN" }
 *   "IT4931"             → { subject: "IT4931", proctor: "" }
 */
function parseSubjectCell(raw: string | null | undefined): { subject: string; proctor: string } | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Dạng "IT3190 - HaiPV"
  const dashMatch = trimmed.match(/^(.+?)\s+-\s+(.+)$/);
  if (dashMatch) return { subject: dashMatch[1].trim(), proctor: dashMatch[2].trim() };

  // Dạng "IT3080E (NgocTN)"
  const parenMatch = trimmed.match(/^(.+?)\s+\((.+?)\)$/);
  if (parenMatch) return { subject: parenMatch[1].trim(), proctor: parenMatch[2].trim() };

  return { subject: trimmed, proctor: '' };
}

/**
 * Chuyển tên phòng "B1-106" → roomId "106".
 * Nếu không có prefix "B1-" thì giữ nguyên.
 */
function parseRoomId(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  // Bỏ prefix "B1-", "B2-", ... (bất kỳ "BX-")
  const m = trimmed.match(/^B\d+-(.+)$/i);
  return m ? m[1] : trimmed;
}

/**
 * Phát hiện sheet lịch thi từ danh sách sheet.
 * Lấy sheet có tên khớp /^Tuan\d+/i hoặc các sheet chứa "lịch nhập", "preview".
 */
export function detectExamSheets(sheetNames: string[]): string[] {
  return sheetNames.filter(name => 
    /^Tuan\d+/i.test(name) || 
    name.toLowerCase().includes('lịch nhập') || 
    name.toLowerCase().includes('preview')
  );
}

/**
 * Hàm chính: parse một sheet lịch thi thành mảng ParsedBooking[].
 *
 * Layout sheet TuanXX:
 * - Row 0: Tiêu đề tuần + ngày thi (merged cells)
 *   col0 = "Tuần XX", col3 = "Thứ 2 (DD.MM.YYYY)", col8 = "Thứ 3...", ...
 * - Row 1: Header kíp thi
 *   col0="TT", col1="Phòng", col2="Số sv",
 *   col3="Kíp 1 - 7h00", col4="Kíp 2-9h30", ..., col7="Kíp 5-17h30",  (Thứ 2)
 *   col8..12 (Thứ 3), col13..17 (Thứ 4), col18..22 (Thứ 5), col23..27 (Thứ 6),
 *   col28..31 (Thứ 7 - 4 kíp), col32..35 (Chủ nhật - 4 kíp)
 * - Row 2+: Dữ liệu phòng (đến khi gặp "Số sv thi" ở col1 thì dừng)
 */
export function parseExamSheet(ws: XLSX.WorkSheet, sheetName: string): SheetParseResult {
  const data: (string | number | null)[][] = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    defval: null,
    raw: false, // Đọc dạng formatted string để xử lý date dễ hơn
  });

  const result: SheetParseResult = {
    sheetName,
    weekLabel: '',
    bookings: [],
    errors: [],
  };

  if (data.length < 2) {
    result.errors.push('Sheet không đủ dữ liệu');
    return result;
  }

  const row0 = data[0] ?? [];
  const row1 = data[1] ?? [];

  // Detect flat format (Lich_Thi_Preview)
  const isFlatFormat = row0.length >= 6 && 
    String(row0[0]).toLowerCase().includes('phòng') && 
    String(row0[1]).toLowerCase().includes('ngày thi') && 
    String(row0[2]).toLowerCase().includes('kíp');

  if (isFlatFormat) {
    result.weekLabel = sheetName;
    for (let rowIdx = 1; rowIdx < data.length; rowIdx++) {
      const row = data[rowIdx] ?? [];
      const roomIdStr = String(row[0] ?? '').trim();
      if (!roomIdStr) continue;

      const roomId = parseRoomId(roomIdStr);
      if (!roomId) continue;

      const dateStr = String(row[1] ?? '').trim();
      const dateParsed = parseDateFromFlatFormat(dateStr);
      if (!dateParsed) continue;

      const kipStr = String(row[2] ?? '').trim();
      const shift = parseShiftFromText(kipStr);
      if (!shift) continue;

      const proctor = String(row[4] ?? '').trim();
      const content = String(row[5] ?? '').trim();
      const giangVien = String(row[3] ?? '').trim();

      let subject = content;
      let moduleName = '';
      const hpMatch = content.match(/HP:\s*(.*?)(?:\.|$)/i);
      if (hpMatch) {
         subject = hpMatch[1].trim();
         moduleName = hpMatch[1].trim();
      }

      let examClassCode = '';
      const maLopMatch = content.match(/Mã lớp thi:\s*(\d+)/i);
      if (maLopMatch) {
         examClassCode = maLopMatch[1];
      }

      result.bookings.push({
        roomId,
        date: dateParsed.toISOString(),
        shift,
        user: giangVien || subject, // Use giangVien if present, else fallback to subject
        purpose: content,
        proctor: proctor.toLowerCase().includes('chưa phân công') ? '' : proctor,
        examClassCode,
        moduleName,
      });
    }

    return result;
  }

  // Lấy label tuần từ cell A0 (cho dạng bảng TuanXX)
  result.weekLabel = String(row0[0] ?? sheetName);

  // ─── Bước 1: Build column map ────────────────────────────────────────────
  // Duyệt row0 tìm các cột bắt đầu của mỗi ngày có date
  // Cấu trúc: mỗi ngày có 4-5 cột kíp thi liên tiếp
  interface DayGroup {
    date: Date;
    dateLabel: string;
    startCol: number;
    shifts: { col: number; shift: Shift }[];
  }

  const dayGroups: DayGroup[] = [];

  for (let col = 0; col < row0.length; col++) {
    const cellVal = row0[col];
    if (!cellVal) continue;
    const date = parseDateFromHeader(String(cellVal));
    if (!date) continue;

    // Tìm các kíp thi từ row1, bắt đầu từ col này trở đi
    const shifts: { col: number; shift: Shift }[] = [];
    for (let kCol = col; kCol < Math.min(col + 6, row1.length); kCol++) {
      const kip = parseShiftFromText(String(row1[kCol] ?? ''));
      if (kip) shifts.push({ col: kCol, shift: kip });
      // Nếu đã lấy đủ kíp và gặp ô không phải kíp thì dừng
      else if (shifts.length > 0) break;
    }

    if (shifts.length > 0) {
      dayGroups.push({ date, dateLabel: String(cellVal), startCol: col, shifts });
    }
  }

  // Fallback: nếu không tìm được dayGroups từ row0 (merged cells không expand),
  // dùng row1 trực tiếp để xây dựng mapping dựa trên pattern cố định.
  if (dayGroups.length === 0) {
    result.errors.push('Không tìm được ngày thi từ header (có thể do merged cells). Kiểm tra định dạng file.');
    return result;
  }

  // ─── Bước 2: Parse từng dòng phòng ──────────────────────────────────────
  for (let rowIdx = 2; rowIdx < data.length; rowIdx++) {
    const row = data[rowIdx] ?? [];

    // Dừng khi gặp dòng tổng (col1 = "Số sv thi" hoặc "Trực kỹ thuật")
    const col1Val = String(row[1] ?? '').trim().toLowerCase();
    if (col1Val.includes('số sv thi') || col1Val.includes('trực kỹ thuật') || col1Val.startsWith('tổng')) break;

    const roomId = parseRoomId(String(row[1] ?? ''));
    if (!roomId || roomId === '') continue;

    // Duyệt từng ngày và kíp
    for (const day of dayGroups) {
      for (const { col, shift } of day.shifts) {
        const cellValue = row[col];
        if (!cellValue || String(cellValue).trim() === '') continue;

        const parsed = parseSubjectCell(String(cellValue));
        if (!parsed) continue;

        // Mặc định cho dạng bảng chưa có Tên HP / Mã lớp trong nội dung.
        // Có thể mở rộng parsing tùy thuộc vào định dạng chuỗi cell.
        result.bookings.push({
          roomId,
          date: day.date.toISOString(),
          shift,
          user: parsed.subject,   // Mã môn thi (VD: "IT1108")
          purpose: parsed.subject, // Mã môn thi
          proctor: parsed.proctor, // Cán bộ trông thi (nếu có)
          examClassCode: '',
          moduleName: parsed.subject, // Tạm lấy subject làm moduleName
        });
      }
    }
  }

  return result;
}

/**
 * Entry point: nhận WorkBook (đã read bằng XLSX), trả về kết quả parse của
 * tất cả sheet lịch thi được chọn.
 */
export function parseSelectedSheets(wb: XLSX.WorkBook, selectedSheets: string[]): SheetParseResult[] {
  return selectedSheets.map(name => {
    const ws = wb.Sheets[name];
    if (!ws) {
      return {
        sheetName: name,
        weekLabel: name,
        bookings: [],
        errors: [`Sheet "${name}" không tồn tại trong file`],
      };
    }
    return parseExamSheet(ws, name);
  });
}
