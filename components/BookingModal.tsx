
import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Clock, User, FileText, LayoutGrid, AlertCircle, ShieldCheck } from 'lucide-react';
import { format, isSameDay, parseISO } from 'date-fns';
import { Room, Shift, Booking } from '../types';
import { SHIFTS } from '../constants';

interface BookingModalProps {
  onClose: () => void;
  onSubmit: (booking: Partial<Booking>) => void;
  initialDate: Date;
  initialShift: Shift;
  initialRoomId?: string;
  rooms: Room[];
  bookings: Booking[];
}

const BookingModal: React.FC<BookingModalProps> = ({ onClose, onSubmit, initialDate, initialShift, initialRoomId, rooms, bookings }) => {
  const [formData, setFormData] = useState({
    roomId: initialRoomId || '106',
    date: format(initialDate, 'yyyy-MM-dd'),
    shift: initialShift,
    user: '',
    purpose: '',
    proctor: ''
  });

  // Re-sync if props change while modal is somehow still open or remounting
  useEffect(() => {
    if (initialRoomId) {
      setFormData(prev => ({ ...prev, roomId: initialRoomId }));
    }
  }, [initialRoomId]);

  const isRoomOccupied = (roomId: string) => {
    const targetDate = parseISO(formData.date);
    return bookings.some(b => 
      isSameDay(new Date(b.date), targetDate) && 
      b.shift === formData.shift && 
      b.roomId === roomId
    );
  };

  const isCurrentRoomUnavailable = isRoomOccupied(formData.roomId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <div className="px-6 py-6 bg-indigo-600 text-white flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-bold">Đăng ký sử dụng phòng</h2>
            <p className="text-indigo-100 text-xs mt-1">Vui lòng điền đầy đủ thông tin bên dưới</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form className="p-8 space-y-5 overflow-y-auto custom-scrollbar" onSubmit={(e) => {
          e.preventDefault();
          if (isCurrentRoomUnavailable) return;
          onSubmit(formData);
        }}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 flex items-center gap-2">
                <LayoutGrid className="w-3.5 h-3.5" />
                Chọn phòng máy
              </label>
              <select 
                className={`w-full bg-slate-50 border rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-colors ${isCurrentRoomUnavailable ? 'border-rose-300 ring-rose-50' : 'border-slate-200'}`}
                value={formData.roomId}
                onChange={e => setFormData({...formData, roomId: e.target.value})}
              >
                {rooms.map(r => {
                  const occupied = isRoomOccupied(r.id);
                  return (
                    <option key={r.id} value={r.id} disabled={occupied} className={occupied ? 'text-slate-300 bg-slate-50' : ''}>
                      Phòng {r.id} {occupied ? '(Đã bận)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 flex items-center gap-2">
                <CalendarIcon className="w-3.5 h-3.5" />
                Ngày sử dụng
              </label>
              <input 
                type="date"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500"
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              Chọn kíp học
            </label>
            <select 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500"
              value={formData.shift}
              onChange={e => setFormData({...formData, shift: e.target.value as Shift})}
            >
              {SHIFTS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {isCurrentRoomUnavailable && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 animate-pulse">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-700 font-medium">
                Phòng {formData.roomId} đã có người đăng ký trong {formData.shift.split(' (')[0]} vào ngày {formData.date}. Vui lòng chọn phòng khác.
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 flex items-center gap-2">
                <User className="w-3.5 h-3.5" />
                Giảng viên đăng ký
              </label>
              <input 
                type="text"
                placeholder="Họ tên..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500"
                value={formData.user}
                onChange={e => setFormData({...formData, user: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Người trông thi
              </label>
              <input 
                type="text"
                placeholder="Họ tên..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500"
                value={formData.proctor}
                onChange={e => setFormData({...formData, proctor: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" />
              Mục đích sử dụng
            </label>
            <textarea 
              rows={2}
              placeholder="VD: Thi học kỳ 1 lớp CNTT..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 resize-none"
              value={formData.purpose}
              onChange={e => setFormData({...formData, purpose: e.target.value})}
              required
            />
          </div>

          <div className="pt-2 flex gap-3 sticky bottom-0 bg-white">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
            >
              Hủy bỏ
            </button>
            <button 
              type="submit"
              disabled={isCurrentRoomUnavailable}
              className={`flex-[2] py-3 text-white rounded-xl font-bold shadow-lg transition-all ${isCurrentRoomUnavailable ? 'bg-slate-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'}`}
            >
              Xác nhận đăng ký
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;
