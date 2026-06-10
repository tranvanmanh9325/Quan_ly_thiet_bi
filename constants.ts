
import { Room, Shift, ImportConfig, AcademicWeek } from './types';

// Generate rooms for 10 floors dynamically
const generateRooms = (): Room[] => {
  const rooms: Room[] = [];

  for (let floor = 1; floor <= 10; floor++) {
    const prefix = floor.toString();

    // Left wing: rooms X02, X03, X04 (Floors 2-10 only)
    if (floor >= 2) {
      for (let r = 2; r <= 4; r++) {
        rooms.push({ id: `${prefix}0${r}`, floor, wing: 'left' });
      }
    }

    // Right wing: rooms X06, X07, X08, X09
    for (let r = 6; r <= 9; r++) {
      rooms.push({ id: `${prefix}0${r}`, floor, wing: 'right' });
    }
  }

  return rooms;
};

export const ROOMS: Room[] = generateRooms();

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
