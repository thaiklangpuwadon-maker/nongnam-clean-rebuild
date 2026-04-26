"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BOOK_CATEGORIES,
  BookCategory,
  Book,
  Outfit,
  OutfitCategory,
  buildDefaultManifest,
} from "../lib/appData";
import {
  DEFAULT_USER_MEMORY,
  LOCAL_ASSETS_KEY,
  MEMORY_KEY,
  MANIFEST_KEY,
  UserMemory,
  getDefaultOutfitId,
  loadJSON,
  loadLocalManifest,
  resetCharacterOnly,
  saveJSON,
} from "../lib/storage";
import {
  BUCKET,
  fetchManifestRemote,
  getSupabaseBrowserClient,
  hasSupabaseConfig,
} from "../lib/supabase";

type Screen = "welcome" | "setup" | "chat" | "outfits" | "books" | "reader" | "settings";
type Status = "idle" | "recording" | "transcribing" | "thinking" | "speaking";

const APP_VERSION = "v3-final-today";
const OWNER_KEY = "nongnam_owner_mode_v3";

function mimeType(): string {
  const list = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/mpeg"];
  return list.find(t => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) || "";
}

export default function Page() {
  const router = useRouter();

  /* ---------- core state ---------- */
  const [screen, setScreen] = useState<Screen>("welcome");
  const [ready, setReady] = useState(false);
  const [mem, setMem] = useState<UserMemory>(DEFAULT_USER_MEMORY);
  const [assets, setAssets] = useState<Record<string, string>>({});
  const [manifest, setManifest] = useState(buildDefaultManifest());
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [toast, setToast] = useState("");
  const [category, setCategory] = useState<OutfitCategory>("regular");
  const [bookCat, setBookCat] = useState<BookCategory | "all">("all");
  const [activeBook, setActiveBook] = useState<Book | null>(null);
  const [ms, setMs] = useState(0);
  const [versionTaps, setVersionTaps] = useState(0);

  /* ---------- voice refs ---------- */
  const rec = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<BlobPart[]>([]);
  const startAt = useRef(0);
  const timer = useRef<any>(null);

  /* ---------- pinch-zoom state ---------- */
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [zoom, setZoom] = useState({ scale: 1, x: 0, y: 0 });
  const pinch = useRef({
    active: false,
    startDist: 0,
    startScale: 1,
    pointers: new Map<number, { x: number; y: number }>(),
    lastTap: 0,
    dragging: false,
    dragStart: { x: 0, y: 0 },
    zoomStart: { x: 0, y: 0 },
  });

  const supabaseReady = hasSupabaseConfig();
  const supabase = getSupabaseBrowserClient();

  /* ---------- derived ---------- */
  const allOutfits = manifest.outfits;
  const allBooks = manifest.books;

  const currentOutfit: Outfit =
    allOutfits.find(o => o.id === mem.selectedOutfitId) ||
    allOutfits.find(o => o.id === getDefaultOutfitId(mem.gender)) ||
    allOutfits[0];

  const currentChatImage = assets[`${currentOutfit.id}_chat`] || currentOutfit.chatImage;
  const currentBookImage =
    assets[`${currentOutfit.id}_book`] || currentOutfit.bookImage || currentChatImage;

  const visibleOutfits = useMemo(() => {
    return allOutfits.filter(
      o => o.visible !== false && o.gender === mem.gender && o.category === category
    );
  }, [allOutfits, mem.gender, category]);

  const visibleBooks = useMemo(() => {
    if (bookCat === "all") return allBooks;
    return allBooks.filter(b => b.category === bookCat);
  }, [allBooks, bookCat]);

  /* ---------- LOAD on mount ---------- */
  useEffect(() => {
    const savedMem = loadJSON<Partial<UserMemory>>(MEMORY_KEY, {});
    const merged = { ...DEFAULT_USER_MEMORY, ...savedMem };
    setMem(merged);

    const savedAssets = loadJSON<Record<string, string>>(LOCAL_ASSETS_KEY, {});
    setAssets(savedAssets);

    const owner = typeof window !== "undefined" && localStorage.getItem(OWNER_KEY) === "true";
    if (owner) merged.ownerMode = true;

    const savedManifest = loadLocalManifest();
    setManifest(savedManifest);

    // ถ้าตั้งค่าแล้วเข้า chat เลย
    if (merged.setupDone) setScreen("chat");

    setReady(true);
  }, []);

  /* ---------- PERSIST ---------- */
  useEffect(() => { if (ready) saveJSON(MEMORY_KEY, mem); }, [mem, ready]);
  useEffect(() => { if (ready) saveJSON(LOCAL_ASSETS_KEY, assets); }, [assets, ready]);

  /* ---------- LOAD remote manifest if Supabase ready ---------- */
  useEffect(() => {
    if (!supabaseReady) return;
    fetchManifestRemote().then(remote => {
      if (remote && Array.isArray(remote.outfits) && Array.isArray(remote.books)) {
        setManifest(remote);
      }
    });
  }, [supabaseReady]);

  /* ---------- LOAD remote outfit images ---------- */
  useEffect(() => {
    if (!supabaseReady || !supabase) return;
    const next: Record<string, string> = {};
    for (const o of allOutfits) {
      const chatPath = `outfits/${o.id}_chatImage.jpg`;
      const bookPath = `outfits/${o.id}_bookImage.jpg`;
      const { data: c } = supabase.storage.from(BUCKET).getPublicUrl(chatPath);
      const { data: b } = supabase.storage.from(BUCKET).getPublicUrl(bookPath);
      if (c?.publicUrl) next[`${o.id}_chat`] = `${c.publicUrl}?v=${Date.now()}`;
      if (b?.publicUrl) next[`${o.id}_book`] = `${b.publicUrl}?v=${Date.now()}`;
    }
    if (Object.keys(next).length) setAssets(prev => ({ ...prev, ...next }));
  }, [supabaseReady, allOutfits.length]);

  /* ---------- helpers ---------- */
  function notify(text: string) {
    setToast(text);
    setTimeout(() => setToast(""), 2600);
  }
  function updateMem(patch: Partial<UserMemory>) {
    setMem(prev => ({ ...prev, ...patch }));
  }
  function isUnlocked(id: string) {
    if (mem.ownerMode) return true;
    return mem.purchasedOutfitIds.includes(id);
  }

  /* ---------- reset (เก็บเพชร + ของที่ซื้อแล้ว) ---------- */
  function doResetCharacter() {
    if (!confirm("รีเซ็ตความจำ/ตัวละครน้องน้ำ?\nเครดิต ชุด และหนังสือที่ซื้อแล้วจะไม่ถูกลบ")) return;
    setMem(prev => resetCharacterOnly(prev));
    setScreen("setup");
    notify("รีเซ็ตเฉพาะความจำแล้วค่ะ");
  }

  /* ---------- setup flow ---------- */
  function pickGender(g: "female" | "male") {
    updateMem({
      gender: g,
      selectedOutfitId: g === "female" ? "f_001" : "m_001",
    });
    setScreen("setup");
  }

  function finishSetup() {
    setMem(prev => ({
      ...prev,
      setupDone: true,
      selectedOutfitId: prev.selectedOutfitId || getDefaultOutfitId(prev.gender),
      chat: prev.chat.length
        ? prev.chat
        : [{ role: "assistant", content: `${prev.userNickname}มาแล้วเหรอคะ วันนี้เหนื่อยไหม ${prev.nongnamName}อยู่ตรงนี้นะ` }],
    }));
    setScreen("chat");
  }

  /* ---------- outfit ---------- */
  function selectOutfit(id: string) {
    const o = allOutfits.find(x => x.id === id);
    if (!o) return;
    if (o.ageRestricted && !mem.age20Confirmed && !mem.ownerMode) {
      const ok = confirm("หมวดนี้สำหรับผู้ใช้อายุ 20 ปีขึ้นไป\nคุณยืนยันหรือไม่ว่าอายุ 20 ปีขึ้นไป?");
      if (!ok) return;
      updateMem({ age20Confirmed: true });
    }
    if (!isUnlocked(id)) return notify(`ชุดนี้ยังล็อกอยู่ ต้องใช้ ${o.price} เพชร`);
    updateMem({ selectedOutfitId: id });
    notify(`เปลี่ยนเป็น ${o.title} แล้ว`);
  }

  function buyOutfit(id: string) {
    const o = allOutfits.find(x => x.id === id);
    if (!o) return;
    if (mem.ownerMode) return selectOutfit(id);
    if (mem.purchasedOutfitIds.includes(id)) return selectOutfit(id);
    if (mem.gems < o.price) return notify("เพชรไม่พอค่ะ");
    if (!confirm(`ใช้ ${o.price} เพชรปลดล็อก "${o.title}" ใช่ไหม?`)) return;
    updateMem({
      gems: mem.gems - o.price,
      purchasedOutfitIds: [...mem.purchasedOutfitIds, id],
      selectedOutfitId: id,
    });
    notify("ซื้อชุดแล้วค่ะ ✨");
  }

  /* ---------- chat ---------- */
  function addChat(role: "user" | "assistant", content: string) {
    setMem(prev => ({ ...prev, chat: [...prev.chat, { role, content }].slice(-8) }));
  }

  function speak(text: string) {
    if (!("speechSynthesis" in window)) return setStatus("idle");
    try {
      speechSynthesis.cancel();
      speechSynthesis.resume();
      const clean = text.replace(/[💗💕✨🥺🤗😊🥰📋🍚🌸😮‍💨💞]/g, "");
      const u = new SpeechSynthesisUtterance(clean);
      u.lang = "th-TH";
      u.pitch = mem.gender === "female" ? 1.12 : 0.88;
      u.rate = 1.03;
      const voices = speechSynthesis.getVoices?.() || [];
      const thVoice = voices.find(v => /th|Thai/i.test(v.lang + " " + v.name));
      if (thVoice) u.voice = thVoice;
      u.onstart = () => setStatus("speaking");
      u.onend = () => setStatus("idle");
      u.onerror = () => setStatus("idle");
      speechSynthesis.speak(u);
      setTimeout(() => speechSynthesis.resume(), 250);
    } catch {
      setStatus("idle");
    }
  }

  function enableVoice() {
    if (!("speechSynthesis" in window)) return notify("เครื่องนี้ไม่รองรับเสียงอ่าน");
    updateMem({ voiceEnabled: true });
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance("เปิดเสียงน้องน้ำแล้วค่ะ");
    u.lang = "th-TH";
    u.rate = 1.05;
    speechSynthesis.speak(u);
    notify("เปิดเสียงแล้ว ถ้า iPhone ยังเงียบ ให้กดเปิดเสียงอีกครั้ง");
  }

  function isBookIntent(msg: string) {
    return /(อ่านหนังสือ|เล่านิทาน|ชั้นหนังสือ|หนังสือให้ฟัง|อ่านให้ฟัง|เรื่องผี)/.test(msg);
  }

  async function sendToAI(text: string) {
    const msg = text.trim();
    if (!msg) return;

    if (isBookIntent(msg)) {
      addChat("user", msg);
      const reply = `ได้เลยค่ะพี่ เลือกหนังสือในชั้นหนังสือได้เลยนะคะ 💗 มีทั้งกำลังใจ เรื่องผี ความรัก และบทความสั้น ๆ เดี๋ยว${mem.nongnamName}อ่านให้ฟังเอง`;
      addChat("assistant", reply);
      setScreen("books");
      speak(reply);
      return;
    }

    if (!mem.ownerMode && mem.gems <= 0) return notify("เพชรหมดแล้วค่ะ เติมเพชรก่อนคุยต่อนะ");
    addChat("user", msg);
    if (!mem.ownerMode) setMem(prev => ({ ...prev, gems: Math.max(0, prev.gems - 1) }));
    setStatus("thinking");
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          history: mem.chat.slice(-4),
          profile: {
            userNickname: mem.userNickname,
            nongnamName: mem.nongnamName,
            gender: mem.gender,
            relationshipMode: mem.relationshipMode,
            personalityStyle: mem.personalityStyle,
            sulkyLevel: mem.sulkyLevel,
            jealousLevel: mem.jealousLevel,
            affectionStyle: mem.affectionStyle,
            nongnamAge: mem.nongnamAge,
          },
        }),
      });
      const data = await r.json();
      if (!r.ok && !data?.reply) {
        setStatus("idle");
        return notify(data.error || "น้องน้ำตอบไม่ได้ค่ะ");
      }
      addChat("assistant", data.reply);
      speak(data.reply);
    } catch {
      setStatus("idle");
      notify("เชื่อมต่อ AI ไม่สำเร็จค่ะ");
    }
  }

  function sendText() {
    const text = input.trim();
    if (!text) return;
    setInput("");
    sendToAI(text);
  }

  /* ---------- voice (กดค้าง→ปล่อย) ---------- */
  function cleanupVoice() {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    stream.current?.getTracks().forEach(t => t.stop());
    stream.current = null;
    rec.current = null;
    chunks.current = [];
    setMs(0);
  }

  async function startRecording(e: any) {
    e.preventDefault(); e.stopPropagation();
    if (status === "recording") return;
    if (!navigator.mediaDevices?.getUserMedia) return notify("เครื่องนี้ใช้ไมค์ในเว็บไม่ได้ค่ะ");
    try {
      speechSynthesis?.cancel();
      chunks.current = [];
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = s;
      const mt = mimeType();
      const r = mt ? new MediaRecorder(s, { mimeType: mt }) : new MediaRecorder(s);
      rec.current = r;
      r.ondataavailable = ev => { if (ev.data?.size) chunks.current.push(ev.data); };
      r.onstop = async () => {
        const elapsed = Date.now() - startAt.current;
        const type = r.mimeType || "audio/webm";
        const blob = new Blob(chunks.current, { type });
        cleanupVoice();
        if (elapsed < 500 || blob.size < 1000) {
          setStatus("idle");
          return notify("เสียงสั้นเกินไปค่ะ ลองกดค้างนานขึ้นอีกนิด");
        }
        await transcribe(blob, type);
      };
      startAt.current = Date.now();
      r.start(250);
      setStatus("recording");
      timer.current = setInterval(() => setMs(Date.now() - startAt.current), 100);
    } catch {
      cleanupVoice();
      setStatus("idle");
      notify("เปิดไมค์ไม่ได้ กรุณาอนุญาตไมค์ก่อนนะ");
    }
  }

  function stopRecording(e: any) {
    e.preventDefault(); e.stopPropagation();
    if (rec.current && rec.current.state !== "inactive") {
      setStatus("transcribing");
      rec.current.stop();
    }
  }

  async function transcribe(blob: Blob, type: string) {
    setStatus("transcribing");
    try {
      const ext = type.includes("mp4") ? "m4a" : type.includes("mpeg") ? "mp3" : "webm";
      const form = new FormData();
      form.append("audio", new File([blob], `speech.${ext}`, { type }));
      const r = await fetch("/api/transcribe", { method: "POST", body: form });
      const data = await r.json();
      if (!r.ok) {
        setStatus("idle");
        return notify(data?.error === "OPENAI_API_KEY missing"
          ? "ยังไม่ได้ตั้ง OPENAI_API_KEY — พิมพ์คุยได้ก่อนนะคะ"
          : "ถอดเสียงไม่สำเร็จค่ะ");
      }
      const text = String(data.text || "").trim();
      if (!text) { setStatus("idle"); return notify("น้ำยังฟังไม่ชัดเลย ลองใหม่อีกทีนะ"); }
      setMem(prev => ({ ...prev, gems: Math.max(0, prev.gems - 2) }));
      sendToAI(text);
    } catch {
      setStatus("idle");
      notify("ระบบถอดเสียงไม่สำเร็จค่ะ");
    }
  }

  /* ---------- reader (ใช้ TTS เท่านั้น ไม่เรียก AI) ---------- */
  function openBook(b: Book) {
    if (!mem.purchasedBookIds.includes(b.id)) {
      if (mem.gems < b.price) return notify("เพชรไม่พอสำหรับปลดล็อกหนังสือ");
      if (!confirm(`ใช้ ${b.price} เพชรปลดล็อก "${b.title}" ใช่ไหม?`)) return;
      updateMem({
        gems: mem.gems - b.price,
        purchasedBookIds: [...mem.purchasedBookIds, b.id],
      });
    }
    setActiveBook(b);
    setScreen("reader");
  }

  function readAloud() {
    if (!activeBook) return;
    speak(activeBook.text);
  }

  function stopReading() {
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    setStatus("idle");
  }

  /* ---------- pinch-zoom + double-tap reset ---------- */
  function onAvatarPointerDown(e: React.PointerEvent) {
    pinch.current.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch.current.pointers.size === 2) {
      const [a, b] = Array.from(pinch.current.pointers.values());
      pinch.current.startDist = Math.hypot(a.x - b.x, a.y - b.y);
      pinch.current.startScale = zoom.scale;
      pinch.current.active = true;
    } else if (pinch.current.pointers.size === 1) {
      // double tap detection
      const now = Date.now();
      if (now - pinch.current.lastTap < 350) {
        setZoom({ scale: 1, x: 0, y: 0 });
        pinch.current.lastTap = 0;
      } else {
        pinch.current.lastTap = now;
      }
      // start drag if zoomed
      if (zoom.scale > 1.05) {
        pinch.current.dragging = true;
        pinch.current.dragStart = { x: e.clientX, y: e.clientY };
        pinch.current.zoomStart = { x: zoom.x, y: zoom.y };
      }
    }
    (e.target as Element).setPointerCapture?.(e.pointerId);
  }

  function onAvatarPointerMove(e: React.PointerEvent) {
    if (!pinch.current.pointers.has(e.pointerId)) return;
    pinch.current.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pinch.current.active && pinch.current.pointers.size === 2) {
      const [a, b] = Array.from(pinch.current.pointers.values());
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const newScale = Math.max(1, Math.min(3, pinch.current.startScale * (dist / pinch.current.startDist)));
      setZoom(prev => ({ ...prev, scale: newScale }));
    } else if (pinch.current.dragging && pinch.current.pointers.size === 1) {
      const dx = e.clientX - pinch.current.dragStart.x;
      const dy = e.clientY - pinch.current.dragStart.y;
      setZoom(prev => ({
        ...prev,
        x: pinch.current.zoomStart.x + dx,
        y: pinch.current.zoomStart.y + dy,
      }));
    }
  }

  function onAvatarPointerUp(e: React.PointerEvent) {
    pinch.current.pointers.delete(e.pointerId);
    if (pinch.current.pointers.size < 2) pinch.current.active = false;
    if (pinch.current.pointers.size === 0) {
      pinch.current.dragging = false;
      // snap back if scale ~1
      if (zoom.scale <= 1.05) setZoom({ scale: 1, x: 0, y: 0 });
    }
  }

  function onAvatarDoubleClick() {
    setZoom({ scale: 1, x: 0, y: 0 });
  }

  /* ---------- studio entry — tap version 5 ครั้งใน settings ---------- */
  function tapVersion() {
    const next = versionTaps + 1;
    setVersionTaps(next);
    if (next >= 5) {
      const nextOwner = !mem.ownerMode;
      updateMem({ ownerMode: nextOwner });
      if (typeof window !== "undefined") localStorage.setItem(OWNER_KEY, nextOwner ? "true" : "false");
      notify(nextOwner ? "เปิดโหมดเจ้าของแล้ว: เพชรไม่จำกัด / ปลดล็อกทุกชุด" : "ปิดโหมดเจ้าของแล้ว");
      setVersionTaps(0);
    }
  } else {
      setVersionTaps(next);
      if (next >= 3) notify(`อีก ${5 - next} ครั้งเข้าจัดการไฟล์`);
    }
  }

  const statusText =
    status === "recording" ? `กำลังฟัง ${(ms / 1000).toFixed(1)} วิ... ปล่อยเพื่อส่ง` :
    status === "transcribing" ? "กำลังถอดเสียง..." :
    status === "thinking" ? `${mem.nongnamName}กำลังคิด...` :
    status === "speaking" ? `${mem.nongnamName}กำลังพูด...` :
    "พร้อมคุยกับพี่แล้ว";

  if (!ready) return null;

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <main className="app">

      {/* ============= WELCOME ============= */}
      {screen === "welcome" && (
        <section className="screen hero-screen">
          <div className="badge">🌸 Nong Nam Companion</div>
          <h1>ยินดีต้อนรับ<br /><em>น้องน้ำ</em>รออยู่นะ</h1>
          <p>เพื่อนคุย เลขาส่วนตัว หรือคนที่อยากเล่าเรื่องวันนี้ให้ฟัง — น้องน้ำพร้อมอยู่ข้าง ๆ พี่เสมอ</p>

          <div className="welcome-cards">
            <button className="welcome-card female" onClick={() => pickGender("female")}>
              <div className="welcome-card-img">
                <img src="/assets/ui/female-card.jpg" alt="น้องน้ำผู้หญิง"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/assets/outfits/female/f_001.jpg"; }} />
              </div>
              <div className="welcome-card-meta">
                <b>น้องน้ำ ♀</b><span>อบอุ่น อ่อนโยน</span>
              </div>
            </button>
            <button className="welcome-card male" onClick={() => pickGender("male")}>
              <div className="welcome-card-img">
                <img src="/assets/ui/male-card.jpg" alt="น้องน้ำผู้ชาย"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/assets/outfits/male/m_001.jpg"; }} />
              </div>
              <div className="welcome-card-meta">
                <b>น้องน้ำ ♂</b><span>สุภาพ พึ่งพาได้</span>
              </div>
            </button>
          </div>

          {mem.setupDone && (
            <button className="secondary" onClick={() => setScreen("chat")}>กลับเข้าแชต →</button>
          )}
        </section>
      )}

      {/* ============= SETUP ============= */}
      {screen === "setup" && (
        <section className="screen">
          <div className="top">
            <button className="icon" onClick={() => setScreen("welcome")}>←</button>
            <div className="brand"><h2>ตั้งค่าน้องน้ำ</h2><p>ทำครั้งแรกครั้งเดียว</p></div>
            <div style={{ width: 48 }} />
          </div>
          <div className="setup-card">
            <label>เลือกเพศน้องน้ำ</label>
            <div className="choice-row">
              <button className={mem.gender === "female" ? "active" : ""}
                onClick={() => updateMem({ gender: "female", selectedOutfitId: "f_001" })}>ผู้หญิง</button>
              <button className={mem.gender === "male" ? "active" : ""}
                onClick={() => updateMem({ gender: "male", selectedOutfitId: "m_001" })}>ผู้ชาย</button>
            </div>
            <label>ให้น้องน้ำเรียกคุณว่า</label>
            <input value={mem.userNickname} onChange={e => updateMem({ userNickname: e.target.value })} />
            <label>ชื่อน้องน้ำ</label>
            <input value={mem.nongnamName} onChange={e => updateMem({ nongnamName: e.target.value })} />
            <label>อายุน้องน้ำ</label>
            <input type="number" min={18} max={60} value={mem.nongnamAge || 25} onChange={e => updateMem({ nongnamAge: Number(e.target.value || 25) })} />
            <label>บุคลิกหลัก</label>
            <select value={mem.personalityStyle || "sweet"} onChange={e => updateMem({ personalityStyle: e.target.value as any })}>
              <option value="sweet">หวาน ออดอ้อน น่ารัก</option>
              <option value="shy">ขี้อาย ใส ๆ พูดนุ่ม</option>
              <option value="playful">ขี้เล่น หยอดเก่ง</option>
              <option value="jealous">ขี้หึง ขี้งอน แต่ง้อก็หาย</option>
              <option value="strict">สายดุ บ่นเก่ง เหมือนเมียจริง</option>
              <option value="bold">พูดตรง แซ่บ แต่ไม่หยาบเกิน</option>
              <option value="comfort">สายปลอบใจ รับฟังเก่ง</option>
            </select>
            <label>โหมดความสัมพันธ์</label>
            <select value={mem.relationshipMode} onChange={e => updateMem({ relationshipMode: e.target.value as any })}>
              <option value="friend">เพื่อนคุย</option>
              <option value="lover">แฟน/คนรัก</option>
              <option value="wife">ที่พึ่งทางใจ</option>
              <option value="assistant">เลขาส่วนตัว</option>
            </select>
            <label>ระดับความงอนน่ารัก</label>
            <select value={mem.sulkyLevel} onChange={e => updateMem({ sulkyLevel: e.target.value as any })}>
              <option value="low">น้อย</option>
              <option value="medium">กลาง</option>
              <option value="high">เยอะหน่อย</option>
            </select>
            <label>ระดับความหึงหวง</label>
            <select value={mem.jealousLevel || "medium"} onChange={e => updateMem({ jealousLevel: e.target.value as any })}>
              <option value="low">นิดหน่อย</option>
              <option value="medium">พอดีน่ารัก</option>
              <option value="high">หึงง่าย ง้อได้</option>
            </select>
            <label>โทนความใกล้ชิด</label>
            <select value={mem.affectionStyle || "normal"} onChange={e => updateMem({ affectionStyle: e.target.value as any })}>
              <option value="soft">ใส ๆ อ่อนโยน</option>
              <option value="normal">แฟนสาวอบอุ่น</option>
              <option value="spicy_safe">ผู้ใหญ่ขึ้น ยั่วนิด ๆ แบบสุภาพ</option>
            </select>
          </div>
          <button className="primary bottom-action" onClick={finishSetup}>บันทึกและเริ่มคุย</button>
        </section>
      )}

      {/* ============= CHAT (avatar-centered) ============= */}
      {screen === "chat" && (
        <section className="screen chat-screen">
          {/* avatar layer with pinch-zoom */}
          <div className="avatar-layer"
            ref={stageRef}
            onPointerDown={onAvatarPointerDown}
            onPointerMove={onAvatarPointerMove}
            onPointerUp={onAvatarPointerUp}
            onPointerCancel={onAvatarPointerUp}
            onDoubleClick={onAvatarDoubleClick}
            style={{ touchAction: "none" }}
          >
            <img
              src={currentChatImage}
              alt={mem.nongnamName}
              draggable={false}
              style={{
                transform: `translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.scale})`,
                transformOrigin: "center center",
                transition: pinch.current.active || pinch.current.dragging ? "none" : "transform .25s ease",
              }}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = `/assets/avatars/${mem.gender}/default.jpg`;
              }}
            />
          </div>

          {/* top floating row: bookshelf-left, name+gems-right */}
          <div className="chat-top-left">
            <button className="icon" onClick={() => setScreen("books")} title="ชั้นหนังสือ">📚</button>
            <button className="icon" onClick={enableVoice} title="เปิดเสียง">🔊</button>
          </div>
          <div className="chat-top-right">
            <div className="pill">{mem.nongnamName}</div>
            <div className="pill gems">{mem.ownerMode ? "💎 ∞ OWNER" : `💎 ${mem.gems}`}</div>
          </div>

          {/* outfit button - right side mid */}
          <button className="floating-outfit" onClick={() => setScreen("outfits")} title="เปลี่ยนชุด">👗</button>

          <div className={`status ${status}`}>{statusText}</div>
          {mem.ownerMode && <div className="owner-ribbon">OWNER TEST MODE</div>}

          {/* bubbles — only last 3, fade upward */}
          <div className="bubble-stack">
            {mem.chat.slice(-3).map((m, i, arr) => (
              <div
                key={`${arr.length - 1 - i}-${i}`}
                className={`bubble-line ${m.role} idx-${arr.length - 1 - i}`}
              >
                <span>{m.content}</span>
              </div>
            ))}
          </div>

          <div className="quick-bar">
            <button onClick={() => sendToAI("วันนี้เหนื่อยมากเลย")}>เหนื่อย</button>
            <button onClick={() => sendToAI("โดนหัวหน้าดุ")}>โดนดุ</button>
            <button onClick={() => sendToAI("คิดถึง")}>คิดถึง</button>
            <button onClick={() => sendToAI("กินข้าวหรือยัง")}>ทักเรื่องข้าว</button>
            <button onClick={() => sendToAI("อ่านหนังสือให้ฟังหน่อย")}>อ่านหนังสือ</button>
          </div>

          <div className="bottom-control">
            <button
              className={`mic ${status === "recording" ? "active" : ""}`}
              onPointerDown={startRecording}
              onPointerUp={stopRecording}
              onPointerCancel={stopRecording}
            >{status === "recording" ? "🔴" : "🎙"}</button>
            <div className="hint">กดค้างไว้แล้วพูด • ปล่อยเพื่อส่ง</div>
            <div className="input-row">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") sendText(); }}
                placeholder="พิมพ์คุยกับน้องน้ำ..."
              />
              <button onClick={sendText}>➤</button>
            </div>
            <div className="mini-nav">
              <button onClick={() => setScreen("outfits")}>ชุด</button>
              <button onClick={() => setScreen("books")}>ชั้นหนังสือ</button>
              <button onClick={() => setScreen("settings")}>ตั้งค่า</button>
            </div>
          </div>
        </section>
      )}

      {/* ============= OUTFITS ============= */}
      {screen === "outfits" && (
        <section className="screen">
          <div className="top">
            <button className="icon" onClick={() => setScreen("chat")}>←</button>
            <div className="brand"><h2>ชุดน้องน้ำ</h2><p>เลือก/ซื้อ/ทดสอบชุด</p></div>
            <div style={{ width: 48 }} />
          </div>
          <div className="tabs">
            <button className={category === "regular" ? "active" : ""} onClick={() => setCategory("regular")}>ทั่วไป</button>
            {mem.gender === "female" && (
              <button className={category === "special20" ? "active adult" : ""} onClick={() => setCategory("special20")}>20+</button>
            )}
          </div>
          <div className="outfit-grid">
            {visibleOutfits.map(o => (
              <div className="outfit-card" key={o.id}>
                <div className={`outfit-img-wrap ${(!isUnlocked(o.id) || o.ageRestricted || o.lockedPreview) ? "locked-blur" : ""}`}>
                  <img
                    src={assets[`${o.id}_chat`] || o.chatImage}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = `/assets/avatars/${o.gender}/default.jpg`;
                    }}
                  />
                  {(!isUnlocked(o.id) || o.ageRestricted || o.lockedPreview) && <div className="locked-overlay">🔒<br/>ปลดล็อกเพื่อดูชัด</div>}
                </div>
                {o.ageRestricted && <div className="adult-badge">20+</div>}
                <b>{o.title}</b>
                <p>{o.desc}</p>
                <span>{o.price === 0 ? "ฟรี" : `💎 ${o.price}`}</span>
                <div className="outfit-status">
                  {isUnlocked(o.id) ? "✓ ปลดล็อกแล้ว" : "🔒 ต้องใช้เพชร"}
                </div>
                {isUnlocked(o.id) ? (
                  <button onClick={() => selectOutfit(o.id)}>
                    {mem.selectedOutfitId === o.id ? "ใช้อยู่" : "ใช้ชุดนี้"}
                  </button>
                ) : (
                  <button onClick={() => buyOutfit(o.id)}>ปลดล็อก</button>
                )}
              </div>
            ))}
            {visibleOutfits.length === 0 && (
              <div style={{ gridColumn: "1 / -1", textAlign: "center", color: "var(--muted)", padding: 24 }}>
                ยังไม่มีชุดในหมวดนี้
              </div>
            )}
          </div>
        </section>
      )}

      {/* ============= BOOKSHELF ============= */}
      {screen === "books" && (
        <section className="screen">
          <div className="top">
            <button className="icon" onClick={() => setScreen("chat")}>←</button>
            <div className="brand"><h2>ชั้นหนังสือ</h2><p>อ่านให้ฟัง ไม่ใช้โทเค็น AI</p></div>
            <div style={{ width: 48 }} />
          </div>
          <div className="book-cats">
            <button className={bookCat === "all" ? "active" : ""} onClick={() => setBookCat("all")}>ทั้งหมด</button>
            {BOOK_CATEGORIES.map(c => (
              <button key={c.key} className={bookCat === c.key ? "active" : ""} onClick={() => setBookCat(c.key)}>
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
          <div className="book-list">
            {visibleBooks.map(b => (
              <div className="book-card" key={b.id}>
                <img src={b.cover} onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/assets/books/default_cover.jpg"; }} />
                <div className="book-card-meta">
                  <b>{b.title}</b>
                  <p>{b.desc}</p>
                  <span>
                    {mem.purchasedBookIds.includes(b.id) ? "✓ ปลดล็อกแล้ว" : `💎 ${b.price}`}
                  </span>
                </div>
                <button onClick={() => openBook(b)}>เลือกเล่มนี้</button>
              </div>
            ))}
            {visibleBooks.length === 0 && (
              <div style={{ textAlign: "center", color: "var(--muted)", padding: 24 }}>
                ยังไม่มีหนังสือในหมวดนี้
              </div>
            )}
          </div>
        </section>
      )}

      {/* ============= READER ============= */}
      {screen === "reader" && activeBook && (
        <section className="screen reader-screen">
          <div className="reader-bg">
            <img src={currentBookImage} alt="" onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = `/assets/avatars/${mem.gender}/default.jpg`;
            }} />
          </div>
          <div className="top floating">
            <button className="icon" onClick={() => { stopReading(); setScreen("books"); }}>←</button>
            <div className="brand"><h2>{activeBook.title}</h2><p>{mem.nongnamName}กำลังอ่านให้ฟัง</p></div>
            <div style={{ width: 48 }} />
          </div>
          <div className="reader-content">
            <div className="reader-text">{activeBook.text}</div>
            <div className="reader-actions">
              <button className="primary" onClick={readAloud}>🔊 อ่านให้ฟัง</button>
              <button className="secondary" onClick={stopReading}>⏸ หยุด</button>
            </div>
          </div>
        </section>
      )}

      {/* ============= SETTINGS ============= */}
      {screen === "settings" && (
        <section className="screen">
          <div className="top">
            <button className="icon" onClick={() => setScreen("chat")}>←</button>
            <div className="brand"><h2>ตั้งค่า</h2><p>แก้ข้อมูลโดยไม่คืนเครดิต</p></div>
            <div style={{ width: 48 }} />
          </div>
          <button className="secondary full" onClick={() => setScreen("setup")}>แก้โปรไฟล์น้องน้ำ</button>
          <button className="secondary full" onClick={doResetCharacter}>รีเซ็ตความจำ/ตั้งค่าใหม่</button>
          <div style={{ marginTop: "auto", padding: 20, textAlign: "center" }}>
            <button
              onClick={tapVersion}
              style={{ background: "transparent", color: "var(--muted)", fontSize: 12 }}
            >
              {APP_VERSION}
            </button>
          </div>
        </section>
      )}

      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}
