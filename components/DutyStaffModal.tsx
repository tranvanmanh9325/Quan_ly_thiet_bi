
import React, { useState } from 'react';
import { X, UserCheck, Clock, Calendar as CalendarIcon, Map } from 'lucide-react';
import { format } from 'date-fns';
import { Shift, DutyStaff } from '../types';
import { SHIFTS } from '../constants';

interface DutyStaffModalProps {
  onClose: () => void;
  onSubmit: (staff: Partial<DutyStaff>) => void;
  initialDate: Date;
  initialShift: Shift;
}

const DutyStaffModal: React.FC<DutyStaffModalProps> = ({ onClose, onSubmit, initialDate, initialShift }) => {
  const [formData, setFormData] = useState({
    name: '',
    floor: 1,
    date: format(initialDate, 'yyyy-MM-dd'),
    shift: initialShift,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-6 bg-emerald-600 text-white flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Phân công trực kỹ thuật</h2>
            <p className="text-emerald-100 text-xs mt-1">Giao nhiệm vụ trực tầng cho nhân viên</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form className="p-8 space-y-6" onSubmit={(e) => {
          e.preventDefault();
          onSubmit(formData);
        }}>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 flex items-center gap-2">
              <UserCheck className="w-3.5 h-3.5" />
              Tên nhân viên kỹ thuật
            </label>
            <input 
              type="text"
              placeholder="Nhập họ và tên..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 flex items-center gap-2">
                <Map className="w-3.5 h-3.5" />
                Trực tại tầng
              </label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500"
                value={formData.floor}
                onChange={e => setFormData({...formData, floor: parseInt(e.target.value)})}
              >
                <option value={1}>Tầng 1</option>
                <option value={2}>Tầng 2</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 flex items-center gap-2">
                <CalendarIcon className="w-3.5 h-3.5" />
                Ngày trực
              </label>
              <input 
                type="date"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500"
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              Chọn kíp trực
            </label>
            <select 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500"
              value={formData.shift}
              onChange={e => setFormData({...formData, shift: e.target.value as Shift})}
            >
              {SHIFTS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
            >
              Hủy
            </button>
            <button 
              type="submit"
              className="flex-[2] py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all"
            >
              Lưu phân công
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DutyStaffModal;
