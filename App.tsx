
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  ChevronLeft, ChevronRight, Plus, Search, Layers, Clock, UserCheck, Calendar as CalendarIcon,
  FileUp, BarChart3, Settings, Loader2, CheckCircle2, Download, AlertCircle, Check, RotateCcw,
  LogOut, User as UserIcon, Wifi, WifiOff, RefreshCw
} from 'lucide-react';
import { format, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths, addYears, subYears, isSameDay, startOfWeek, endOfWeek, isValid, isWithinInterval } from 'date-fns';
import { vi } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { ROOMS, SHIFTS, DEFAULT_IMPORT_CONFIG, DEFAULT_ACADEMIC_WEEKS, SHIFT_DETAILS } from './constants';
import { Booking, Shift, ViewType, DutyStaff, Room, ImportConfig, AcademicWeek, User } from './types';
import BuildingMap from './components/BuildingMap';
import BookingModal from './components/BookingModal';
import CalendarView from './components/CalendarView';
import DutyStaffModal from './components/DutyStaffModal';
import BookingDetailModal from './components/BookingDetailModal';
import ConfigModal from './components/ConfigModal';
import StatsModal from './components/StatsModal';
import GeminiAssistant from './components/GeminiAssistant';
import AuthModal from './components/AuthModal';

const API_BASE_URL = "http://localhost:5000/api";
const API_BOOKINGS_URL = `${API_BASE_URL}/bookings`;
const API_AUTH_ME_URL = `${API_BASE_URL}/auth/me`;

interface AuthState {
  user: User | null;
  token: string | null;
}

interface PendingImport {
  newBookings: Booking[];
  overwritesCount: number;
  totalFound: number;
}

