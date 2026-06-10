
import React, { useMemo } from 'react';
import { Room, Booking, Shift } from '../types';
import { SHIFT_DETAILS } from '../constants';
import { isSameDay } from 'date-fns';

interface BuildingMapProps {
  rooms: Room[];
  bookings: Booking[];
  onRoomClick: (room: Room) => void;
  now: Date;
}

const TOTAL_FLOORS = 10;
const LEFT_COLS = 3;   // rooms X02, X03, X04
const RIGHT_COLS = 4;  // rooms X06, X07, X08, X09
const LEFT_FLOOR_START = 2; // left wing starts at floor 2

interface FloorGrid {
  floor: number;
  leftRoomIds: (string | null)[];
  rightRoomIds: string[];
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

  // Build grid data: highest floor first (top) → lowest floor last (bottom)
  const floors: FloorGrid[] = useMemo(() => {
    const result: FloorGrid[] = [];
    for (let f = TOTAL_FLOORS; f >= 1; f--) {
      const leftRoomIds: (string | null)[] = [];
      const rightRoomIds: string[] = [];

      if (f >= LEFT_FLOOR_START) {
        for (let c = 2; c <= 4; c++) {
          leftRoomIds.push(`${f}0${c}`);
        }
      }

      for (let c = 6; c <= 9; c++) {
        rightRoomIds.push(`${f}0${c}`);
      }

      result.push({ floor: f, leftRoomIds, rightRoomIds });
    }
    return result;
  }, []);

  // Left grid rows: floors 10 down to 2 (9 rows)
  const leftFloors = floors.filter(f => f.floor >= LEFT_FLOOR_START);
  // Right grid rows: floors 10 down to 1 (10 rows)
  const rightFloors = floors;

  return (
    <div className="relative w-full overflow-x-auto select-none">
      <div className="px-[150px] py-10 min-w-max">
        <div className="relative flex items-start gap-0 mx-auto w-fit">

        {/* === LEFT WING === */}
        <div
          className="origin-bottom-right ml-[100px]"
          style={{ transform: 'rotate(-12deg) translateY(2rem)' }}
        >
          <div
            className="grid gap-2.5"
            style={{
              gridTemplateColumns: `repeat(${LEFT_COLS}, 1fr)`,
              gridTemplateRows: `repeat(${leftFloors.length}, 1fr)`,
            }}
          >
            {leftFloors.map((floorData) =>
              floorData.leftRoomIds.map((roomId, colIdx) => {
                if (!roomId) return <EmptySlot key={`l-${floorData.floor}-${colIdx}`} />;
                const booking = getRoomBooking(roomId);
                return (
                  <RoomBox
                    key={roomId}
                    roomId={roomId}
                    occupied={!!booking}
                    isActive={booking ? isShiftActive(booking.shift, booking.date) : false}
                    user={booking?.user}
                    floor={floorData.floor}
                    onClick={() => onRoomClick(rooms.find(r => r.id === roomId)!)}
                  />
                );
              })
            )}
          </div>
        </div>

        {/* === CENTER BADGE === */}
        <div className="flex flex-col items-center z-10 -translate-y-6 mx-2 flex-shrink-0">
          <div className="group relative">
            <div className="absolute inset-0 bg-indigo-600 blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <div className="relative px-8 py-3 bg-slate-900 text-white text-lg font-black uppercase tracking-[0.5em] rounded-2xl shadow-2xl border-2 border-white ring-8 ring-indigo-50/50">
              B1
            </div>
          </div>
          <div className="w-1 h-24 bg-gradient-to-b from-slate-200 to-transparent mt-2 rounded-full opacity-50"></div>
        </div>

        {/* === RIGHT WING === */}
        <div
          className="origin-bottom-left"
          style={{ transform: 'rotate(12deg) translateY(2rem)' }}
        >
          <div
            className="grid gap-2.5"
            style={{
              gridTemplateColumns: `repeat(${RIGHT_COLS}, 1fr)`,
              gridTemplateRows: `repeat(${rightFloors.length}, 1fr)`,
            }}
          >
            {rightFloors.map((floorData) =>
              floorData.rightRoomIds.map((roomId, colIdx) => {
                const booking = getRoomBooking(roomId);
                return (
                  <RoomBox
                    key={roomId}
                    roomId={roomId}
                    occupied={!!booking}
                    isActive={booking ? isShiftActive(booking.shift, booking.date) : false}
                    user={booking?.user}
                    floor={floorData.floor}
                    onClick={() => onRoomClick(rooms.find(r => r.id === roomId)!)}
                  />
                );
              })
            )}
          </div>
        </div>

        </div>
      </div>
    </div>
  );
};

const EmptySlot: React.FC = () => (
  <div className="w-24 h-20 rounded-2xl border border-dashed border-slate-100 bg-slate-50/20 flex items-center justify-center text-[7px] font-bold text-slate-200 opacity-30 uppercase tracking-widest">
    Không phòng
  </div>
);

const RoomBox: React.FC<{ 
  roomId: string; 
  occupied: boolean; 
  isActive: boolean;
  user?: string; 
  floor: number;
  onClick: () => void;
}> = ({ roomId, occupied, isActive, user, floor, onClick }) => {
  // Derive status for clear 3-way branching
  const status: 'active' | 'booked' | 'empty' = isActive ? 'active' : occupied ? 'booked' : 'empty';

  const styles = {
    active: {
      card: 'bg-rose-50 border-rose-500 shadow-xl shadow-rose-100 ring-2 ring-rose-200 z-10',
      title: 'text-rose-700',
      pill: 'bg-rose-500 text-white',
      pillText: 'ĐANG THI',
      userName: 'text-rose-500',
      floorBadge: 'text-rose-900',
    },
    booked: {
      card: 'bg-blue-50 border-blue-500 shadow-xl shadow-blue-100 ring-2 ring-blue-200 z-10',
      title: 'text-blue-700',
      pill: 'bg-blue-500 text-white',
      pillText: 'ĐÃ ĐẶT',
      userName: 'text-blue-500',
      floorBadge: 'text-blue-900',
    },
    empty: {
      card: 'bg-white border-slate-200 shadow-sm hover:border-indigo-500 hover:shadow-indigo-100 hover:scale-105 active:scale-95',
      title: 'text-slate-800',
      pill: 'bg-slate-50 text-slate-300 group-hover:text-indigo-600 group-hover:bg-indigo-50',
      pillText: 'CÒN TRỐNG',
      userName: '',
      floorBadge: 'text-slate-900',
    },
  } as const;

  const s = styles[status];

  return (
    <button
      onClick={onClick}
      className={`
        relative w-24 h-20 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center justify-center overflow-hidden group p-2
        ${s.card}
      `}
    >
      <div className={`text-xs font-black uppercase tracking-tighter ${s.title}`}>
        P.{roomId}
      </div>

      {/* Status pill — always visible for immediate status recognition */}
      <div className={`mt-1 px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest transition-all ${s.pill}`}>
        {s.pillText}
      </div>

      {/* User name — only rendered when a booking exists */}
      {occupied && user && (
        <div className={`px-1 text-[7px] font-bold ${s.userName} text-center leading-[1.1] w-full uppercase break-words line-clamp-1`}>
          {user}
        </div>
      )}

      <div className={`absolute top-1 right-2 text-[8px] font-black opacity-10 ${s.floorBadge}`}>
        F{floor}
      </div>
    </button>
  );
};

export default BuildingMap;
