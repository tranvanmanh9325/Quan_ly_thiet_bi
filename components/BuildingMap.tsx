
import React from 'react';
import { Room, Booking, Shift } from '../types';
import { SHIFT_DETAILS } from '../constants';
import { isSameDay } from 'date-fns';

interface BuildingMapProps {
  rooms: Room[];
  bookings: Booking[];
  onRoomClick: (room: Room) => void;
  now: Date;
}

const BuildingMap: React.FC<BuildingMapProps> = ({ rooms, bookings, onRoomClick, now }) => {
  const getRoomBooking = (roomId: string) => bookings.find(b => b.roomId === roomId);

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

  const leftWingSlots = [
    { f1: null, f2: '202' },
    { f1: null, f2: '203' },
    { f1: null, f2: '204' }
  ];
  
  const rightWingSlots = [
    { f1: '106', f2: '206' },
    { f1: '107', f2: '207' },
    { f1: '108', f2: '208' },
    { f1: '109', f2: '209' }
  ];

  return (
    <div className="relative w-full max-w-5xl min-h-[400px] flex items-start justify-center pt-12 select-none">
      <div className="relative flex items-start gap-4">
        <div className="flex gap-4 items-end -rotate-[15deg] origin-right translate-y-8">
          {leftWingSlots.map((slot, idx) => {
            const booking = getRoomBooking(slot.f2);
            return (
              <div key={idx} className="flex flex-col gap-3">
                <RoomBox 
                  roomId={slot.f2} 
                  occupied={!!booking} 
                  isActive={booking ? isShiftActive(booking.shift, booking.date) : false}
                  user={booking?.user}
                  floor={2}
                  onClick={() => onRoomClick(rooms.find(r => r.id === slot.f2)!)}
                />
                <div className="w-24 h-20 rounded-2xl border border-dashed border-slate-100 bg-slate-50/20 flex items-center justify-center text-[7px] font-bold text-slate-200 opacity-30 uppercase tracking-widest">Không phòng</div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col items-center z-10 -translate-y-6">
          <div className="group relative">
            <div className="absolute inset-0 bg-indigo-600 blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <div className="relative px-8 py-3 bg-slate-900 text-white text-lg font-black uppercase tracking-[0.5em] rounded-2xl shadow-2xl border-2 border-white ring-8 ring-indigo-50/50">
              B1
            </div>
          </div>
          <div className="w-1 h-24 bg-gradient-to-b from-slate-200 to-transparent mt-2 rounded-full opacity-50"></div>
        </div>

        <div className="flex gap-4 items-start rotate-[15deg] origin-left translate-y-8">
          {rightWingSlots.map((slot, idx) => {
            const booking2 = getRoomBooking(slot.f2);
            const booking1 = getRoomBooking(slot.f1!);
            return (
              <div key={idx} className="flex flex-col gap-3">
                <RoomBox 
                  roomId={slot.f2} 
                  occupied={!!booking2} 
                  isActive={booking2 ? isShiftActive(booking2.shift, booking2.date) : false}
                  user={booking2?.user}
                  floor={2}
                  onClick={() => onRoomClick(rooms.find(r => r.id === slot.f2)!)}
                />
                <RoomBox 
                  roomId={slot.f1!} 
                  occupied={!!booking1} 
                  isActive={booking1 ? isShiftActive(booking1.shift, booking1.date) : false}
                  user={booking1?.user}
                  floor={1}
                  onClick={() => onRoomClick(rooms.find(r => r.id === slot.f1)!)}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const RoomBox: React.FC<{ 
  roomId: string; 
  occupied: boolean; 
  isActive: boolean;
  user?: string; 
  floor: number;
  onClick: () => void;
}> = ({ roomId, occupied, isActive, user, floor, onClick }) => (
  <button
    onClick={onClick}
    className={`
      relative w-24 h-20 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center justify-center overflow-hidden group p-2
      ${isActive 
        ? 'bg-rose-50 border-rose-500 shadow-xl shadow-rose-100 ring-2 ring-rose-200 z-10' 
        : occupied
          ? 'bg-blue-50 border-blue-500 shadow-xl shadow-blue-100 ring-2 ring-blue-200 z-10' 
          : 'bg-white border-slate-200 shadow-sm hover:border-indigo-500 hover:shadow-indigo-100 hover:scale-105 active:scale-95'
      }
    `}
  >
    <div className={`text-xs font-black uppercase tracking-tighter ${isActive ? 'text-rose-700' : occupied ? 'text-blue-700' : 'text-slate-800'}`}>
      P.{roomId}
    </div>
    
    {occupied ? (
      <div className={`mt-1 px-1 text-[8px] font-bold ${isActive ? 'text-rose-500' : 'text-blue-500'} text-center leading-[1.2] w-full uppercase break-words line-clamp-2`}>
        {user}
      </div>
    ) : (
      <div className="mt-1.5 px-2 py-0.5 rounded-full bg-slate-50 text-[7px] font-black text-slate-300 uppercase tracking-widest group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all">
        CÒN TRỐNG
      </div>
    )}

    <div className={`absolute top-1 right-2 text-[8px] font-black opacity-10 ${isActive ? 'text-rose-900' : occupied ? 'text-blue-900' : 'text-slate-900'}`}>
      F{floor}
    </div>
  </button>
);

export default BuildingMap;
