
import React, { useState } from 'react';
import { X, Settings, Database, Calendar, Plus, Trash2, Save } from 'lucide-react';
import { ImportConfig, AcademicWeek } from '../types';
import { format } from 'date-fns';

interface ConfigModalProps {
  onClose: () => void;
  config: ImportConfig;
  weeks: AcademicWeek[];
  onSaveConfig: (config: ImportConfig) => void;
  onSaveWeeks: (weeks: AcademicWeek[]) => void;
}

const ConfigModal: React.FC<ConfigModalProps> = ({ onClose, config, weeks, onSaveConfig, onSaveWeeks }) => {
  const [activeTab, setActiveTab] = useState<'import' | 'academic'>('import');
  const [localConfig, setLocalConfig] = useState<ImportConfig>(config);
  const [localWeeks, setLocalWeeks] = useState<AcademicWeek[]>(weeks);

  const colOptions = Array.from({ length: 26 }, (_, i) => ({
    label: String.fromCharCode(65 + i),
    value: i
  }));

  const handleAddWeek = () => {
    const nextWeekNum = localWeeks.length > 0 ? Math.max(...localWeeks.map(w => w.weekNumber)) + 1 : 1;
    const newWeek: AcademicWeek = {
      id: Math.random().toString(36).substr(2, 9),
      weekNumber: nextWeekNum,
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
    };
    setLocalWeeks([...localWeeks, newWeek]);
  };

  const removeWeek = (id: string) => {
    setLocalWeeks(localWeeks.filter(w => w.id !== id));
  };

  const updateWeek = (id: string, field: keyof AcademicWeek, value: any) => {
    setLocalWeeks(localWeeks.map(w => w.id === id ? { ...w, [field]: value } : w));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in fade-in duration-200 flex flex-col max-h-[85vh]">
        <div className="px-8 py-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-xl">
              <Settings className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">Cấu hình hệ thống</h2>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Tùy chỉnh nhập liệu & Lịch học</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex bg-slate-50 border-b border-slate-100 shrink-0">
          <button 
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-4 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeTab === 'import' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Database className="w-4 h-4" /> Nhập dữ liệu (Excel)
          </button>
          <button 
            onClick={() => setActiveTab('academic')}
            className={`flex-1 py-4 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeTab === 'academic' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Calendar className="w-4 h-4" /> Lịch học thuật
          </button>
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
          {activeTab === 'import' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <ColSelect label="Cột Phòng thi" value={localConfig.phongThiCol} onChange={(v) => setLocalConfig({...localConfig, phongThiCol: v})} options={colOptions} />
                <ColSelect label="Cột Giảng viên" value={localConfig.giangVienCol} onChange={(v) => setLocalConfig({...localConfig, giangVienCol: v})} options={colOptions} />
                <ColSelect label="Cột Mã lớp" value={localConfig.maLopCol} onChange={(v) => setLocalConfig({...localConfig, maLopCol: v})} options={colOptions} />
                <ColSelect label="Cột Mã học phần" value={localConfig.maHocPhanCol} onChange={(v) => setLocalConfig({...localConfig, maHocPhanCol: v})} options={colOptions} />
                <ColSelect label="Cột Tên học phần" value={localConfig.tenHocPhanCol} onChange={(v) => setLocalConfig({...localConfig, tenHocPhanCol: v})} options={colOptions} />
                <ColSelect label="Cột Sĩ số" value={localConfig.slSvCol} onChange={(v) => setLocalConfig({...localConfig, slSvCol: v})} options={colOptions} />
                <ColSelect label="Cột Ngày thi" value={localConfig.ngayThiCol} onChange={(v) => setLocalConfig({...localConfig, ngayThiCol: v})} options={colOptions} />
                <ColSelect label="Cột Kíp thi" value={localConfig.kipThiCol} onChange={(v) => setLocalConfig({...localConfig, kipThiCol: v})} options={colOptions} />
              </div>
              <div className="pt-4 border-t border-slate-100">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Số lượng sinh viên tối đa / phòng</label>
                <input 
                  type="number" 
                  value={localConfig.maxStudentsPerRoom}
                  onChange={(e) => setLocalConfig({...localConfig, maxStudentsPerRoom: parseInt(e.target.value)})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-700"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Định nghĩa các tuần trong năm học</p>
                <button 
                  onClick={handleAddWeek}
                  className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all"
                >
                  <Plus className="w-3 h-3" /> Thêm tuần
                </button>
              </div>
              <div className="space-y-3">
                {localWeeks.map((week) => (
                  <div key={week.id} className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="w-12">
                      <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Tuần</label>
                      <input 
                        type="number" 
                        value={week.weekNumber}
                        onChange={(e) => updateWeek(week.id, 'weekNumber', parseInt(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-black text-center"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Ngày bắt đầu</label>
                      <input 
                        type="date" 
                        value={format(new Date(week.startDate), 'yyyy-MM-dd')}
                        onChange={(e) => updateWeek(week.id, 'startDate', new Date(e.target.value).toISOString())}
                        className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-bold"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Ngày kết thúc</label>
                      <input 
                        type="date" 
                        value={format(new Date(week.endDate), 'yyyy-MM-dd')}
                        onChange={(e) => updateWeek(week.id, 'endDate', new Date(e.target.value).toISOString())}
                        className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-bold"
                      />
                    </div>
                    <button 
                      onClick={() => removeWeek(week.id)}
                      className="mt-4 p-2 text-rose-400 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {localWeeks.length === 0 && (
                  <div className="text-center py-12 text-slate-300 italic text-sm">Chưa có tuần học nào được định nghĩa.</div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex gap-4 shrink-0">
          <button 
            onClick={onClose}
            className="flex-1 py-4 bg-white text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest border border-slate-200 hover:bg-slate-50 transition-all"
          >
            Đóng
          </button>
          <button 
            onClick={() => {
              onSaveConfig(localConfig);
              onSaveWeeks(localWeeks);
              onClose();
            }}
            className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" /> Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
};

const ColSelect = ({ label, value, onChange, options }: any) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{label}</label>
    <select 
      value={value} 
      onChange={(e) => onChange(parseInt(e.target.value))}
      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
    >
      {options.map((opt: any) => (
        <option key={opt.value} value={opt.value}>Cột {opt.label}</option>
      ))}
    </select>
  </div>
);

export default ConfigModal;
