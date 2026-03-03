
import React from 'react';
import { X, Calendar, Clock, User, FileText, LayoutGrid, ShieldCheck, Tag } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Booking, Shift } from '../types';
import { SHIFT_DETAILS } from '../constants';

interface BookingDetailModalProps {
  booking: Booking;
  onClose: () => void;
  now: Date;
}

const BookingDetailModal: React.FC<BookingDetailModalProps> = ({ booking, onClose, now }) => {
  const isShiftActive = (shift: Shift, date: string) => {
    if (!isSameDay(new Date(date), now)) return false;
    const times = SHIFT_DETAILS[shift];
    if (!times) return false;
    const [startH, startM] = times.start.split(':').map(Number);
    const [endH, endM] = times.end.split(':').map(Number);
    const startTime = new Date(now).setHours(startH, startM, 0);
    const endTime = new Date(now).setHours(endH, endM, 0);
    return now.getTime() >= startTime && now.getTime() <= endTime;
  };

  const active = isShiftActive(booking.shift, booking.date);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300 border border-slate-100">
        <div className="px-8 pt-8 pb-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {active ? (
                <span className="bg-rose-100 text-rose-600 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-tighter border border-rose-200">Đang được dùng</span>
              ) : (
                <span className="bg-blue-100 text-blue-600 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-tighter border border-blue-200">Đã được xếp lịch</span>
              )}
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Phòng {booking.roomId}</h2>
            <p className="text-slate-400 text-xs font-medium mt-1 uppercase tracking-widest">{booking.shift.split(' (')[0]}</p>
          </div>
          <button onClick={onClose} className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-2xl transition-all active:scale-95">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="px-8 pb-10 space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 shadow-inner">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Ngày đăng ký</p>
                <p className="text-sm font-black text-slate-800">{format(new Date(booking.date), 'EEEE, dd/MM/yyyy', { locale: vi })}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 shadow-inner">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Khung giờ</p>
                <p className="text-sm font-black text-slate-800">{booking.shift.match(/\((.*?)\)/)?.[1] || booking.shift}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex items-start gap-4">
              <div className="mt-1"><User className="w-4 h-4 text-slate-300" /></div>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Giảng viên phụ trách</p>
                <p className="text-base font-bold text-slate-800 leading-tight">{booking.user}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="mt-1"><ShieldCheck className="w-4 h-4 text-emerald-400" /></div>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Người trông thi</p>
                <p className="text-base font-bold text-slate-800 leading-tight">{booking.proctor}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="mt-1"><Tag className="w-4 h-4 text-slate-300" /></div>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nội dung / Mục đích</p>
                <p className="text-sm font-medium text-slate-600 italic bg-slate-50 p-4 rounded-2xl border border-slate-100 leading-relaxed">"{booking.purpose}"</p>
              </div>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm tracking-widest uppercase hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95"
          >
            Đóng thông tin
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailModal;
