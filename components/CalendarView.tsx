
import React from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, startOfMonth, endOfMonth, isSameMonth, startOfYear, endOfYear, eachMonthOfInterval, isWithinInterval } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Booking, ViewType, Shift, AcademicWeek } from '../types';
import { SHIFTS } from '../constants';

interface CalendarViewProps {
  view: ViewType;
  currentDate: Date;
  bookings: Booking[];
  selectedShift: Shift;
  onDateSelect: (date: Date) => void;
  onViewChange: (view: ViewType) => void;
  academicWeeks: AcademicWeek[];
}

const CalendarView: React.FC<CalendarViewProps> = ({ view, currentDate, bookings, selectedShift, onDateSelect, onViewChange, academicWeeks }) => {
  const getBookingsForSlot = (date: Date, shift: Shift) => {
    return bookings.filter(b => isSameDay(new Date(b.date), date) && b.shift === shift);
  };

  const getAcademicWeek = (date: Date) => {
    return academicWeeks.find(w => isWithinInterval(date, { start: new Date(w.startDate), end: new Date(w.endDate) }));
  };

  const handleDayClick = (day: Date) => {
    onDateSelect(day);
    onViewChange('day');
  };

  const handleMonthClick = (month: Date) => {
    onDateSelect(month);
    onViewChange('month');
  };

  if (view === 'week') {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start, end });

    return (
      <div className="overflow-x-auto bg-white rounded-3xl border border-slate-200 shadow-sm p-2 lg:p-6 custom-scrollbar">
        <table className="w-full min-w-[900px] border-collapse table-fixed">
          <thead>
            <tr>
              <th className="w-24 p-4 border-b border-slate-100 text-left text-slate-400 font-bold text-[10px] uppercase tracking-widest">Kíp / Thứ</th>
              {days.map(day => {
                const week = getAcademicWeek(day);
                const isToday = isSameDay(day, new Date());
                return (
                  <th 
                    key={day.toString()} 
                    onClick={() => handleDayClick(day)}
                    className={`p-4 border-b border-slate-100 text-center cursor-pointer hover:bg-slate-50 transition-colors rounded-t-2xl ${isToday ? 'bg-indigo-50/30' : ''}`}
                  >
                    {week && <div className="text-[7px] font-black text-indigo-500 bg-indigo-50 rounded-full px-1.5 py-0.5 mb-1 inline-block uppercase">Tuần {week.weekNumber}</div>}
                    <div className={`text-[10px] uppercase tracking-widest font-bold ${isToday ? 'text-indigo-600' : 'text-slate-400'}`}>
                      {format(day, 'EEEE', { locale: vi })}
                    </div>
                    <div className={`text-lg font-black ${isToday ? 'text-indigo-600' : 'text-slate-800'}`}>
                      {format(day, 'dd/MM')}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {SHIFTS.map(shift => (
              <tr key={shift} className="group hover:bg-slate-50/30 transition-colors">
                <td className="p-4 border-b border-slate-50 font-bold text-slate-500 text-[9px] uppercase tracking-tighter align-top pt-6">
                  {shift.split(' ')[1]}
                  <div className="text-[7px] text-slate-300 font-medium mt-1 uppercase tracking-normal">
                    {shift.match(/\((.*?)\)/)?.[1] || ''}
                  </div>
                </td>
                {days.map(day => {
                  const slotBookings = getBookingsForSlot(day, shift);
                  const isSelected = shift === selectedShift && isSameDay(day, currentDate);
                  
                  return (
                    <td 
                      key={day.toString()} 
                      onClick={() => handleDayClick(day)}
                      className={`p-2 border-b border-slate-50 align-top min-h-[120px] transition-all cursor-pointer ${isSelected ? 'bg-indigo-50/40' : 'hover:bg-indigo-50/10'}`}
                    >
                      <div className="flex flex-col gap-1.5 min-h-[100px]">
                        {slotBookings.length > 0 ? (
                          <>
                            {slotBookings.slice(0, 3).map(b => (
                              <div 
                                key={b.id} 
                                className={`text-[9px] px-2 py-1.5 rounded-lg border flex flex-col gap-0.5 shadow-sm transition-transform hover:scale-[1.02]
                                  ${isSelected ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-white text-slate-700 border-slate-100'}`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <span className="font-black text-[10px]">P.{b.roomId}</span>
                                <span className="truncate opacity-80 font-bold leading-none">{b.user}</span>
                              </div>
                            ))}
                            {slotBookings.length > 3 && (
                              <div className="text-[8px] font-black px-2 py-0.5 rounded-full text-center mt-1 bg-slate-100 text-slate-400">
                                +{slotBookings.length - 3} PHÒNG
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="flex-1 flex items-center justify-center opacity-5 group-hover:opacity-10 transition-opacity">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (view === 'month') {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const calendarStart = startOfWeek(start, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(end, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    return (
      <div className="grid grid-cols-7 gap-px bg-slate-200 border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
        {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'].map(d => (
          <div key={d} className="bg-slate-50 p-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{d}</div>
        ))}
        {days.map(day => {
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isToday = isSameDay(day, new Date());
          const dailyBookings = bookings.filter(b => isSameDay(new Date(b.date), day));
          const week = getAcademicWeek(day);
          
          return (
            <div 
              key={day.toString()} 
              onClick={() => handleDayClick(day)}
              className={`min-h-[150px] bg-white p-3 flex flex-col gap-2 transition-all cursor-pointer hover:bg-indigo-50/20 ${!isCurrentMonth ? 'opacity-20' : ''} ${isToday ? 'bg-indigo-50/40 ring-2 ring-inset ring-indigo-100' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className={`text-base font-black ${isToday ? 'text-indigo-600' : 'text-slate-400'}`}>
                  {format(day, 'd')}
                </div>
                {week && <div className="text-[7px] font-black text-indigo-400 uppercase">W{week.weekNumber}</div>}
              </div>
              <div className="flex flex-col gap-1">
                {dailyBookings.slice(0, 4).map(b => (
                  <div key={b.id} className="text-[8px] px-1.5 py-1 bg-white border border-slate-100 text-slate-700 rounded-md shadow-sm truncate font-bold">
                    <span className="text-indigo-600 mr-1">P.{b.roomId}</span>
                    {b.user}
                  </div>
                ))}
                {dailyBookings.length > 4 && (
                  <div className="text-[7px] text-slate-400 font-black px-1 py-0.5 rounded-full bg-slate-50 text-center uppercase">
                    +{dailyBookings.length - 4} Lịch
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (view === 'year') {
    const months = eachMonthOfInterval({ start: startOfYear(currentDate), end: endOfYear(currentDate) });
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {months.map(month => {
          const count = bookings.filter(b => isSameMonth(new Date(b.date), month)).length;
          const isActive = isSameMonth(month, new Date());
          return (
            <div 
              key={month.toString()} 
              onClick={() => handleMonthClick(month)}
              className={`bg-white p-8 rounded-[2.5rem] border transition-all group cursor-pointer hover:shadow-xl hover:-translate-y-1 ${isActive ? 'border-indigo-200 ring-4 ring-indigo-50' : 'border-slate-200'}`}
            >
              <h4 className="text-xl font-black text-slate-900 capitalize mb-1 group-hover:text-indigo-600 transition-colors">{format(month, 'MMMM', { locale: vi })}</h4>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-6">Mật độ sử dụng</p>
              <div className="flex items-end justify-between">
                <div className="text-5xl font-black text-indigo-600 tracking-tighter">{count}</div>
                <div className="text-[9px] text-slate-400 uppercase font-black text-right leading-tight">
                  Lượt thi<br/><span className="text-slate-300">Đã đăng ký</span>
                </div>
              </div>
              <div className="mt-6 w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
                <div className={`h-full bg-indigo-500 rounded-full transition-all duration-1000`} style={{ width: `${Math.min(100, (count / 60) * 100)}%` }}></div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return null;
};

export default CalendarView;
