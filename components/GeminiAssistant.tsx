
import React, { useState } from 'react';
import { Sparkles, Send, Loader2 } from 'lucide-react';
import { analyzeOccupancy } from '../services/geminiService';
import { Booking, Room } from '../types';

interface GeminiAssistantProps {
  bookings: Booking[];
  rooms: Room[];
}

const GeminiAssistant: React.FC<GeminiAssistantProps> = ({ bookings, rooms }) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResponse('');
    try {
      const result = await analyzeOccupancy(bookings, rooms, query);
      setResponse(result || 'Không có kết quả trả về.');
    } catch (err) {
      setResponse('Lỗi kết nối trí tuệ nhân tạo.');
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    "Tìm phòng trống kíp 1 hôm nay?",
    "Phòng nào bận nhiều nhất?",
    "Tôi cần phòng cho 30 người vào sáng mai"
  ];

  return (
    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white shadow-xl shadow-indigo-200">
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-white/20 p-1.5 rounded-lg">
          <Sparkles className="w-5 h-5 text-indigo-100" />
        </div>
        <div>
          <h3 className="font-bold text-sm">Gemini Assistant</h3>
          <p className="text-[10px] opacity-70">Phân tích dữ liệu phòng máy</p>
        </div>
      </div>

      <div className="space-y-4">
        {response && (
          <div className="bg-white/10 rounded-xl p-3 text-xs leading-relaxed border border-white/20 max-h-40 overflow-y-auto custom-scrollbar">
            {response}
          </div>
        )}

        <form onSubmit={handleAsk} className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Hỏi AI về lịch phòng..."
            className="w-full bg-white/20 border border-white/30 rounded-xl py-2.5 pl-4 pr-10 text-xs placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
          />
          <button 
            type="submit" 
            disabled={loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>

        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => setQuery(s)}
              className="text-[9px] bg-black/10 hover:bg-black/20 px-2 py-1 rounded-full transition-colors whitespace-nowrap"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GeminiAssistant;
