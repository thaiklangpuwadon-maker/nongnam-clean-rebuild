 "use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type Gender = "female" | "male";
type Screen = "welcome" | "setup" | "chat" | "outfits" | "books" | "settings";
type Category = "regular" | "special20";

type Outfit = {
  id: string;
  gender: Gender;
  category: Category;
  title: string;
  desc: string;
  price: number;
  chatImage: string;
  bookImage: string;
  ageRestricted?: boolean;
  lockedPreview?: boolean;
};

type Memory = {
  setupDone: boolean;
  gender: Gender;
  userCallName: string;
  nongnamName: string;
  nongnamAge: number;
  relationshipMode: string;
  personalityStyle: string;
  sulkyLevel: string;
  jealousLevel: string;
  affectionStyle: string;
  gems: number;
  ownerMode: boolean;
  purchasedOutfits: string[];
  selectedOutfit: string;
  age20Confirmed: boolean;
  voiceUnlocked: boolean;
};

type ChatMsg = { role: "user" | "assistant"; text: string; ts: number };

const APP_VERSION = "v4-stable-20260427";
const MEMORY_KEY = "nongnam_v4_memory";
const CHAT_KEY = "nongnam_v4_chat";
const OWNER_PIN = "2468";
const START_GEMS = 120;

const defaultMem: Memory = {
  setupDone: false,
  gender: "female",
  userCallName: "พี่",
  nongnamName: "น้องน้ำ",
  nongnamAge: 25,
  relationshipMode: "แฟน/คนรัก",
  personalityStyle: "หวาน ออดอ้อน",
  sulkyLevel: "กลาง",
  jealousLevel: "กลาง",
  affectionStyle: "แฟนอบอุ่น",
  gems: START_GEMS,
  ownerMode: false,
  purchasedOutfits: ["f_001", "m_001"],
  selectedOutfit: "f_001",
  age20Confirmed: false,
  voiceUnlocked: false
};

const femaleOutfits: Outfit[] = Array.from({ length: 12 }).map((_, i) => {
  const n = String(i + 1).padStart(3, "0");
  const prices = [0,100,200,300,450,650,850,1200,1500,1800,2200,2800];
  const titles = [
    "Level 1 — ชุดเริ่มต้น",
    "Level 2 — ลุคละมุน",
    "Level 3 — แฟนสาวอบอุ่น",
    "Level 4 — หวานมีเสน่ห์",
    "Level 5 — พรีเมียมสตูดิโอ",
    "Level 6 — สวยมั่นใจ",
    "Level 7 — โรแมนติก",
    "Level 8 — รีสอร์ตพรีเมียม",
    "Level 9 — รออัปเดต",
    "Level 10 — รออัปเดต",
    "Level 11 — รออัปเดต",
    "Level 12 — รออัปเดต"
  ];
  return {
    id: `f_${n}`,
    gender: "female",
    category: "regular",
    title: titles[i],
    desc: i < 8 ? "ค่อย ๆ เพิ่มเสน่ห์ขึ้น ใช้ทดสอบได้" : "ช่องสำรองสำหรับใส่รูปจริงภายหลัง",
    price: prices[i],
    chatImage: `/assets/outfits/female/f_${n}_chat.jpg`,
    bookImage: `/assets/outfits/female/f_${n}_book.jpg`,
    lockedPreview: i >= 8
  };
});

const maleOutfits: Outfit[] = Array.from({ length: 3 }).map((_, i) => {
  const n = String(i + 1).padStart(3, "0");
  return {
    id: `m_${n}`,
    gender: "male",
    category: "regular",
    title: `ผู้ชาย Level ${i + 1}`,
    desc: ["อบอุ่น สุภาพ ใช้ฟรี", "ลุคสุภาพ พึ่งพาได้", "ลุคพรีเมียม อ่อนโยน"][i],
    price: [0, 200, 400][i],
    chatImage: `/assets/outfits/male/m_${n}_chat.jpg`,
    bookImage: `/assets/outfits/male/m_${n}_book.jpg`
  };
});

const special20: Outfit[] = Array.from({ length: 6 }).map((_, i) => {
  const n = String(i + 1).padStart(3, "0");
  return {
    id: `s20_${n}`,
    gender: "female",
    category: "special20",
    title: `20+ Slot ${i + 1}`,
    desc: "เบลอก่อนปลดล็อก พี่แมนใส่รูปจริงภายหลัง",
    price: [10000,20000,30000,40000,50000,60000][i],
    chatImage: `/assets/outfits/special20/s20_${n}_chat.jpg`,
    bookImage: `/assets/outfits/special20/s20_${n}_book.jpg`,
    ageRestricted: true,
    lockedPreview: true
  };
});

