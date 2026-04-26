# Nong Nam Companion — v2

เวอร์ชันแก้จาก clean rebuild v1 ตามสเปค 16 ข้อ

---

## 🎯 สรุปสิ่งที่แก้

### โครงสร้างไฟล์
```
app/
├── api/chat/route.ts        ← เพิ่ม offline fallback
├── api/transcribe/route.ts  ← คงเดิม
├── studio/page.tsx          ← ใหม่: route /studio + PIN + editor
├── page.tsx                 ← เขียนใหม่ทั้งไฟล์
├── globals.css              ← เขียนใหม่ทั้งไฟล์
└── layout.tsx               ← คงเดิม
lib/
├── appData.ts               ← chatImage/bookImage/visible/Manifest
├── storage.ts               ← ใหม่: resetCharacterOnly + manifest
├── supabase.ts              ← ใหม่: outfit/book/manifest upload
└── supabaseClient.ts        ← re-export (backward compat)
public/assets/
├── ui/female-card.jpg       ← ใหม่ (welcome screen)
├── ui/male-card.jpg         ← ใหม่
└── books/default_cover.svg  ← ใหม่ placeholder สวย ๆ
```

### รายการแก้ตามสเปค

| # | ฟีเจอร์ | สถานะ |
|---|---|---|
| 1 | หน้าแรกการ์ดเลือกเพศ ♀/♂ | ✅ |
| 2 | Setup ครั้งเดียว, เปิดมาเข้า chat ตรง | ✅ |
| 3 | Reset ไม่คืนเพชร / ไม่ลบของซื้อแล้ว | ✅ `resetCharacterOnly()` |
| 4 | หน้า chat avatar เต็มจอ + pinch zoom + double tap reset | ✅ |
| 5 | chatImage / bookImage แยกใน Outfit | ✅ |
| 6 | Bubble แสดง 3 อันล่าสุด + fade upward | ✅ |
| 7 | ลบคำว่า "หลังบ้านพี่แมน" → "จัดการไฟล์" | ✅ |
| 8 | `/studio` เป็น route จริง + PIN | ✅ |
| 9 | Studio แก้ title/desc/price/visible/chatImage/bookImage | ✅ |
| 10 | Reader ใช้ TTS เท่านั้น ไม่เรียก AI | ✅ |
| 11 | Reader screen แสดง bookImage + ปุ่มอ่าน/หยุด | ✅ |
| 12 | OpenAI fallback ตอนไม่มี API key | ✅ |
| 13 | Bubble: user เขียวอ่อน / assistant ขาวอมชมพู | ✅ |
| 14 | history สูงสุด 8 ข้อความใน state | ✅ |
| 15 | ทางเข้า /studio: พิมพ์ URL หรือ tap version 5 ครั้งใน settings | ✅ |
| 16 | Supabase fallback ถ้าไม่มี env แอปไม่พัง | ✅ |

---

## 📦 Environment Variables (Vercel)

### ต้องใส่ (chat ทำงาน)
```
OPENAI_API_KEY=sk-xxxxx
```

