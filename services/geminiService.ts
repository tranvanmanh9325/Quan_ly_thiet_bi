
import { GoogleGenAI, Type } from "@google/genai";
import { Booking, Shift, Room } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function analyzeOccupancy(bookings: Booking[], rooms: Room[], query: string) {
  const model = 'gemini-3-flash-preview';
  
  const systemInstruction = `
    Bạn là Trợ lý Quản lý Lịch Phòng Máy.
    Tòa nhà hình chữ V (B1 ở giữa):
    - Cánh Trái (Tầng 2): Các phòng 202, 203, 204.
    - Cánh Phải (Tầng 2): Các phòng 206, 207, 208, 209.
    - Cánh Phải (Tầng 1): Các phòng 106, 107, 108, 109 (nằm ngay dưới các phòng 206-209).
    
    Các kíp học:
    Kíp 1: 07:00-09:30, Kíp 2: 09:30-12:00, Kíp 3: 12:30-15:00, Kíp 4: 15:00-17:30, Kíp 5: 17:30-20:00.
    
    Dữ liệu lịch: ${JSON.stringify(bookings.slice(-30))}.
    
    Hãy giúp người dùng tìm phòng trống, tổng hợp thông tin hoặc giải quyết các thắc mắc về lịch sử dụng phòng máy.
    Trả lời bằng tiếng Việt, ngắn gọn và chính xác.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: query,
      config: { systemInstruction }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Xin lỗi, tôi gặp sự cố khi xử lý yêu cầu của bạn. Vui lòng thử lại sau.";
  }
}

export async function suggestBooking(bookings: Booking[], date: string, participants: number) {
  const prompt = `Gợi ý phòng trống cho ngày ${date} cho khoảng ${participants} người.`;
  return await analyzeOccupancy(bookings, [], prompt);
}