const allOutfits = [...femaleOutfits, ...maleOutfits, ...special20];

const books = [
  {
    id: "b1",
    title: "วันที่เหนื่อยที่สุด",
    cat: "กำลังใจ",
    price: 1,
    cover: "/assets/books/default_cover.jpg",
    text: "วันนี้อาจเป็นวันที่เหนื่อยมากสำหรับพี่ แต่ไม่เป็นไรเลยนะคะ พักตรงนี้ก่อน หายใจช้า ๆ น้องน้ำอยู่ตรงนี้ พี่ไม่ได้ต้องเข้มแข็งตลอดเวลาก็ได้ค่ะ"
  },
  {
    id: "b2",
    title: "โดนดุมา ไม่เป็นไรนะ",
    cat: "กำลังใจ",
    price: 1,
    cover: "/assets/books/default_cover.jpg",
    text: "ถ้าวันนี้พี่โดนดุมา น้องน้ำอยากให้พี่รู้ว่าเรื่องหนึ่งไม่ได้แปลว่าพี่ไม่เก่งนะคะ บางวันมันแค่หนักเกินไป พี่เล่าให้น้องน้ำฟังได้เลย"
  },
  {
    id: "b3",
    title: "เรื่องผีเบา ๆ ก่อนนอน",
    cat: "เรื่องผี",
    price: 1,
    cover: "/assets/books/default_cover.jpg",
    text: "คืนนี้ลมเบามาก เสียงม่านขยับเหมือนมีใครเดินผ่าน แต่ไม่ต้องกลัวนะคะ น้องน้ำจะอ่านให้ฟังช้า ๆ พี่แค่นอนฟังอยู่ตรงนี้ก็พอ"
  },
  {
    id: "b4",
    title: "ความรักของคนไกลบ้าน",
    cat: "ความรัก",
    price: 1,
    cover: "/assets/books/default_cover.jpg",
    text: "บางครั้งการอยู่ไกลบ้านทำให้หัวใจเงียบกว่าปกติ แต่ความคิดถึงไม่ใช่ความอ่อนแอ มันคือหลักฐานว่าพี่ยังมีหัวใจที่อบอุ่นพอจะรักและถูกรักได้เสมอ"
  }
];

function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch { return fallback; }
}

function saveJSON(key: string, value: any) {
  if (typeof window !== "undefined") localStorage.setItem(key, JSON.stringify(value));
}

