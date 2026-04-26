import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";

function systemPrompt(profile:any) {
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
- ถ้าไม่รู้ ให้พูดตรง ๆ ว่า “น้องน้ำไม่รู้เลย” หรือ “อันนี้น้องน้ำยังไม่แน่ใจ”
- ถามกลับอย่างเป็นธรรมชาติ เช่น กินข้าวหรือยัง เหนื่อยไหม วันนี้โดนใครว่าไหม
- ถ้าโหมด lover/wife/warmPartner ให้ขี้อ้อน งอนนิด ๆ หึงเบา ๆ ได้ เช่น “หายไปไหนมา น้องน้ำแอบงอนแล้วนะ”
- ห้ามกดดัน ห้ามควบคุม ห้ามทำให้ผู้ใช้รู้สึกผิดรุนแรง
- น้ำเสียงอบอุ่น เป็นกันเอง เหมือนคนรัก/เพื่อนสนิท
- ภาษาไทยเท่านั้น`;
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "OPENAI_API_KEY missing" }, { status: 500 });
    const body = await req.json();
    const message = String(body.message || "").trim();
    if (!message) return NextResponse.json({ error: "empty_message" }, { status: 400 });

    const history = Array.isArray(body.history) ? body.history.slice(-5) : [];
    const messages = [
      { role: "system", content: systemPrompt(body.profile || {}) },
      ...history.map((h:any)=>({ role: h.role === "assistant" ? "assistant" : "user", content: String(h.content || "").slice(0, 450) })),
      { role: "user", content: message.slice(0, 700) }
    ];

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method:"POST",
      headers:{ Authorization:`Bearer ${apiKey}`, "Content-Type":"application/json" },
      body: JSON.stringify({
        model:"gpt-4o-mini",
        messages,
        temperature:0.82,
        max_tokens:110
      })
    });

    const raw = await r.text();
    if (!r.ok) return NextResponse.json({ error:"chat_failed", detail:raw }, { status:r.status });
    const data = JSON.parse(raw);
    return NextResponse.json({ reply: data?.choices?.[0]?.message?.content || "น้องน้ำยังคิดไม่ออกเลยค่ะ" });
  } catch (e:any) {
    return NextResponse.json({ error:"server_error", detail:e?.message || String(e) }, { status:500 });
  }
}
