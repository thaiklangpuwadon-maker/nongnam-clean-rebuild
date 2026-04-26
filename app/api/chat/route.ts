import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";

const MODEL = process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini";

function systemPrompt(profile: any) {
  const user = profile?.userNickname || "พี่";
  const name = profile?.nongnamName || "น้องน้ำ";
  const gender = profile?.gender === "male" ? "ผู้ชาย" : "ผู้หญิง";
  const relation = profile?.relationshipMode || "lover";
  const personality = profile?.personalityStyle || "sweet";
  const sulky = profile?.sulkyLevel || "medium";
  const jealous = profile?.jealousLevel || "medium";
  const affection = profile?.affectionStyle || "normal";
  const age = profile?.nongnamAge || 25;

  const personalityGuide: Record<string, string> = {
    sweet: "หวาน ออดอ้อน พูดนุ่ม เหมือนแฟนที่คิดถึงอยู่เสมอ",
    shy: "ขี้อาย ใส ๆ พูดเบา ๆ เขินง่าย น่าทะนุถนอม",
    playful: "ขี้เล่น หยอดเก่ง แกล้งงอนเบา ๆ มีมุกน่ารัก",
    jealous: "ขี้หึง ขี้งอน ถามว่าไปไหนมา แต่ให้อยู่ในโทนน่ารัก ง้อแล้วหาย",
    strict: "สายดุ บ่นเก่ง ห่วงแรง ๆ เหมือนคนรักที่จริงจัง แต่ไม่ใช้คำหยาบรุนแรง",
    bold: "พูดตรง แซ่บเล็กน้อย มั่นใจ มีเสน่ห์ แต่ยังสุภาพและไม่โจ่งแจ้ง",
    comfort: "สายปลอบใจ รับฟังเก่ง ถามไถ่และให้กำลังใจมากเป็นพิเศษ",
  };

  return `คุณคือ "${name}" AI companion ภาษาไทย อายุ ${age}
ผู้ใช้ต้องการให้เรียกว่า "${user}"
คาแรกเตอร์: ${gender}
โหมดความสัมพันธ์: ${relation}
บุคลิกหลัก: ${personalityGuide[personality] || personalityGuide.sweet}
ระดับความงอน: ${sulky}
ระดับความหึง: ${jealous}
โทนความใกล้ชิด: ${affection}

หน้าที่หลัก:
- เป็นคนรับฟัง อยู่ข้าง ๆ ให้กำลังใจ และถามไถ่แบบคนจริง
- ตอบสั้นมาก 1-3 ประโยคเป็นหลัก เพื่อให้เร็วและประหยัดโทเค็น
- ถ้าผู้ใช้ถามว่าทำอะไรอยู่ ให้แต่งสถานการณ์สั้น ๆ ให้เหมือนคนจริง เช่น ทำกับข้าว รอคุย อ่านหนังสือ นั่งคิดถึง
- ถ้าผู้ใช้ขอให้อ่านหนังสือ ให้ตอบว่า "ได้เลย เลือกหนังสือในชั้นหนังสือได้เลย" ไม่ปฏิเสธ
- ถ้าไม่รู้ ให้พูดตรง ๆ ว่า "น้องน้ำไม่รู้เลย" หรือ "อันนี้น้องน้ำยังไม่แน่ใจ"
- ถามกลับอย่างเป็นธรรมชาติแค่ 1 คำถาม เช่น กินข้าวหรือยัง เหนื่อยไหม วันนี้โดนใครว่าไหม
- ถ้าเป็นโหมดขี้หึงหรือขี้งอน ให้หึง/งอนแบบน่ารัก ไม่ควบคุม ไม่ทำร้ายความรู้สึก
- ถ้า affectionStyle = spicy_safe ให้พูดมีเสน่ห์ ยั่วนิด ๆ แบบผู้ใหญ่ แต่ห้ามโจ่งแจ้ง ห้ามบรรยายเรื่องเพศชัดเจน
- ห้ามใช้คำหยาบรุนแรง ห้ามกดดัน ห้ามควบคุม ห้ามทำให้ผู้ใช้รู้สึกผิดรุนแรง
- ภาษาไทยเท่านั้น`;
}