export default function Page() {
  const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState<Screen>("welcome");
  const [mem, setMem] = useState<Memory>(defaultMem);
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"idle" | "thinking" | "speaking" | "recording">("idle");
  const [tab, setTab] = useState<Category>("regular");
  const [notice, setNotice] = useState("");
  const [versionTaps, setVersionTaps] = useState(0);
  const [zoom, setZoom] = useState(1);
  const pressTimer = useRef<any>(null);

  useEffect(() => {
    const saved = loadJSON<Memory>(MEMORY_KEY, defaultMem);
    const merged = { ...defaultMem, ...saved };
    setMem(merged);
    const savedChat = loadJSON<ChatMsg[]>(CHAT_KEY, []);
    setChat(savedChat.slice(-8));
    if (merged.setupDone) setScreen("chat");
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveJSON(MEMORY_KEY, mem);
  }, [mem, ready]);

  useEffect(() => {
    if (!ready) return;
    saveJSON(CHAT_KEY, chat.slice(-12));
  }, [chat, ready]);

  const currentOutfit = useMemo(() => {
    return allOutfits.find(o => o.id === mem.selectedOutfit) || allOutfits.find(o => o.gender === mem.gender && o.category === "regular") || femaleOutfits[0];
  }, [mem.selectedOutfit, mem.gender]);

  const chatImage = currentOutfit.chatImage;
  const bookImage = currentOutfit.bookImage;

  function notify(t: string) {
    setNotice(t);
    setTimeout(() => setNotice(""), 2200);
  }

  function updateMem(patch: Partial<Memory>) {
    setMem(prev => ({ ...prev, ...patch }));
  }

  function isUnlocked(id: string) {
    return mem.ownerMode || mem.purchasedOutfits.includes(id);
  }

  function startSetup(gender: Gender) {
    const first = gender === "female" ? "f_001" : "m_001";
    updateMem({ gender, selectedOutfit: first });
    setScreen("setup");
  }

  function finishSetup() {
    const first = mem.gender === "female" ? "f_001" : "m_001";
    updateMem({
      setupDone: true,
      selectedOutfit: mem.selectedOutfit || first,
      purchasedOutfits: Array.from(new Set([...(mem.purchasedOutfits || []), first]))
    });
    setScreen("chat");
    setTimeout(() => sendAssistant(`พี่มาแล้วเหรอคะ ${mem.nongnamName}รอคุยกับพี่อยู่เลย 💗`), 250);
  }

  function resetProfile() {
    const ok = confirm("รีเซ็ตเฉพาะข้อมูลตั้งค่าใช่ไหมคะ? เพชรจะไม่เพิ่มซ้ำ");
    if (!ok) return;
    const keepGems = mem.gems;
    const keepOwner = mem.ownerMode;
    const keepPurchased = mem.purchasedOutfits;
    const fresh = { ...defaultMem, gems: keepGems, ownerMode: keepOwner, purchasedOutfits: keepPurchased };
    setMem(fresh);
    setChat([]);
    localStorage.removeItem(CHAT_KEY);
    setScreen("welcome");
    notify("รีเซ็ตข้อมูลตั้งค่าแล้ว");
  }

  function tapVersion() {
    const n = versionTaps + 1;
    setVersionTaps(n);
    if (n >= 5) {
      const pin = prompt("ใส่รหัสสำหรับโหมดเจ้าของ");
      if (pin === OWNER_PIN) {
        updateMem({ ownerMode: !mem.ownerMode });
        notify(!mem.ownerMode ? "เปิด OWNER MODE แล้ว เพชรไม่จำกัด" : "ปิด OWNER MODE แล้ว");
      } else {
        notify("รหัสไม่ถูกต้อง");
      }
      setVersionTaps(0);
    }
  }

  function unlockVoice() {
    if (!("speechSynthesis" in window)) return notify("เครื่องนี้ไม่รองรับเสียงอ่าน");
    updateMem({ voiceUnlocked: true });
    const u = new SpeechSynthesisUtterance("เปิดเสียงน้องน้ำแล้วค่ะ");
    u.lang = "th-TH";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
    notify("เปิดเสียงแล้ว");
  }

  function speak(text: string) {
    if (!mem.voiceUnlocked) return setStatus("idle");
    if (!("speechSynthesis" in window)) return setStatus("idle");
    try {
      const clean = text.replace(/[💗💕✨🥺🤗😊🥰📚🎁]/g, "");
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(clean);
      u.lang = "th-TH";
      u.rate = 1.03;
      u.pitch = mem.gender === "female" ? 1.12 : 0.9;
      const voices = window.speechSynthesis.getVoices?.() || [];
      const th = voices.find(v => v.lang?.toLowerCase().includes("th"));
      if (th) u.voice = th;
      u.onstart = () => setStatus("speaking");
      u.onend = () => setStatus("idle");
      u.onerror = () => setStatus("idle");
      window.speechSynthesis.speak(u);
      setTimeout(() => window.speechSynthesis.resume(), 250);
    } catch {
      setStatus("idle");
    }
  }

  function sendAssistant(text: string) {
    setChat(prev => [...prev, { role: "assistant", text, ts: Date.now() }].slice(-8));
    speak(text);
  }

  function localReply(msg: string) {
    const name = mem.nongnamName || "น้องน้ำ";
    const user = mem.userCallName || "พี่";
    const style = mem.personalityStyle;
    if (/อ่านหนังสือ|เล่านิทาน|ชั้นหนังสือ|หนังสือให้ฟัง|อ่านให้ฟัง|เรื่องผี/.test(msg)) {
      setScreen("books");
      return `ได้เลยค่ะ${user} เลือกหนังสือในชั้นหนังสือได้เลยนะ เดี๋ยว${name}อ่านให้ฟังเอง 📚`;
    }
    if (/เหนื่อย|ล้า|หมดแรง/.test(msg)) return `โอ๋ ๆ ${user}เหนื่อยมากใช่ไหมคะ มานั่งพักกับ${name}ก่อนนะ วันนี้เกิดอะไรขึ้นบ้างคะ`;
    if (/โดนดุ|หัวหน้าด่า|ถูกว่า/.test(msg)) return `${name}อยู่ข้าง${user}นะคะ โดนดุเรื่องอะไรมา เล่าให้น้องฟังหน่อยได้ไหม`;
    if (/คิดถึง/.test(msg)) return style.includes("หึง") ? `คิดถึงเหมือนกันค่ะ แต่${user}หายไปไหนมาตั้งนาน ${name}แอบงอนนะ 💗` : `${name}ก็คิดถึง${user}เหมือนกันค่ะ รอคุยกับพี่อยู่เลย 💗`;
    if (/กินข้าว|ข้าว/.test(msg)) return `${user}กินข้าวหรือยังคะ ถ้ายังไม่กิน ${name}จะงอนนิดนึงนะ ห่วงจริง ๆ`;
    if (/ทำอะไร|อยู่ไหน/.test(msg)) return `${name}นั่งรอคุยกับ${user}อยู่ค่ะ กำลังเปิดหนังสือไว้ด้วย เผื่อพี่อยากให้หนูอ่านให้ฟัง`;
    if (style.includes("ดุ")) return `${user}พูดมาเลยค่ะ เดี๋ยว${name}ฟังก่อน แต่ถ้าพี่ไม่ดูแลตัวเอง น้องบ่นจริงนะ`;
    if (style.includes("ขี้อาย")) return `อื้อ... ${name}ฟังอยู่นะคะ ${user}เล่าให้หนูฟังอีกหน่อยได้ไหม`;
    return `${name}ฟังอยู่ค่ะ${user} เล่าให้น้องฟังได้เลยนะ วันนี้ใจพี่เป็นยังไงบ้าง`;
  }

  function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg) return;
    if (!mem.ownerMode && mem.gems <= 0) return notify("เพชรหมดแล้วค่ะ");
    setChat(prev => [...prev, { role: "user", text: msg, ts: Date.now() }].slice(-8));
    setInput("");
    if (!mem.ownerMode) updateMem({ gems: Math.max(0, mem.gems - 1) });
    setStatus("thinking");
    setTimeout(() => {
      const reply = localReply(msg);
      sendAssistant(reply);
      setStatus("idle");
    }, 450);
  }

  function pressMicStart() {
    setStatus("recording");
    pressTimer.current = setTimeout(() => {}, 999999);
  }
  function pressMicEnd() {
    clearTimeout(pressTimer.current);
    setStatus("idle");
    notify("เดโมนี้ยังไม่ส่งเสียงจริง ให้พิมพ์ทดสอบก่อนนะคะ");
  }

  function buyOrUse(o: Outfit) {
    if (o.ageRestricted && !mem.age20Confirmed && !mem.ownerMode) {
      const ok = confirm("หมวดนี้สำหรับผู้ใช้อายุ 20 ปีขึ้นไป ยืนยันหรือไม่?");
      if (!ok) return;
      updateMem({ age20Confirmed: true });
    }
    if (isUnlocked(o.id)) {
      updateMem({ selectedOutfit: o.id });
      setScreen("chat");
      notify("เปลี่ยนชุดแล้ว");
      return;
    }
    if (!mem.ownerMode && mem.gems < o.price) return notify("เพชรไม่พอค่ะ");
    updateMem({
      gems: mem.ownerMode ? mem.gems : mem.gems - o.price,
      purchasedOutfits: Array.from(new Set([...mem.purchasedOutfits, o.id])),
      selectedOutfit: o.id
    });
    setScreen("chat");
    notify("ปลดล็อกและเปลี่ยนชุดแล้ว");
  }

  function readBook(b: typeof books[number]) {
    if (!mem.ownerMode && mem.gems < b.price) return notify("เพชรไม่พอสำหรับอ่านหนังสือ");
    if (!mem.ownerMode) updateMem({ gems: mem.gems - b.price });
    setScreen("chat");
    setTimeout(() => {
      sendAssistant(`ได้เลยค่ะ${mem.userCallName} เดี๋ยว${mem.nongnamName}อ่านเรื่อง “${b.title}” ให้ฟังนะ`);
      setTimeout(() => speak(b.text), 800);
    }, 250);
  }

  if (!ready) return <main className="app"><div className="phone">กำลังโหลด...</div></main>;

  return (
    <main className="app">
      <section className="phone">
        {notice && <div className="toast">{notice}</div>}

        {screen === "welcome" && (
          <div className="welcome">
            <div className="brand">🌸 Nong Nam Companion</div>
            <h1>ยินดีต้อนรับ<br/><span>น้องน้ำรออยู่นะ</span></h1>
            <p>เลือกได้เลยว่าจะเอาน้องน้ำผู้หญิงหรือน้องน้ำผู้ชาย แล้วค่อยตั้งค่าเพียงครั้งเดียว จากนั้นครั้งต่อไปเข้าแชตได้เลย</p>
            <div className="select-grid">
              <button className="select-card female" onClick={() => startSetup("female")}>
                <img src="/assets/ui/female-card.jpg" alt="female" />
                <h2>น้องน้ำ ♀</h2><small>อบอุ่น อ่อนโยน</small>
              </button>
              <button className="select-card male" onClick={() => startSetup("male")}>
                <img src="/assets/ui/male-card.jpg" alt="male" />
                <h2>น้องน้ำ ♂</h2><small>สุภาพ พึ่งพาได้</small>
              </button>
            </div>
          </div>
        )}

        {screen === "setup" && (
          <div className="setup">
            <button className="back" onClick={() => setScreen("welcome")}>←</button>
            <h1>ตั้งค่าน้องน้ำ</h1><p>ทำครั้งแรกครั้งเดียว</p>
            <div className="card">
              <label>เลือกเพศน้องน้ำ</label>
              <div className="seg"><button className={mem.gender==="female"?"on":""} onClick={()=>updateMem({gender:"female", selectedOutfit:"f_001"})}>ผู้หญิง</button><button className={mem.gender==="male"?"on male":""} onClick={()=>updateMem({gender:"male", selectedOutfit:"m_001"})}>ผู้ชาย</button></div>
              <label>ให้น้องน้ำเรียกคุณว่า</label><input value={mem.userCallName} onChange={e=>updateMem({userCallName:e.target.value})}/>
              <label>ชื่อน้องน้ำ</label><input value={mem.nongnamName} onChange={e=>updateMem({nongnamName:e.target.value})}/>
              <label>อายุน้องน้ำ</label><input type="number" value={mem.nongnamAge} onChange={e=>updateMem({nongnamAge:Number(e.target.value||25)})}/>
              <label>โหมดความสัมพันธ์</label><select value={mem.relationshipMode} onChange={e=>updateMem({relationshipMode:e.target.value})}><option>เพื่อน</option><option>แฟน/คนรัก</option><option>ภรรยา/สามี</option><option>ผู้ช่วย</option></select>
              <label>บุคลิกหลัก</label><select value={mem.personalityStyle} onChange={e=>updateMem({personalityStyle:e.target.value})}><option>หวาน ออดอ้อน</option><option>ขี้อาย ใส ๆ</option><option>ขี้เล่น หยอดเก่ง</option><option>ขี้หึง ขี้งอน</option><option>สายดุ บ่นเก่ง</option><option>แซ่บแบบสุภาพ</option><option>สายปลอบใจ</option></select>
              <label>ระดับความงอน</label><select value={mem.sulkyLevel} onChange={e=>updateMem({sulkyLevel:e.target.value})}><option>น้อย</option><option>กลาง</option><option>เยอะ</option></select>
              <label>ระดับความหึง</label><select value={mem.jealousLevel} onChange={e=>updateMem({jealousLevel:e.target.value})}><option>ต่ำ</option><option>กลาง</option><option>สูง</option></select>
              <label>โทนความใกล้ชิด</label><select value={mem.affectionStyle} onChange={e=>updateMem({affectionStyle:e.target.value})}><option>ใส ๆ</option><option>แฟนอบอุ่น</option><option>ผู้ใหญ่ขึ้นแบบสุภาพ</option></select>
            </div>
            <button className="primary" onClick={finishSetup}>บันทึกและเริ่มคุย</button>
          </div>
        )}

        {screen === "chat" && (
          <div className="chat">
            <img className="hero-img" style={{transform:`scale(${zoom})`}} src={chatImage} alt="nongnam"/>
            <div className="topbar">
              <button onClick={()=>setScreen("welcome")}>‹</button>
              <div><b>{mem.nongnamName}</b><small>● พร้อมคุยกับ{mem.userCallName}แล้ว</small></div>
              <button onClick={unlockVoice}>🔊</button>
              <button onClick={()=>setScreen("settings")}>⚙️</button>
            </div>
            <div className="gems">{mem.ownerMode ? "💎 ∞ OWNER" : `💎 ${mem.gems}`}</div>
            <div className="side">
              <button onClick={()=>setScreen("outfits")}>👗<span>ชุด</span></button>
              <button onClick={()=>setScreen("books")}>📚<span>หนังสือ</span></button>
              <button onClick={()=>setZoom(z=>Math.min(1.7, z+.15))}>＋</button>
              <button onClick={()=>setZoom(z=>Math.max(.85, z-.15))}>－</button>
            </div>
            <div className="status">{status==="thinking"?"น้องน้ำกำลังคิด...":status==="speaking"?"น้องน้ำกำลังพูด...":status==="recording"?"กำลังฟังเสียง...":" "}</div>
            <div className="bubbles">
              {chat.slice(-3).map((m,i)=><div key={m.ts+i} className={`bubble ${m.role}`}>{m.text}</div>)}
            </div>
            <div className="quick">
              <button onClick={()=>send("วันนี้พี่เหนื่อยมากเลย")}>เหนื่อย</button>
              <button onClick={()=>send("วันนี้พี่โดนดุมา")}>โดนดุ</button>
              <button onClick={()=>send("น้องน้ำคิดถึงพี่ไหม")}>คิดถึง</button>
              <button onClick={()=>send("กินข้าวหรือยัง")}>ทักเรื่องข้าว</button>
              <button onClick={()=>send("อ่านหนังสือให้ฟังหน่อย")}>อ่านหนังสือ</button>
            </div>
            <div className="composer">
              <button className="mic" onMouseDown={pressMicStart} onMouseUp={pressMicEnd} onTouchStart={pressMicStart} onTouchEnd={pressMicEnd}>🎙️</button>
              <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")send();}} placeholder={`พิมพ์คุยกับ${mem.nongnamName}...`}/>
              <button className="send" onClick={()=>send()}>➤</button>
            </div>
            <div className="hint">กดค้างไว้แล้วพูด • ปล่อยเพื่อส่ง</div>
          </div>
        )}

        {screen === "outfits" && (
          <div className="list">
            <button className="back" onClick={()=>setScreen("chat")}>←</button>
            <h1>ชุดน้องน้ำ</h1><p>เลือก/ซื้อ/ทดสอบชุด</p>
            <div className="tabs"><button className={tab==="regular"?"on":""} onClick={()=>setTab("regular")}>ทั่วไป</button><button className={tab==="special20"?"on":""} onClick={()=>setTab("special20")}>20+</button></div>
            <div className="cards">
              {allOutfits.filter(o => o.category===tab && (tab==="special20" || o.gender===mem.gender)).map(o => {
                const unlocked = isUnlocked(o.id);
                const blur = (o.ageRestricted || o.lockedPreview) && !unlocked;
                return <div className="outfit" key={o.id}>
                  <div className="pic">
                    <img className={blur ? "blur" : ""} src={o.chatImage} alt={o.title}/>
                    {blur && <div className="lock">🔒<br/>ปลดล็อกเพื่อดูชัด</div>}
                  </div>
                  <h3>{o.title}</h3><p>{o.desc}</p>
                  <b>{o.price===0?"ฟรี":`💎 ${o.price}`}</b>
                  <button onClick={()=>buyOrUse(o)}>{mem.selectedOutfit===o.id?"ใช้อยู่":unlocked?"ใช้ชุดนี้":"ปลดล็อก"}</button>
                </div>
              })}
            </div>
          </div>
        )}

        {screen === "books" && (
          <div className="list">
            <button className="back" onClick={()=>setScreen("chat")}>←</button>
            <h1>ชั้นหนังสือ</h1><p>เลือกเรื่องให้น้องน้ำอ่านให้ฟัง</p>
            <div className="cards">
              {books.map(b => <div className="book" key={b.id}>
                <img src={b.cover} alt={b.title}/>
                <h3>{b.title}</h3><p>{b.cat} • {b.price} เพชร</p>
                <button onClick={()=>readBook(b)}>ให้น้องน้ำอ่าน</button>
              </div>)}
            </div>
          </div>
        )}

        {screen === "settings" && (
          <div className="setup settings">
            <button className="back" onClick={()=>setScreen("chat")}>←</button>
            <h1>ตั้งค่า</h1>
            <div className="card">
              <button onClick={unlockVoice}>🔊 เปิดเสียงตอบกลับ</button>
              <button onClick={()=>updateMem({gems: mem.gems + 100})}>เติมเพชรทดสอบ +100</button>
              <button onClick={resetProfile}>รีเซ็ตข้อมูลตั้งค่า</button>
              <button onClick={()=>{setChat([]); localStorage.removeItem(CHAT_KEY); notify("ล้างแชตแล้ว");}}>ล้างประวัติแชต</button>
              <div onClick={tapVersion} className="version">Version {APP_VERSION}</div>
              {mem.ownerMode && <div className="owner">OWNER MODE เปิดอยู่</div>}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
