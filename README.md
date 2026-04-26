# Nong Nam AI Companion — v4 Stable Clean Build

เวอร์ชันนี้เป็น clean stable build ทำใหม่เพื่อ deploy ง่ายบน Vercel

## จุดสำคัญ
- Next.js app router
- ไม่มี Supabase dependency
- ไม่มี OpenAI dependency ในรอบ MVP นี้
- รูปอยู่ใน public/assets
- Owner mode มีจริง
- เพชรเจ้าของเป็น ∞ OWNER
- ชุดหญิง 12 ช่อง / ชาย 3 ช่อง / 20+ 6 ช่อง
- 20+ และ placeholder จะเบลอก่อนปลดล็อก
- ชั้นหนังสือใช้ browser TTS
- ปุ่ม quick actions ใช้ได้
- ปุ่มเปิดเสียงสำหรับมือถือ

## วิธีเปิด owner mode
1. เข้า Settings
2. แตะ Version ด้านล่าง 5 ครั้ง
3. ใส่ PIN: 2468
4. จะขึ้น OWNER MODE และเพชรเป็น ∞ OWNER

## วิธีแทนรูป
แทนไฟล์ใน public/assets/outfits เช่น:
- public/assets/outfits/female/f_001_chat.jpg
- public/assets/outfits/female/f_001_book.jpg

แล้ว commit ขึ้น GitHub

## Vercel settings
- Framework Preset: Next.js
- Root Directory: ว่าง หรือ ./
- Output Directory: Next.js default
- Build Command: npm run build
- Install Command: npm install
