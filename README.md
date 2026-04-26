# Nong Nam AI Companion — Clean Rebuild v1

เวอร์ชันนี้โละของเก่าแล้วเริ่มใหม่แบบสะอาด

## มีอะไรในเวอร์ชันนี้
- ตั้งค่าครั้งแรกครั้งเดียว
- เปิดรอบต่อไปเข้าแชตเลย
- รีเซ็ตเฉพาะความจำ/ตัวละคร ไม่คืนเครดิต
- หน้าแชตไม่ให้ข้อความบังหน้าน้องน้ำถาวร
- ข้อความล่าสุดจะค่อย ๆ จางหาย
- ประวัติแชตอยู่ในกล่อง scroll แยก
- มีหน้าเลือกชุด
- มีหมวด 20+
- มีชั้นหนังสือ
- อ่านหนังสือด้วย browser SpeechSynthesis ไม่ใช้ OpenAI token
- มีหลังบ้านพี่แมน
- รหัสหลังบ้าน default: 2468
- หลังบ้านอัปโหลดรูปชุดได้
- ถ้ายังไม่ต่อ Supabase รูปจะเก็บใน localStorage ของเครื่องนี้
- ถ้าต่อ Supabase Storage รูปจะอัปโหลดกลางและทุกคนเห็นได้

## Environment Variables
ต้องใส่ใน Vercel:

OPENAI_API_KEY=sk-xxxx

ถ้าต้องการให้หลังบ้านอัปโหลดรูปแล้วทุกคนเห็นเหมือนกัน ให้ใส่เพิ่ม:

NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
NEXT_PUBLIC_SUPABASE_BUCKET=nongnam-assets
NEXT_PUBLIC_ADMIN_PIN=2468

## Supabase Storage
สร้าง bucket ชื่อ:
nongnam-assets

ตั้ง bucket เป็น public

รูปจะถูกเก็บที่:
outfits/f_001.jpg
outfits/f_002.jpg
outfits/f_003.jpg
outfits/f_004.jpg
outfits/m_001.jpg
outfits/m_002.jpg
outfits/s20_001.jpg
outfits/s20_002.jpg

## วิธีอัปโหลด
1. แตก zip
2. เข้าโฟลเดอร์ nongnam_clean_rebuild_v1
3. ลากไฟล์ทั้งหมดเข้า GitHub repo ใหม่หรือ repo เดิม
4. Commit changes
5. Vercel deploy
6. เปิดด้วย ?v=clean1

## คำแนะนำ
ถ้าจะเริ่มใหม่จริง ให้สร้าง repo ใหม่ดีที่สุด เช่น:
nongnam-clean-rebuild
