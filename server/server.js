
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'vlab-secure-2025-super-secret-key';

/**
 * SECURITY CONFIGURATION
 * PASS_PEPPER: Một chuỗi bí mật bổ sung để "ướp" mật khẩu trước khi băm.
 * SALT_ROUNDS: Độ khó của thuật toán băm (12 là tiêu chuẩn bảo mật cao).
 */
const PASS_PEPPER = process.env.PASS_PEPPER || 'vlab-internal-pepper-2025-v1';
const SALT_ROUNDS = 12;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10kb' })); 
const importLimit = express.json({ limit: '50mb' });

// --- SECURITY UTILS ---

/**
 * Lọc NoSQL Injection
 */
const sanitizeInput = (data) => {
  if (typeof data !== 'object' || data === null) return data;
  const cleanData = Array.isArray(data) ? [] : {};
  for (let key in data) {
    if (!key.startsWith('$')) {
      cleanData[key] = typeof data[key] === 'object' ? sanitizeInput(data[key]) : data[key];
    }
  }
  return cleanData;
};

/**
 * Helpers cho Password Hashing
 */
const hashPassword = async (password) => {
  const saltedPassword = password + PASS_PEPPER;
  return await bcrypt.hash(saltedPassword, SALT_ROUNDS);
};

const comparePassword = async (password, hashedPassword) => {
  const saltedPassword = password + PASS_PEPPER;
  return await bcrypt.compare(saltedPassword, hashedPassword);
};

/**
 * Middleware kiểm tra JWT
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Bạn cần đăng nhập để thực hiện hành động này' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Phiên làm việc hết hạn hoặc không hợp lệ' });
    req.user = user;
    next();
  });
};

// --- DATABASE CONNECTION ---
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://vlab_admin:090325@cluster0.cxkdbhl.mongodb.net/?appName=Cluster0";
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB Secure Connected (Bcrypt v12 + Pepper enabled)'))
  .catch(err => console.error(err));

// --- SCHEMAS ---
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, maxlength: 100 },
  password: { type: String, required: true }, 
  fullName: { type: String, required: true, maxlength: 50 },
  role: { type: String, enum: ['admin', 'staff', 'guest'], default: 'staff' }
});

const BookingSchema = new mongoose.Schema({
  roomId: { type: String, required: true, maxlength: 10 },
  date: { type: String, required: true },
  shift: { type: String, required: true },
  user: { type: String, required: true, maxlength: 100 },
  purpose: { type: String, required: true, maxlength: 500 },
  proctor: { type: String, required: true, maxlength: 100 }
});

const User = mongoose.model('User', UserSchema);
const Booking = mongoose.model('Booking', BookingSchema);

// --- AUTH ROUTES ---

/**
 * GET /api/auth/me
 * Kiểm tra token và trả về thông tin user
 */
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, fullName } = sanitizeInput(req.body);

    if (typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ message: 'Email không hợp lệ' });
    }
    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 8 ký tự' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email này đã được đăng ký' });

    const hashedPassword = await hashPassword(password);
    
    const newUser = new User({ 
      email, 
      password: hashedPassword, 
      fullName 
    });
    
    await newUser.save();

    const token = jwt.sign({ id: newUser._id, role: newUser.role }, JWT_SECRET, { expiresIn: '24h' });
    
    res.status(201).json({ 
      user: { id: newUser._id, email: newUser.email, fullName: newUser.fullName, role: newUser.role },
      token 
    });
  } catch (err) {
    console.error('Register Error:', err);
    res.status(500).json({ message: 'Lỗi trong quá trình đăng ký' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = sanitizeInput(req.body);

    if (!email || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Email hoặc mật khẩu không chính xác' });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Email hoặc mật khẩu không chính xác' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

    res.json({ 
      user: { id: user._id, email: user.email, fullName: user.fullName, role: user.role },
      token 
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// --- BOOKING ROUTES ---

app.get('/api/bookings', async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ date: 1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lấy dữ liệu' });
  }
});

app.post('/api/bookings', authenticateToken, async (req, res) => {
  try {
    const data = sanitizeInput(req.body);
    const existing = await Booking.findOne({ roomId: data.roomId, date: data.date, shift: data.shift });
    if (existing) return res.status(400).json({ message: 'Phòng đã có lịch.' });

    const newBooking = new Booking(data);
    await newBooking.save();
    res.status(201).json(newBooking);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi lưu dữ liệu' });
  }
});

app.post('/api/bookings/import', importLimit, authenticateToken, async (req, res) => {
  try {
    const { bookings } = sanitizeInput(req.body);
    const deleteConditions = bookings.map(b => ({ roomId: b.roomId, date: b.date, shift: b.shift }));
    await Booking.deleteMany({ $or: deleteConditions });
    const result = await Booking.insertMany(bookings);
    res.json({ message: 'Import thành công', count: result.length });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi import' });
  }
});

app.listen(PORT, () => console.log(`🚀 SECURE SERVER (Bcrypt 12+Pepper) running on port ${PORT}`));
