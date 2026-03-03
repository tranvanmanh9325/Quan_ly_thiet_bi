
import React, { useState, useMemo } from 'react';
import { X, BarChart3, Clock, User, Layout, Calendar, Download, PieChart, TrendingUp } from 'lucide-react';
import { format, isWithinInterval, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Booking, Room } from '../types';

interface StatsModalProps {
  onClose: () => void;
  bookings: Booking[];
  rooms: Room[];
}

const StatsModal: React.FC<StatsModalProps> = ({ onClose, bookings, rooms }) => {
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });

  const filteredBookings = useMemo(() => {
    try {
      const start = parseISO(dateRange.start);
      const end = parseISO(dateRange.end);
      return bookings.filter(b => {
        const d = new Date(b.date);
        return isWithinInterval(d, { start, end });
      });
    } catch {
      return [];
    }
  }, [bookings, dateRange]);

  const roomStats = useMemo(() => {
    const stats: Record<string, number> = {};
    rooms.forEach(r => stats[r.id] = 0);
    filteredBookings.forEach(b => {
      if (stats[b.roomId] !== undefined) stats[b.roomId]++;
    });
    return Object.entries(stats).sort((a, b) => b[1] - a[1]);
  }, [filteredBookings, rooms]);

  const proctorStats = useMemo(() => {
    const stats: Record<string, number> = {};
    filteredBookings.forEach(b => {
      if (b.proctor && b.proctor !== 'Chưa phân công' && b.proctor !== 'N/A') {
        stats[b.proctor] = (stats[b.proctor] || 0) + 1;
      }
    });
    return Object.entries(stats).sort((a, b) => b[1] - a[1]);
  }, [filteredBookings]);

  const totalShifts = filteredBookings.length;
  const totalHours = totalShifts * 2.5;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-[2.5rem] w-full max-w-4xl shadow-2xl overflow-hidden animate-in zoom-in fade-in duration-200 flex flex-col max-h-[90vh]">
        <div className="px-8 py-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500 p-2 rounded-xl">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">Thống kê & Báo cáo</h2>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Tần suất sử dụng & Hiệu suất trông thi</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-slate-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Khoảng thời gian</label>
              <div className="flex gap-2">
                <input 
                  type="date" 
                  value={dateRange.start}
                  onChange={e => setDateRange({...dateRange, start: e.target.value})}
                  className="flex-1 bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500"
                />
                <input 
                  type="date" 
                  value={dateRange.end}
                  onChange={e => setDateRange({...dateRange, end: e.target.value})}
                  className="flex-1 bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-4">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <Layout className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Tổng lượt kíp</p>
                <p className="text-xl font-black text-slate-900">{totalShifts}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Tổng giờ phòng máy</p>
                <p className="text-xl font-black text-slate-900">{totalHours.toLocaleString()}h</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Room Usage Stats */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight">
                  <TrendingUp className="w-4 h-4 text-indigo-500" />
                  Tần suất sử dụng phòng
                </h3>
                <div className="text-[9px] font-bold text-slate-400 uppercase bg-slate-50 px-2 py-1 rounded-lg">Top Bận</div>
              </div>
              <div className="space-y-4">
                {roomStats.map(([id, count]) => {
                  const percentage = totalShifts > 0 ? (count / Math.max(...roomStats.map(s => s[1]))) * 100 : 0;
                  return (
                    <div key={id} className="space-y-1.5">
                      <div className="flex justify-between items-end">
                        <span className="text-xs font-black text-slate-700">Phòng {id}</span>
                        <span className="text-[10px] font-bold text-slate-400">{count} kíp ({count * 2.5}h)</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Proctoring Performance */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight">
                  <User className="w-4 h-4 text-emerald-500" />
                  Cán bộ trông thi nhiều nhất
                </h3>
                <div className="text-[9px] font-bold text-slate-400 uppercase bg-slate-50 px-2 py-1 rounded-lg">Báo cáo hiệu suất</div>
              </div>
              <div className="space-y-3">
                {proctorStats.length > 0 ? proctorStats.map(([name, count], idx) => (
                  <div key={name} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 group hover:border-indigo-300 transition-all">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-black text-[10px] text-indigo-600 shadow-sm">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{name}</p>
                      <p className="text-[10px] text-slate-400 font-medium">Tổng {count * 2.5} giờ trông thi</p>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-900">{count} kíp</span>
                    </div>
                  </div>
                )) : (
                  <div className="py-12 text-center text-slate-300 italic text-xs">Không có dữ liệu trông thi trong khoảng này.</div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex gap-4 shrink-0">
          <button 
            onClick={onClose}
            className="flex-1 py-4 bg-white text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest border border-slate-200 hover:bg-slate-50 transition-all"
          >
            Đóng báo cáo
          </button>
          <button 
            className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" /> Xuất Excel (Báo cáo)
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatsModal;
