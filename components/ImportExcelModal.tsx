import React, { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import {
  X, FileSpreadsheet, ChevronRight, ChevronLeft, CheckSquare, Square,
  AlertCircle, CheckCircle2, Loader2, Table2, ArrowRight
} from 'lucide-react';
import { detectExamSheets, parseSelectedSheets, SheetParseResult } from '../services/parseExamSchedule';
import { Booking } from '../types';

interface Props {
  onClose: () => void;
  onConfirm: (bookings: Omit<Booking, 'id'>[]) => void;
}

type Step = 'select' | 'preview' | 'confirm';

export default function ImportExcelModal({ onClose, onConfirm }: Props) {
  const [step, setStep] = useState<Step>('select');
  const [wb, setWb] = useState<XLSX.WorkBook | null>(null);
  const [fileName, setFileName] = useState('');
  const [examSheets, setExamSheets] = useState<string[]>([]);
  const [selectedSheets, setSelectedSheets] = useState<Set<string>>(new Set());
  const [parseResults, setParseResults] = useState<SheetParseResult[]>([]);
  const [isParsing, setIsParsing] = useState(false);

  // ─── Xử lý đọc file ────────────────────────────────────────────────────────
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const arrayBuffer = evt.target?.result as ArrayBuffer;
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      setWb(workbook);
      const sheets = detectExamSheets(workbook.SheetNames);
      setExamSheets(sheets);
      // Mặc định chọn tất cả sheet thi
      setSelectedSheets(new Set(sheets));
    };
    reader.readAsArrayBuffer(file);
    // Reset input để có thể chọn lại cùng file
    e.target.value = '';
  }, []);

  // ─── Toggle chọn sheet ──────────────────────────────────────────────────────
  const toggleSheet = (name: string) => {
    setSelectedSheets(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedSheets.size === examSheets.length) setSelectedSheets(new Set());
    else setSelectedSheets(new Set(examSheets));
  };

  // ─── Bước 1 → Bước 2: Parse preview ───────────────────────────────────────
  const handlePreview = async () => {
    if (!wb || selectedSheets.size === 0) return;
    setIsParsing(true);
    // Chạy parse trong setTimeout để không block UI
    await new Promise(r => setTimeout(r, 50));
    const results = parseSelectedSheets(wb, Array.from(selectedSheets));
    setParseResults(results);
    setIsParsing(false);
    setStep('preview');
  };

  // ─── Bước 2 → Confirm ──────────────────────────────────────────────────────
  const handleConfirm = () => {
    const allBookings: Omit<Booking, 'id'>[] = parseResults.flatMap(r =>
      r.bookings.map(b => ({
        roomId:  b.roomId,
        date:    b.date,
        shift:   b.shift,
        user:    b.user,
        purpose: b.purpose,
        proctor: b.proctor || '',
      }))
    );
    onConfirm(allBookings);
    onClose();
  };

  // Tổng số booking parse được
  const totalBookings = parseResults.reduce((s, r) => s + r.bookings.length, 0);
  const totalErrors = parseResults.reduce((s, r) => s + r.errors.length, 0);

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-8 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">Nhập lịch thi từ Excel</h2>
              <p className="text-xs text-slate-400 font-medium">
                {step === 'select' ? 'Chọn file và tuần thi' : step === 'preview' ? 'Xem trước dữ liệu parse' : 'Xác nhận nhập dữ liệu'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-8 pb-4">
          <div className="flex items-center gap-2">
            {(['select', 'preview', 'confirm'] as Step[]).map((s, i) => (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${step === s ? 'bg-indigo-600 text-white' : parseResults.length > 0 && i < ['select','preview','confirm'].indexOf(step) ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                  <span>{i + 1}</span>
                  <span>{s === 'select' ? 'Chọn file' : s === 'preview' ? 'Xem trước' : 'Xác nhận'}</span>
                </div>
                {i < 2 && <ArrowRight className="w-3 h-3 text-slate-300 flex-shrink-0" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-100" />

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar">

          {/* ── STEP 1: Chọn file + sheet ── */}
          {step === 'select' && (
            <div className="space-y-6">
              {/* Upload zone */}
              <label className={`block border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${wb ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300 hover:bg-indigo-50'}`}>
                <input type="file" accept=".xlsx,.xls" onChange={handleFileChange} className="hidden" />
                {wb ? (
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle2 className="w-10 h-10 text-indigo-500" />
                    <p className="font-bold text-indigo-700 text-sm">{fileName}</p>
                    <p className="text-xs text-slate-400">Tìm thấy <strong className="text-indigo-600">{examSheets.length}</strong> sheet lịch thi</p>
                    <p className="text-[11px] text-indigo-400 underline mt-1">Click để chọn file khác</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <FileSpreadsheet className="w-10 h-10 text-slate-300" />
                    <p className="font-bold text-slate-500 text-sm">Click để chọn file Excel</p>
                    <p className="text-xs text-slate-400">Hỗ trợ .xlsx, .xls — định dạng Tuan_Thi_20251_PhongMayTinh</p>
                  </div>
                )}
              </label>

              {/* Danh sách sheet */}
              {examSheets.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Chọn tuần thi cần nhập</label>
                    <button onClick={toggleAll} className="text-xs font-bold text-indigo-600 hover:underline">
                      {selectedSheets.size === examSheets.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {examSheets.map(name => {
                      const isSelected = selectedSheets.has(name);
                      return (
                        <button
                          key={name}
                          onClick={() => toggleSheet(name)}
                          className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${isSelected ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
                        >
                          {isSelected ? <CheckSquare className="w-4 h-4 text-indigo-600 flex-shrink-0" /> : <Square className="w-4 h-4 text-slate-300 flex-shrink-0" />}
                          <span className="font-bold text-sm">{name}</span>
                        </button>
                      );
                    })}
                  </div>
                  {examSheets.length === 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                      <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-700">Không tìm thấy sheet lịch thi (TuanXX) trong file này.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2: Preview ── */}
          {step === 'preview' && (
            <div className="space-y-4">
              {totalErrors > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                  <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-amber-700">Có {totalErrors} cảnh báo khi parse</p>
                    {parseResults.flatMap(r => r.errors).map((e, i) => (
                      <p key={i} className="text-xs text-amber-600 mt-1">• {e}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-indigo-50 rounded-2xl p-4">
                  <p className="text-3xl font-black text-indigo-600">{totalBookings}</p>
                  <p className="text-xs font-bold text-indigo-400 mt-1">Lịch thi tìm thấy</p>
                </div>
                <div className="bg-emerald-50 rounded-2xl p-4">
                  <p className="text-3xl font-black text-emerald-600">{parseResults.length}</p>
                  <p className="text-xs font-bold text-emerald-400 mt-1">Tuần thi đã chọn</p>
                </div>
              </div>

              {/* Per-sheet breakdown */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Chi tiết từng tuần</label>
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-black text-slate-400 uppercase">Sheet</th>
                        <th className="text-left px-4 py-3 text-xs font-black text-slate-400 uppercase">Nhãn</th>
                        <th className="text-right px-4 py-3 text-xs font-black text-slate-400 uppercase">Số lịch</th>
                        <th className="text-center px-4 py-3 text-xs font-black text-slate-400 uppercase">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parseResults.map((r, i) => (
                        <tr key={r.sheetName} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                          <td className="px-4 py-3 font-bold text-slate-700">{r.sheetName}</td>
                          <td className="px-4 py-3 text-slate-500 text-xs">{r.weekLabel}</td>
                          <td className="px-4 py-3 text-right font-black text-indigo-600">{r.bookings.length}</td>
                          <td className="px-4 py-3 text-center">
                            {r.errors.length === 0
                              ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                              : <AlertCircle className="w-4 h-4 text-amber-500 mx-auto" />
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sample preview (5 dòng đầu) */}
              {parseResults[0]?.bookings.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Table2 className="w-3 h-3" /> Mẫu dữ liệu (5 dòng đầu)
                  </label>
                  <div className="border border-slate-200 rounded-2xl overflow-hidden overflow-x-auto">
                    <table className="w-full text-xs whitespace-nowrap">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="text-left px-3 py-2 font-black text-slate-400">Phòng</th>
                          <th className="text-left px-3 py-2 font-black text-slate-400">Ngày</th>
                          <th className="text-left px-3 py-2 font-black text-slate-400">Kíp</th>
                          <th className="text-left px-3 py-2 font-black text-slate-400">Môn thi</th>
                          <th className="text-left px-3 py-2 font-black text-slate-400">CB Trông thi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parseResults[0].bookings.slice(0, 5).map((b, i) => (
                          <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                            <td className="px-3 py-2 font-bold text-indigo-600">B1-{b.roomId}</td>
                            <td className="px-3 py-2 text-slate-600">
                              {new Date(b.date).toLocaleDateString('vi-VN')}
                            </td>
                            <td className="px-3 py-2 text-slate-500 text-[11px]">{b.shift}</td>
                            <td className="px-3 py-2 font-bold text-slate-700">{b.purpose}</td>
                            <td className="px-3 py-2 text-slate-500">{b.proctor || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-100 px-8 py-6">
          {step === 'select' && (
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-colors">
                Huỷ
              </button>
              <button
                onClick={handlePreview}
                disabled={!wb || selectedSheets.size === 0 || isParsing}
                className="flex-1 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                {isParsing ? 'Đang phân tích...' : 'Xem trước'}
              </button>
            </div>
          )}

          {step === 'preview' && (
            <div className="flex gap-3">
              <button onClick={() => setStep('select')} className="flex gap-2 items-center px-5 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-colors">
                <ChevronLeft className="w-4 h-4" /> Quay lại
              </button>
              <button
                onClick={handleConfirm}
                disabled={totalBookings === 0}
                className="flex-1 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="w-4 h-4" />
                Xác nhận nhập {totalBookings} lịch thi
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
