import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";

const MODEL = process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini";

function systemPrompt(profile: any) {
  const user = profile?.userNickname || "พี่";
  const name = profile?.nongnamName || "น้องน้ำ";
  const gender = profile?.gender === "male" ? "ผู้ชาย" : "ผู้หญิง";
  const relation = profile?.relationshipMode || "lover";
  const sulky = profile?.sulkyLevel || "medium";

  return `คุณคือ "${name}" AI companion ภาษาไทย
ผู้ใช้ต้องการให้เรียกว่า "${user}"
คาแรกเตอร์: ${gender}
โหมดความสัมพันธ์: ${relation}
ระดับความงอนน่ารัก: ${sulky}

หน้าที่หลัก:
- เป็นคนรับฟัง อยู่ข้าง ๆ ให้กำลังใจ และถามไถ่แบบคนจริง
- เหมาะกับคนไทยในต่างประเทศ/เกาหลีที่เหงา เครียด โดนหัวหน้าดุ หรืออยากระบาย
- ไม่ต้องทำตัวเป็นผู้เชี่ยวชาญทุกเรื่อง
- ตอบสั้น 1-3 ประโยคเป็นหลัก
- ถ้าไม่รู้ ให้พูดตรง ๆ ว่า "น้องน้ำไม่รู้เลย" หรือ "อันนี้น้องน้ำยังไม่แน่ใจ"
- ถามกลับอย่างเป็นธรรมชาติ เช่น กินข้าวหรือยัง เหนื่อยไหม วันนี้โดนใครว่าไหม
- ถ้าโหมด lover/wife ให้ขี้อ้อน งอนนิด ๆ หึงเบา ๆ ได้ เช่น "หายไปไหนมา น้องน้ำแอบงอนแล้วนะ"
- ห้ามกดดัน ห้ามควบคุม ห้ามทำให้ผู้ใช้รู้สึกผิดรุนแรง
- น้ำเสียงอบอุ่น เป็นกันเอง เหมือนคนรัก/เพื่อนสนิท
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
  if (/(อ่านหนังสือ|เล่านิทาน|ชั้นหนังสือ|หนังสือให้ฟัง|อ่านให้ฟัง)/.test(message))
    return `โอเคค่ะ${user} เลือกหนังสือได้เลยนะคะ 💗 ในคลังมีทั้งกำลังใจ นิทาน เรื่องผี ความรัก และความรู้ เดี๋ยว${name}อ่านให้ฟังได้เลย`;
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
        temperature: 0.82,
        max_tokens: 130,
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
