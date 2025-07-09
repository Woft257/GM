# GM Vietnam Event 2025 - Minigame Web App

Web app cho sự kiện GM Vietnam với hệ thống QR code scoring và leaderboard real-time.

## 🚀 Tính năng

- **Đăng nhập với Telegram username** - Lưu trữ persistent với localStorage
- **Bảng xếp hạng real-time** - Cập nhật tự động khi có điểm mới
- **Hệ thống QR code** - Quét QR để nhận điểm từ các booth
- **Admin panel** - Tạo QR code cho từng booth với điểm số tùy chỉnh
- **5 Booth khác nhau** - Coding, Gaming, Quiz, Design, Startup Pitch
- **Responsive design** - Hoạt động tốt trên mobile và desktop

## 🛠️ Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Database**: Firebase Firestore
- **QR Code**: qrcode library
- **Routing**: React Router
- **Deployment**: Vercel

## 📦 Setup Development

### 1. Clone và cài đặt dependencies

```bash
git clone <repository-url>
cd gm-vietnam-event
npm install
```

### 2. Setup Firebase

1. Tạo project mới trên [Firebase Console](https://console.firebase.google.com)
2. Enable Firestore Database
3. Tạo web app và copy config
4. Copy `.env.example` thành `.env` và điền thông tin Firebase:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

VITE_USE_FIREBASE_PROD=true
VITE_APP_URL=http://localhost:5173
```

### 3. Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if true;
      allow write: if true;
    }
    
    // QR tokens collection
    match /qr-tokens/{tokenId} {
      allow read: if true;
      allow write: if true;
    }
  }
}
```

### 4. Chạy development server

```bash
npm run dev
```

## 🚀 Deployment trên Vercel

### 1. Setup Vercel

```bash
npm install -g vercel
vercel login
```

### 2. Deploy

```bash
vercel --prod
```

### 3. Environment Variables trên Vercel

Thêm các environment variables sau trong Vercel dashboard:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_USE_FIREBASE_PROD=true`
- `VITE_APP_URL=https://your-app.vercel.app`

## 📱 Cách sử dụng

### Cho người chơi:

1. Vào website và nhập username Telegram
2. Xem bảng xếp hạng và tiến trình cá nhân
3. Quét QR code tại các booth để nhận điểm
4. Theo dõi thứ hạng real-time

### Cho quản trò booth:

1. Vào `/admin/booth1` (thay booth1 bằng booth2, booth3, booth4, booth5)
2. Nhập điểm số muốn trao (trong khoảng cho phép)
3. Tạo QR code
4. Cho người chơi quét QR code
5. Tạo QR code mới cho người chơi tiếp theo

## 🏗️ Cấu trúc Database

### Users Collection (`users`)
```typescript
{
  telegram: string;           // @username
  totalScore: number;         // Tổng điểm
  playedBooths: {             // Booth đã chơi
    booth1: boolean;
    booth2: boolean;
    // ...
  };
  createdAt: Timestamp;
}
```

### QR Tokens Collection (`qr-tokens`)
```typescript
{
  id: string;                 // Token ID
  boothId: string;           // booth1, booth2, etc.
  points: number;            // Điểm số
  used: boolean;             // Đã sử dụng chưa
  createdAt: Timestamp;      // Thời gian tạo
  usedAt?: Timestamp;        // Thời gian sử dụng
  usedBy?: string;           // Người sử dụng
}
```

## 🎯 Booth Configuration

- **booth1**: Coding Challenge (10-50 điểm)
- **booth2**: Gaming Arena (10-40 điểm)  
- **booth3**: Tech Quiz (5-30 điểm)
- **booth4**: Design Battle (10-45 điểm)
- **booth5**: Startup Pitch (10-35 điểm)

## 🔧 Scripts

- `npm run dev` - Chạy development server
- `npm run build` - Build production
- `npm run preview` - Preview production build
- `npm run lint` - Chạy ESLint

## 📝 Notes

- QR code có hiệu lực 24 giờ
- Mỗi QR code chỉ sử dụng được 1 lần
- Mỗi booth chỉ chơi được 1 lần per user
- Real-time updates với Firestore listeners
- Fallback to localStorage nếu Firebase lỗi
