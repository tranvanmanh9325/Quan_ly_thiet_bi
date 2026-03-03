
import { Room, Shift, ImportConfig, AcademicWeek } from './types';

export const ROOMS: Room[] = [
  // Tầng 1 (4 phòng) - Chỉ có ở cánh phải
  { id: '106', floor: 1, wing: 'right' },
  { id: '107', floor: 1, wing: 'right' },
  { id: '108', floor: 1, wing: 'right' },
  { id: '109', floor: 1, wing: 'right' },

  // Tầng 2 (7 phòng)
  // Cánh trái (3 phòng)
  { id: '202', floor: 2, wing: 'left' },
  { id: '203', floor: 2, wing: 'left' },
  { id: '204', floor: 2, wing: 'left' },
  // Cánh phải (4 phòng)
  { id: '206', floor: 2, wing: 'right' },
  { id: '207', floor: 2, wing: 'right' },
  { id: '208', floor: 2, wing: 'right' },
  { id: '209', floor: 2, wing: 'right' },
];

export const SHIFTS = Object.values(Shift);

export const DEFAULT_IMPORT_CONFIG: ImportConfig = {
  maLopCol: 1,
  maHocPhanCol: 2,
  maLopThiCol: 3,
  tenHocPhanCol: 7,
  ngayThiCol: 4,
  kipThiCol: 5,
  slSvCol: 11,
  phongThiCol: 6,
  giangVienCol: 8,
  nguoiTrucCol: 9,
  nguoiTrongThiCol: 10,
  maxStudentsPerRoom: 37,
};

export const DEFAULT_ACADEMIC_WEEKS: AcademicWeek[] = [
  {
    id: 'w17-2026',
    weekNumber: 17,
    startDate: new Date(2026, 0, 12).toISOString(), // 12/01/2026
    endDate: new Date(2026, 0, 18).toISOString(),   // 18/01/2026
  }
];

export const SHIFT_DETAILS = {
  [Shift.KIP_1]: { start: '07:00', end: '09:30' },
  [Shift.KIP_2]: { start: '09:30', end: '12:00' },
  [Shift.KIP_3]: { start: '12:30', end: '15:00' },
  [Shift.KIP_4]: { start: '15:00', end: '17:30' },
  [Shift.KIP_5]: { start: '17:30', end: '20:00' },
};