### Optional (ถ้าไม่ใส่ ใช้ localStorage แทน)
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
NEXT_PUBLIC_SUPABASE_BUCKET=nongnam-assets
NEXT_PUBLIC_ADMIN_PIN=2468
OPENAI_CHAT_MODEL=gpt-4o-mini
OPENAI_TRANSCRIBE_MODEL=whisper-1
```

---

## 🚀 Deploy บน Vercel

1. ลากไฟล์ทั้งหมดทับใน GitHub repo เดิม
2. Commit changes
3. Vercel auto-deploy
4. ใส่ `OPENAI_API_KEY` ใน Vercel → Settings → Environment Variables
5. Redeploy

---

## 🔐 วิธีเข้า /studio

**วิธีที่ 1:** พิมพ์ URL `your-app.vercel.app/studio` แล้วใส่ PIN

**วิธีที่ 2:** ในแอป → ไปหน้า settings → แตะข้อความ `v2.0.0` ที่ล่างสุด **5 ครั้ง**

PIN default: `2468` (เปลี่ยนได้ผ่าน `NEXT_PUBLIC_ADMIN_PIN`)

---

## 🗄 Supabase Storage Setup

สร้าง bucket ชื่อ `nongnam-assets` (public)

โครงสร้างไฟล์:
```
outfits/{id}_chatImage.jpg
outfits/{id}_bookImage.jpg
books/{id}_cover.jpg
config/manifest.json          ← studio sync ทุกครั้งที่กดบันทึก
```

---

## ✅ Test Checklist (10 ขั้น)

1. **เปิดเว็บครั้งแรก** → เห็นการ์ด ♀/♂ → กดผู้หญิง → ไป setup
2. **กรอก setup** → กดบันทึก → เข้า chat → รูป f_001 ขึ้น
3. **Pinch zoom รูป** → 2 นิ้วบีบ-ขยาย → ลาก → double tap reset
4. **พิมพ์ "เหนื่อย"** → ถ้ามี OPENAI_API_KEY → AI ตอบ / ถ้าไม่มี → fallback ตอบ
5. **กดไมค์ค้าง 2-3 วิ → ปล่อย** → ถอดเสียง → ส่งให้ AI
6. **กดไมค์แค่แตะ** → toast "เสียงสั้นเกินไป"
7. **เข้าหน้าชุด** → กดชุดที่ล็อก → confirm ใช้เพชร → เพชรลด → ใส่ชุดใหม่
8. **เข้าชั้นหนังสือ** → กด "เลือกเล่มนี้" → ไป reader → กด "อ่านให้ฟัง" → TTS อ่าน → กดหยุด
9. **เข้า settings → ลบ tap version 5x** → ไป /studio → ใส่ PIN 2468 → แก้ชื่อชุด → กด "บันทึก"
10. **เข้า settings → กดรีเซ็ต** → confirm → เพชรไม่กลับเป็น 120 + ชุดที่ซื้อยังอยู่

---

## ⚠️ Known Limitations

1. **PIN ฝั่ง client** — สำหรับ prototype พอ ถ้า production จริงควรใช้ Supabase Auth
2. **localStorage manifest** — ถ้าไม่มี Supabase env แต่ละเครื่องเห็นข้อมูลคนละชุด
3. **bookImage placeholder** — ใช้รูปเดียวกับ chatImage ไปก่อน รอพี่อัปโหลดรูปจริงผ่าน /studio
4. **Welcome card images** — ตอนนี้ก็อปจาก f_001/m_001 ไปก่อน พี่อัปได้ภายหลังที่ `/public/assets/ui/`
5. **ไม่ได้ run `npm run build` ทดสอบ** เพราะสภาพแวดล้อมไม่มี Next.js — TypeScript ระวังเขียนชัด แต่อาจมี edge case → ถ้า build พังบอกน้ำได้ น้ำแก้ทันที

---

## 🔧 ถ้า build พัง ต้อง check อะไรก่อน

```bash
npm install
npm run build
```

ปัญหาที่อาจเจอ:
- **`useRouter` from `next/navigation` ไม่ทำงาน** → ตรวจว่าใช้ Next.js 13+ (app router)
- **TypeScript strict** → tsconfig.json `strict: false` (ตั้งไว้แล้ว)
- **Supabase package** → `npm install @supabase/supabase-js` (มีใน package.json แล้ว)

---

## 📝 ของที่ยังเหลือทำใน v3

- ระบบ memory ระยะยาว (affectionLevel, มี trigger เพิ่มเลเวล)
- Lip-sync animation ตอน TTS อ่าน
- ระบบจ่ายเงินจริง (PromptPay / Stripe)
- ปุ่ม upload avatar ให้ผู้ใช้ (พี่บอกจะเพิ่มทีหลัง)
- Migration: ถ้ามี user ใช้ v1 อยู่ ตอนนี้ key เปลี่ยน v1→v2 → จะกลายเป็น "ไม่มีข้อมูล" → setupDone จะเป็น false → ผู้ใช้ต้องตั้งใหม่ครั้งเดียว (acceptable)


# v3 Final Today — สิ่งที่แก้เพิ่มรอบปิดงาน

เวอร์ชันนี้เน้นให้ใช้งานจริงก่อน โดยใช้รูปที่มีอยู่ในระบบฝังเข้า public assets ไปเลย

## สิ่งที่เพิ่ม
- ใส่รูปตัวอย่างจริงให้หลายชุด:
  - female f_001 ถึง f_008 มีรูปจริง/รูปที่มีในโปรเจกต์
  - f_009 ถึง f_012 เป็น placeholder
  - special20 s20_001 ถึง s20_006 เป็น placeholder เบลอ
  - male m_001 ถึง m_003 มีรูปตั้งต้น
- เพิ่ม field บุคลิกใน setup:
  - อายุ
  - บุคลิกหลัก
  - ระดับงอน
  - ระดับหึง
  - โทนความใกล้ชิด
- เพิ่ม owner mode:
  - เข้า Settings
  - แตะข้อความเวอร์ชันด้านล่าง 5 ครั้ง
  - จะเปิด OWNER TEST MODE
  - เจ้าของระบบจะเห็นเพชร ∞ และปลดล็อกทุกชุดเพื่อทดสอบ
- เพิ่มปุ่มเปิดเสียง 🔊 ในหน้าแชต
  - แนะนำให้กด 1 ครั้งบน iPhone/Safari ก่อนใช้งานเสียงตอบกลับ
- แก้คำสั่ง “อ่านหนังสือให้ฟัง”
  - ระบบจะพาไปหน้า Bookshelf
  - ไม่ควรตอบว่าอ่านไม่ได้
- ปรับ 20+ และชุด locked:
  - ถ้ายังไม่ปลดล็อก รูปจะเบลอและมี overlay
  - คนทั่วไปไม่เห็นภาพชัดทันที
- ลด max_tokens ของ chat route เพื่อให้ตอบเร็วขึ้น

## รูปอยู่ตรงไหน
public/assets/outfits/female/
public/assets/outfits/male/
public/assets/outfits/special20/
public/assets/ui/
public/assets/books/

## การอัปเดตรูปแบบง่ายสุด
แทนไฟล์รูปเดิมตาม id เช่น:
public/assets/outfits/female/f_006_chat.jpg
public/assets/outfits/female/f_006_book.jpg

แล้ว commit ขึ้น GitHub และรอ Vercel deploy

## หมายเหตุเรื่องเสียงบนมือถือ
iPhone/Safari อาจบล็อกเสียงอัตโนมัติหลัง async API call
ให้กดปุ่ม 🔊 เปิดเสียงก่อน 1 ครั้งในหน้าแชต
โหมดอ่านหนังสือมักมีเสียง เพราะเกิดจากปุ่มกดโดยตรง