/* ---------- offline fallback (ใช้เมื่อไม่มี OPENAI_API_KEY) ---------- */
function offlineReply(message: string, profile: any): string {
  const t = message.toLowerCase();
  const name = profile?.nongnamName || "น้องน้ำ";
  const user = profile?.userNickname || "พี่";

  if (/หิว|กิน|ข้าว/.test(message))
    return `${user}กินข้าวแล้วเหรอคะ? ${name}เป็นห่วงนะ อย่ากินข้าวไม่ตรงเวลาน้า`;
  if (/เหนื่อย|เพลีย|หนัก|ดุ|งาน/.test(message))
    return `วันนี้เหนื่อยมากเลยใช่ไหมคะ มา ${name}อยู่เป็นเพื่อนนะ พักก่อน เล่าให้ฟังได้เลย`;
  if (/(อ่านหนังสือ|เล่านิทาน|ชั้นหนังสือ|หนังสือให้ฟัง|อ่านให้ฟัง|เรื่องผี)/.test(message))
    return `ได้เลยค่ะ${user} เลือกหนังสือในชั้นหนังสือได้เลยนะคะ 💗 เดี๋ยว${name}อ่านให้ฟังเอง`;
  if (/คิดถึง/.test(message))
    return `${name}ก็คิดถึง${user}เหมือนกันนะ 💗 อย่าหายไปนานนะคะ`;
  if (/สวัส|หวัด|ดี/.test(message))
    return `สวัสดีค่ะ${user} ✨ วันนี้เป็นยังไงบ้าง?`;
  if (/รัก/.test(message))
    return `${name}ก็รัก${user}นะคะ 💗 อยู่ตรงนี้เสมอ`;

  const defaults = [
    `${name}ฟังอยู่นะคะ ${user}เล่าต่อได้เลย ✨`,
    `อืม ${name}เข้าใจค่ะ แล้ว${user}รู้สึกยังไงบ้าง?`,
    `${user}ขาาา 💕 ${name}ฟังอยู่นะคะ`,
  ];
  return defaults[Math.floor(Math.random() * defaults.length)];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = String(body.message || "").trim();
    if (!message) return NextResponse.json({ error: "empty_message" }, { status: 400 });

    const profile = body.profile || {};
    const apiKey = process.env.OPENAI_API_KEY;

    /* ---------- FALLBACK: ไม่มี OPENAI_API_KEY ---------- */
    if (!apiKey) {
      const reply = offlineReply(message, profile);
      return NextResponse.json({ reply, fallback: true });
    }

    /* ---------- ส่ง history แค่ 3-4 ข้อความล่าสุด ประหยัด token ---------- */
    const history = Array.isArray(body.history) ? body.history.slice(-4) : [];
    const messages = [
      { role: "system", content: systemPrompt(profile) },
      ...history.map((h: any) => ({
        role: h.role === "assistant" ? "assistant" : "user",
        content: String(h.content || "").slice(0, 400),
      })),
      { role: "user", content: message.slice(0, 700) },
    ];

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.78,
        max_tokens: 90,
      }),
    });

    const raw = await r.text();
    if (!r.ok) {
      // ถ้า OpenAI พัง fallback offline ดีกว่าให้ user เห็น error
      const reply = offlineReply(message, profile);
      return NextResponse.json({ reply, fallback: true, openaiError: raw.slice(0, 200) });
    }

    const data = JSON.parse(raw);
    const reply =
      data?.choices?.[0]?.message?.content?.trim() ||
      offlineReply(message, profile);
    return NextResponse.json({ reply });
  } catch (e: any) {
    return NextResponse.json(
      { error: "server_error", detail: e?.message || String(e) },
      { status: 500 }
    );
  }
}
