
export enum Shift {
  KIP_1 = 'Kíp 1 (07:00-09:30)',
  KIP_2 = 'Kíp 2 (09:30-12:00)',
  KIP_3 = 'Kíp 3 (12:30-15:00)',
  KIP_4 = 'Kíp 4 (15:00-17:30)',
  KIP_5 = 'Kíp 5 (17:30-20:00)',
}

export type UserRole = 'admin' | 'staff' | 'guest';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatar?: string;
}

export interface Room {
  id: string;
  floor: number;
  wing: 'left' | 'right';
  description?: string;
}

export interface Booking {
  id: string;
  roomId: string;
  date: string; // ISO string
  shift: Shift;
  user: string;
  purpose: string;
  proctor: string;
}

export interface DutyStaff {
  id: string;
  name: string;
  floor: number;
  shift: Shift;
  date: string; // ISO string
}

export type ViewType = 'day' | 'week' | 'month' | 'year';

export interface CalendarState {
  currentDate: Date;
  view: ViewType;
}

export interface ImportConfig {
  maLopCol: number;
  maHocPhanCol: number;
  tenHocPhanCol: number;
  ngayThiCol: number;
  kipThiCol: number;
  slSvCol: number;
  phongThiCol: number;
  maLopThiCol: number;
  giangVienCol: number;
  nguoiTrucCol: number;
  nguoiTrongThiCol: number;
  maxStudentsPerRoom: number;
}

export interface AcademicWeek {
  id: string;
  weekNumber: number;
  startDate: string; // ISO string
  endDate: string;   // ISO string
}