export default function App() {
  const [auth, setAuth] = useState<AuthState>(() => {
    const savedUser = localStorage.getItem('vlab_user');
    const savedToken = localStorage.getItem('vlab_token');
    return {
      user: savedUser ? JSON.parse(savedUser) : null,
      token: savedToken || null
    };
  });
  
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>('day');
  const [selectedShift, setSelectedShift] = useState<Shift>(Shift.KIP_1);
  const [importConfig, setImportConfig] = useState<ImportConfig>(DEFAULT_IMPORT_CONFIG);
  const [academicWeeks, setAcademicWeeks] = useState<AcademicWeek[]>(DEFAULT_ACADEMIC_WEEKS);
  
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isDutyModalOpen, setIsDutyModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [viewBooking, setViewBooking] = useState<Booking | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [preSelectedRoomId, setPreSelectedRoomId] = useState<string | undefined>(undefined);
  const [isImporting, setIsImporting] = useState(false);
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);
  
  const [now, setNow] = useState(new Date());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchBookings = async () => {
    setConnectionStatus('connecting');
    try {
      const response = await fetch(API_BOOKINGS_URL, { signal: AbortSignal.timeout(5000) });
      if (response.ok) {
        const data = await response.json();
        setBookings(data);
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('error');
      }
    } catch (err) {
      setConnectionStatus('error');
    }
  };

  // Kiểm tra phiên làm việc khi khởi chạy
  const verifySession = async (token: string) => {
    try {
      const response = await fetch(API_AUTH_ME_URL, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error('Session expired');
      }
      // Token còn hạn, có thể cập nhật lại thông tin user nếu cần
      const userData = await response.json();
      setAuth(prev => ({ ...prev, user: userData }));
    } catch (err) {
      console.warn("Phiên làm việc đã hết hạn hoặc không hợp lệ.");
      handleLogout();
      setIsAuthModalOpen(true); // Hiển thị đăng nhập lại
    }
  };

  useEffect(() => {
    fetchBookings();
    if (auth.token) {
      verifySession(auth.token);
    }
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (auth.user && auth.token) {
      localStorage.setItem('vlab_user', JSON.stringify(auth.user));
      localStorage.setItem('vlab_token', auth.token);
    } else {
      localStorage.removeItem('vlab_user');
      localStorage.removeItem('vlab_token');
    }
  }, [auth]);

  const handleLogout = () => {
    setAuth({ user: null, token: null });
  };

  const handleCreateBooking = async (b: Partial<Booking>) => {
    if (!auth.token) { setIsAuthModalOpen(true); return; }
    try {
      const response = await fetch(API_BOOKINGS_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
        body: JSON.stringify(b)
      });
      if (response.ok) {
        await fetchBookings();
        setIsBookingModalOpen(false);
      } else {
        const data = await response.json();
        if (response.status === 401 || response.status === 403) {
          handleLogout();
          setIsAuthModalOpen(true);
        }
        alert(data.message || "Lỗi khi lưu lịch thi.");
      }
    } catch (err) {
      alert("Lỗi kết nối tới server.");
    }
  };

  const confirmImport = async () => {
    if (!pendingImport || !auth.token) return;
    setIsImporting(true);
    try {
      const response = await fetch(`${API_BOOKINGS_URL}/import`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
        body: JSON.stringify({ bookings: pendingImport.newBookings })
      });
      if (response.ok) {
        await fetchBookings();
        setPendingImport(null);
      } else {
        const data = await response.json();
        if (response.status === 401 || response.status === 403) {
          handleLogout();
          setIsAuthModalOpen(true);
        }
        alert(data.message || "Lỗi khi nhập dữ liệu.");
      }
    } catch (err) {
      alert("Không thể kết nối tới server.");
    } finally {
      setIsImporting(false);
    }
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => isSameDay(new Date(b.date), currentDate) && b.shift === selectedShift);
  }, [bookings, currentDate, selectedShift]);

  const headerTitle = useMemo(() => {
    if (view === 'day') return format(currentDate, 'EEEE, dd MMMM yyyy', { locale: vi });
    if (view === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return `${format(start, 'dd/MM')} - ${format(end, 'dd/MM/yyyy')}`;
    }
    if (view === 'month') return format(currentDate, 'MMMM yyyy', { locale: vi });
    return format(currentDate, 'yyyy');
  }, [view, currentDate]);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 text-slate-900">
      {isAuthModalOpen && (
        <AuthModal 
          onSuccess={(res) => { setAuth({ user: res.user, token: res.token }); setIsAuthModalOpen(false); }} 
          onClose={() => setIsAuthModalOpen(false)} 
        />
      )}

      {isImporting && (
        <div className="fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-md flex items-center justify-center">
          <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl flex flex-col items-center gap-6 animate-in zoom-in duration-300">
            <Loader2 className="w-16 h-16 text-indigo-600 animate-spin" />
            <h3 className="font-black text-slate-900 text-2xl tracking-tight">Đang đồng bộ dữ liệu bảo mật...</h3>
          </div>
        </div>
      )}

      {connectionStatus === 'error' && (
        <div className="fixed top-0 left-0 right-0 z-[500] bg-rose-600 text-white py-2 px-4 flex items-center justify-center gap-4 animate-in slide-in-from-top duration-300">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm font-bold">Lỗi kết nối Backend. Vui lòng kiểm tra Server.</span>
          <button onClick={fetchBookings} className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg text-xs font-black flex items-center gap-2">
            <RefreshCw className="w-3 h-3" /> THỬ LẠI
          </button>
        </div>
      )}

      <aside className="w-full lg:w-96 bg-white border-r border-slate-200 flex flex-col p-6 space-y-6 lg:sticky lg:top-0 h-screen overflow-y-auto z-10 custom-scrollbar">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-indigo-600 flex items-center gap-2 tracking-tight">
            <Layers className="w-8 h-8" strokeWidth={3} />
            V-Lab <span className="text-slate-900 font-normal">Scheduler</span>
          </h1>
          <button onClick={() => { if (!auth.user) setIsAuthModalOpen(true); else setIsConfigModalOpen(true); }} className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-400 rounded-xl transition-all">
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {auth.user ? (
          <div className="bg-slate-900 rounded-3xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg">
              {auth.user.fullName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm truncate">{auth.user.fullName}</p>
              <p className="text-slate-400 text-[10px] uppercase font-black tracking-widest">{auth.user.role}</p>
            </div>
            <button onClick={handleLogout} className="p-2 bg-white/10 hover:bg-rose-500/20 text-slate-400 hover:text-rose-500 rounded-xl transition-all"><LogOut className="w-4 h-4" /></button>
          </div>
        ) : (
          <button onClick={() => setIsAuthModalOpen(true)} className="w-full bg-indigo-50 border border-indigo-100 text-indigo-600 p-4 rounded-3xl flex items-center gap-4 hover:bg-indigo-100 transition-all group">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm"><UserIcon className="w-5 h-5" /></div>
            <div className="text-left leading-tight">
              <p className="text-xs font-black uppercase tracking-widest">Đăng nhập</p>
              <p className="text-[10px] text-indigo-400 font-medium">Bảo vệ phiên với JWT</p>
            </div>
          </button>
        )}

        <div className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
          {connectionStatus === 'connected' ? (
            <><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div><span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">MongoDB Secure</span></>
          ) : (
            <><WifiOff className="w-3 h-3 text-rose-500" /><span className="text-[10px] font-bold text-rose-500 uppercase">Offline</span></>
          )}
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Chế độ xem</label>
          <div className="grid grid-cols-2 gap-2">
            {(['day', 'week', 'month', 'year'] as ViewType[]).map(v => (
              <button key={v} onClick={() => setView(v)} className={`px-4 py-2.5 rounded-xl text-xs font-bold capitalize transition-all border ${view === v ? 'bg-indigo-600 text-white shadow-lg border-indigo-600' : 'bg-white text-slate-500 border-slate-100 hover:border-indigo-200 hover:bg-slate-50'}`}>
                {v === 'day' ? 'Hàng ngày' : v === 'week' ? 'Hàng tuần' : v === 'month' ? 'Hàng tháng' : 'Hàng năm'}
              </button>
            ))}
          </div>
        </div>

        <GeminiAssistant bookings={bookings} rooms={ROOMS} />

        <div className="space-y-3 pt-2">
          <button onClick={() => { if (!auth.user) setIsAuthModalOpen(true); else fileInputRef.current?.click(); }} className="w-full bg-white text-indigo-600 px-5 py-4 rounded-2xl flex items-center gap-4 hover:bg-indigo-50 transition-all border border-indigo-100 font-black text-xs uppercase tracking-widest">
            <FileUp className="w-5 h-5" /> Nhập lịch thi (Excel)
          </button>
          <input type="file" ref={fileInputRef} onChange={() => {}} className="hidden" />
          <button onClick={() => { if (!auth.user) setIsAuthModalOpen(true); else setIsStatsModalOpen(true); }} className="w-full bg-white text-slate-600 px-5 py-4 rounded-2xl flex items-center gap-4 hover:bg-slate-100 transition-all border border-slate-200 font-black text-xs uppercase tracking-widest">
            <BarChart3 className="w-5 h-5" /> Thống kê báo cáo
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col p-4 lg:p-8 space-y-4 max-w-7xl mx-auto w-full">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex bg-white rounded-2xl shadow-sm border border-slate-200 p-1">
            <button onClick={() => setCurrentDate(prev => subDays(prev, 1))} className="p-2 hover:bg-slate-50 rounded-xl text-slate-600"><ChevronLeft className="w-5 h-5"/></button>
            <div className="px-4 flex items-center font-bold text-slate-800 text-sm md:text-base min-w-[180px] justify-center capitalize">{headerTitle}</div>
            <button onClick={() => setCurrentDate(prev => addDays(prev, 1))} className="p-2 hover:bg-slate-50 rounded-xl text-slate-600"><ChevronRight className="w-5 h-5"/></button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { if (!auth.user) setIsAuthModalOpen(true); else { setPreSelectedRoomId(undefined); setIsBookingModalOpen(true); } }} className="bg-indigo-600 text-white px-5 py-2.5 rounded-2xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-xl shadow-indigo-100 active:scale-95">
              <Plus className="w-4 h-4" /> Đăng ký phòng
            </button>
          </div>
        </header>

        {view === 'day' ? (
          <section className="bg-white rounded-[2rem] px-8 py-6 border border-slate-200 shadow-sm overflow-hidden">
            <h3 className="text-lg font-black text-slate-900 mb-4">Sơ đồ tầng tòa B1</h3>
            <BuildingMap rooms={ROOMS} bookings={filteredBookings} onRoomClick={(room) => {
              const b = filteredBookings.find(b => b.roomId === room.id);
              if (b) setViewBooking(b); else { if (!auth.user) setIsAuthModalOpen(true); else { setPreSelectedRoomId(room.id); setIsBookingModalOpen(true); } }
            }} now={now} />
          </section>
        ) : (
          <CalendarView view={view} currentDate={currentDate} bookings={bookings} selectedShift={selectedShift} onDateSelect={setCurrentDate} onViewChange={setView} academicWeeks={academicWeeks} />
        )}
      </main>

      {isBookingModalOpen && <BookingModal onClose={() => {setIsBookingModalOpen(false); setPreSelectedRoomId(undefined);}} onSubmit={handleCreateBooking} initialDate={currentDate} initialShift={selectedShift} initialRoomId={preSelectedRoomId} rooms={ROOMS} bookings={bookings} />}
      {isDutyModalOpen && <DutyStaffModal onClose={() => setIsDutyModalOpen(false)} onSubmit={() => {}} initialDate={currentDate} initialShift={selectedShift} />}
      {isConfigModalOpen && <ConfigModal onClose={() => setIsConfigModalOpen(false)} config={importConfig} weeks={academicWeeks} onSaveConfig={setImportConfig} onSaveWeeks={setAcademicWeeks} />}
      {isStatsModalOpen && <StatsModal onClose={() => setIsStatsModalOpen(false)} bookings={bookings} rooms={ROOMS} />}
      {viewBooking && <BookingDetailModal booking={viewBooking} onClose={() => setViewBooking(null)} now={now} />}
      
      {pendingImport && (
        <div className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl p-8 animate-in slide-in-from-bottom-10 duration-500">
            <h3 className="text-2xl font-black mb-4 tracking-tight">Xác nhận nhập dữ liệu bảo mật</h3>
            <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl mb-6">
              <p className="text-amber-800 text-sm font-medium">Tìm thấy <strong>{pendingImport.totalFound}</strong> lịch thi. Bạn đang ghi dữ liệu vào MongoDB với quyền hạn của <strong>{auth.user?.fullName}</strong>.</p>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setPendingImport(null)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold">Hủy bỏ</button>
              <button onClick={confirmImport} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold">Lưu vào DB</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
