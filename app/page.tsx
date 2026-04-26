"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ADMIN_PIN, Book, defaultBooks, Gender, OutfitCategory, outfits, STARTING_GEMS } from "../lib/appData";
import { BUCKET, getSupabaseBrowserClient, hasSupabaseConfig } from "../lib/supabaseClient";

type Screen = "welcome" | "setup" | "chat" | "outfits" | "books" | "admin" | "settings";
type Status = "idle" | "recording" | "transcribing" | "thinking" | "speaking";
type Chat = { role:"user"|"assistant"; content:string };

const MEMORY_KEY = "nongnam_clean_memory_v1";
const LOCAL_ASSETS = "nongnam_clean_local_assets_v1";
const LOCAL_BOOKS = "nongnam_clean_books_v1";

const defaultMemory = {
  setupDone: false,
  gender: "female" as Gender,
  userNickname: "พี่",
  nongnamName: "น้องน้ำ",
  relationshipMode: "lover",
  sulkyLevel: "medium",
  selectedOutfitId: "f_001",
  age20Confirmed: false,
  gems: STARTING_GEMS,
  purchasedOutfitIds: ["f_001", "m_001"] as string[],
  purchasedBookIds: ["book_001"] as string[],
  chat: [] as Chat[]
};

function getDefaultOutfitId(gender:Gender) {
  return gender === "male" ? "m_001" : "f_001";
}

function mimeType() {
  const list = ["audio/webm;codecs=opus","audio/webm","audio/mp4","audio/mpeg"];
  return list.find(t => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) || "";
}

export default function Page() {
  const [screen,setScreen] = useState<Screen>("welcome");
  const [ready,setReady] = useState(false);
  const [mem,setMem] = useState(defaultMemory);
  const [assets,setAssets] = useState<Record<string,string>>({});
  const [books,setBooks] = useState<Book[]>(defaultBooks);
  const [input,setInput] = useState("");
  const [status,setStatus] = useState<Status>("idle");
  const [toast,setToast] = useState("");
  const [adminPin,setAdminPin] = useState("");
  const [adminOk,setAdminOk] = useState(false);
  const [category,setCategory] = useState<OutfitCategory>("regular");
  const [ms,setMs] = useState(0);

  const rec = useRef<MediaRecorder|null>(null);
  const stream = useRef<MediaStream|null>(null);
  const chunks = useRef<BlobPart[]>([]);
  const startAt = useRef(0);
  const timer = useRef<any>(null);

  const supabaseReady = hasSupabaseConfig();
  const supabase = getSupabaseBrowserClient();

  const currentOutfit = outfits.find(o=>o.id===mem.selectedOutfitId) || outfits.find(o=>o.id===getDefaultOutfitId(mem.gender)) || outfits[0];
  const currentImage = assets[currentOutfit.id] || currentOutfit.defaultImage;

  const visibleOutfits = useMemo(()=> {
    return outfits.filter(o => o.gender === mem.gender && o.category === category);
  }, [mem.gender, category]);

  useEffect(()=> {
    try {
      const saved = localStorage.getItem(MEMORY_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setMem({...defaultMemory, ...parsed});
        setScreen(parsed.setupDone ? "chat" : "welcome");
      }
      const savedAssets = localStorage.getItem(LOCAL_ASSETS);
      if (savedAssets) setAssets(JSON.parse(savedAssets));
      const savedBooks = localStorage.getItem(LOCAL_BOOKS);
      if (savedBooks) setBooks(JSON.parse(savedBooks));
    } catch {}
    setReady(true);
  }, []);

  useEffect(()=> {
    if (!ready) return;
    localStorage.setItem(MEMORY_KEY, JSON.stringify(mem));
  }, [mem, ready]);

  useEffect(()=> {
    if (!ready) return;
    localStorage.setItem(LOCAL_ASSETS, JSON.stringify(assets));
  }, [assets, ready]);

  useEffect(()=> {
    if (!ready) return;
    localStorage.setItem(LOCAL_BOOKS, JSON.stringify(books));
  }, [books, ready]);

  useEffect(()=> {
    if (!supabaseReady || !supabase) return;
    loadRemoteAssets();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabaseReady]);

  async function loadRemoteAssets() {
    if (!supabase) return;
    const next: Record<string,string> = {};
    for (const o of outfits) {
      const path = `outfits/${o.id}.jpg`;
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      if (data?.publicUrl) next[o.id] = `${data.publicUrl}?v=${Date.now()}`;
    }
    if (Object.keys(next).length) setAssets(prev=>({...prev, ...next}));
  }

  function notify(text:string) {
    setToast(text);
    setTimeout(()=>setToast(""),2600);
  }

  function updateMem(patch:any) {
    setMem(prev=>({...prev, ...patch}));
  }

  function hardResetCharacterOnly() {
    if (!confirm("คุณต้องการรีเซ็ตความจำ/คาแรกเตอร์ของน้องน้ำใช่ไหม\nเครดิต ชุดที่ซื้อ และหนังสือที่ซื้อจะไม่ถูกลบ")) return;
    setMem(prev=>({
      ...defaultMemory,
      gems: prev.gems,
      purchasedOutfitIds: prev.purchasedOutfitIds,
      purchasedBookIds: prev.purchasedBookIds
    }));
    setScreen("setup");
    notify("รีเซ็ตเฉพาะความจำแล้วค่ะ");
  }

  function finishSetup() {
    setMem(prev=>({
      ...prev,
      setupDone: true,
      selectedOutfitId: prev.selectedOutfitId || getDefaultOutfitId(prev.gender),
      chat: prev.chat.length ? prev.chat : [{role:"assistant", content:`${prev.userNickname} มาแล้วเหรอคะ วันนี้เหนื่อยไหม น้องน้ำอยู่ตรงนี้นะ`}]
    }));
    setScreen("chat");
  }

  function isUnlocked(id:string) {
    return mem.purchasedOutfitIds.includes(id) || adminOk;
  }

  function selectOutfit(id:string) {
    const o = outfits.find(x=>x.id===id);
    if (!o) return;
    if (o.ageRestricted && !mem.age20Confirmed) {
      const ok = confirm("หมวดนี้สำหรับผู้ใช้ที่มีอายุ 20 ปีขึ้นไป\nคุณยืนยันหรือไม่ว่าคุณมีอายุ 20 ปีขึ้นไป");
      if (!ok) return;
      updateMem({age20Confirmed:true});
    }
    if (!isUnlocked(id)) return notify(`ชุดนี้ยังล็อกอยู่ ต้องใช้ ${o.price} เพชร`);
    updateMem({selectedOutfitId:id});
    notify(`เปลี่ยนเป็น ${o.title} แล้ว`);
  }

  function buyOutfit(id:string) {
    const o = outfits.find(x=>x.id===id);
    if (!o) return;
    if (mem.purchasedOutfitIds.includes(id)) return selectOutfit(id);
    if (mem.gems < o.price) return notify("เพชรไม่พอค่ะ");
    updateMem({
      gems: mem.gems - o.price,
      purchasedOutfitIds: [...mem.purchasedOutfitIds, id],
      selectedOutfitId: id
    });
    notify("ซื้อชุดแล้วค่ะ");
  }

  function addChat(role:"user"|"assistant", content:string) {
    setMem(prev=>({...prev, chat:[...prev.chat, {role,content}].slice(-30)}));
  }

  function speak(text:string) {
    if (!("speechSynthesis" in window)) return setStatus("idle");
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/[💗💕✨🥺🤗😊🥰📋🍚🌸😮‍💨]/g,""));
    u.lang = "th-TH";
    u.pitch = mem.gender === "female" ? 1.12 : 0.88;
    u.rate = 1.03;
    u.onstart = () => setStatus("speaking");
    u.onend = () => setStatus("idle");
    u.onerror = () => setStatus("idle");
    speechSynthesis.speak(u);
  }

  async function sendToAI(text:string) {
    const msg = text.trim();
    if (!msg) return;
    if (mem.gems <= 0) return notify("เพชรหมดแล้วค่ะ เติมเพชรก่อนคุยต่อนะ");
    addChat("user", msg);
    setMem(prev=>({...prev, gems: Math.max(0, prev.gems - 1)}));
    setStatus("thinking");
    try {
      const r = await fetch("/api/chat", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          message: msg,
          history: mem.chat.slice(-5),
          profile: {
            userNickname: mem.userNickname,
            nongnamName: mem.nongnamName,
            gender: mem.gender,
            relationshipMode: mem.relationshipMode,
            sulkyLevel: mem.sulkyLevel
          }
        })
      });
      const data = await r.json();
      if (!r.ok) {
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

  function cleanup() {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    stream.current?.getTracks().forEach(t=>t.stop());
    stream.current = null;
    rec.current = null;
    chunks.current = [];
    setMs(0);
  }

  async function startRecording(e:any) {
    e.preventDefault(); e.stopPropagation();
    if (status === "recording") return;
    if (!navigator.mediaDevices?.getUserMedia) return notify("เครื่องนี้ยังใช้ไมค์ในเว็บไม่ได้ค่ะ");
    try {
      speechSynthesis?.cancel();
      chunks.current = [];
      const s = await navigator.mediaDevices.getUserMedia({audio:true});
      stream.current = s;
      const mt = mimeType();
      const r = mt ? new MediaRecorder(s,{mimeType:mt}) : new MediaRecorder(s);
      rec.current = r;
      r.ondataavailable = ev => { if (ev.data?.size) chunks.current.push(ev.data); };
      r.onstop = async () => {
        const elapsed = Date.now() - startAt.current;
        const type = r.mimeType || "audio/webm";
        const blob = new Blob(chunks.current,{type});
        cleanup();
        if (elapsed < 500 || blob.size < 1000) { setStatus("idle"); return notify("เสียงสั้นเกินไป กดค้างแล้วพูดนานขึ้นนิดนึงนะ"); }
        await transcribe(blob, type);
      };
      startAt.current = Date.now();
      r.start(250);
      setStatus("recording");
      timer.current = setInterval(()=>setMs(Date.now()-startAt.current),100);
    } catch {
      cleanup();
      setStatus("idle");
      notify("ยังเปิดไมค์ไม่ได้ กรุณาอนุญาตไมค์ก่อนนะ");
    }
  }

  function stopRecording(e:any) {
    e.preventDefault(); e.stopPropagation();
    if (rec.current && rec.current.state !== "inactive") {
      setStatus("transcribing");
      rec.current.stop();
    }
  }

  async function transcribe(blob:Blob, type:string) {
    setStatus("transcribing");
    try {
      const ext = type.includes("mp4") ? "m4a" : type.includes("mpeg") ? "mp3" : "webm";
      const form = new FormData();
      form.append("audio", new File([blob], `speech.${ext}`, {type}));
      const r = await fetch("/api/transcribe", {method:"POST", body:form});
      const data = await r.json();
      if (!r.ok) { setStatus("idle"); return notify("ถอดเสียงไม่สำเร็จค่ะ"); }
      const text = String(data.text || "").trim();
      if (!text) { setStatus("idle"); return notify("น้ำยังฟังไม่ชัดเลย ลองใหม่อีกทีนะ"); }
      setMem(prev=>({...prev, gems: Math.max(0, prev.gems - 2)}));
      sendToAI(text);
    } catch {
      setStatus("idle");
      notify("ระบบถอดเสียงไม่สำเร็จค่ะ");
    }
  }

  function fileToDataUrl(file:File) {
    return new Promise<string>((resolve,reject)=>{
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function uploadOutfitImage(id:string, file?:File) {
    if (!file) return;
    if (supabaseReady && supabase) {
      const path = `outfits/${id}.jpg`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert:true, contentType:file.type || "image/jpeg" });
      if (!error) {
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
        setAssets(prev=>({...prev, [id]: `${data.publicUrl}?v=${Date.now()}`}));
        notify("อัปโหลดขึ้น Supabase แล้ว ทุกคนจะเห็นรูปนี้");
        return;
      }
      notify("อัปโหลด Supabase ไม่สำเร็จ ใช้ local แทน");
    }
    const data = await fileToDataUrl(file);
    setAssets(prev=>({...prev, [id]: data}));
    notify("อัปโหลดในเครื่องนี้แล้ว");
  }

  async function addBookFile(file?:File) {
    if (!file) return;
    const text = await file.text().catch(()=> "");
    const b:Book = {
      id:`book_${Date.now()}`,
      title:file.name.replace(/\.[^.]+$/,""),
      desc:"หนังสือที่พี่อัปโหลดเอง",
      price:1,
      cover:"/assets/books/default_cover.jpg",
      text:text || "ไฟล์นี้อ่านเป็นข้อความไม่ได้ แนะนำให้อัปโหลด .txt ก่อน"
    };
    setBooks(prev=>[b,...prev]);
    notify("เพิ่มหนังสือแล้ว");
  }

  function readBook(book:Book) {
    if (!mem.purchasedBookIds.includes(book.id)) {
      if (mem.gems < book.price) return notify("เพชรไม่พอสำหรับปลดล็อกหนังสือ");
      updateMem({gems: mem.gems - book.price, purchasedBookIds:[...mem.purchasedBookIds, book.id]});
    }
    setScreen("chat");
    addChat("assistant", `${mem.nongnamName} จะอ่านเรื่อง “${book.title}” ให้ฟังนะ`);
    speak(book.text);
  }

  const statusText = status==="recording" ? `กำลังฟัง ${(ms/1000).toFixed(1)} วิ... ปล่อยเพื่อส่ง`
    : status==="transcribing" ? "กำลังถอดเสียง..."
    : status==="thinking" ? "น้องน้ำกำลังคิด..."
    : status==="speaking" ? "น้องน้ำกำลังพูด..."
    : "พร้อมคุยกับพี่แล้ว";

  if (!ready) return null;

  return <main className="app">
    {screen==="welcome" && <section className="screen hero-screen">
      <div className="badge">Nong Nam Clean Rebuild v1</div>
      <h1>น้องน้ำ<br/><em>เริ่มใหม่</em></h1>
      <p>เวอร์ชันสะอาด: ตั้งค่าครั้งเดียว มีหลังบ้าน มีชั้นหนังสือ และรองรับ Supabase Storage</p>
      <button className="primary" onClick={()=>setScreen(mem.setupDone ? "chat" : "setup")}>เริ่มใช้งาน</button>
      <button className="secondary" onClick={()=>setScreen("admin")}>🔐 หลังบ้านพี่แมน</button>
      <button className="secondary" onClick={hardResetCharacterOnly}>รีเซ็ตความจำ/ตั้งค่าใหม่</button>
    </section>}

    {screen==="setup" && <section className="screen">
      <div className="top"><button className="icon" onClick={()=>setScreen("welcome")}>←</button><div className="brand"><h2>ตั้งค่าน้องน้ำ</h2><p>ทำครั้งแรกครั้งเดียว</p></div><div style={{width:48}}/></div>
      <div className="setup-card">
        <label>เลือกเพศน้องน้ำ</label>
        <div className="choice-row">
          <button className={mem.gender==="female"?"active":""} onClick={()=>updateMem({gender:"female", selectedOutfitId:"f_001"})}>ผู้หญิง</button>
          <button className={mem.gender==="male"?"active":""} onClick={()=>updateMem({gender:"male", selectedOutfitId:"m_001"})}>ผู้ชาย</button>
        </div>
        <label>ให้น้องน้ำเรียกคุณว่า</label>
        <input value={mem.userNickname} onChange={e=>updateMem({userNickname:e.target.value})}/>
        <label>ชื่อน้องน้ำ</label>
        <input value={mem.nongnamName} onChange={e=>updateMem({nongnamName:e.target.value})}/>
        <label>โหมดความสัมพันธ์</label>
        <select value={mem.relationshipMode} onChange={e=>updateMem({relationshipMode:e.target.value})}>
          <option value="friend">เพื่อนคุย</option>
          <option value="lover">แฟน</option>
          <option value="wife">เมีย/คนรักใกล้ชิด</option>
          <option value="assistant">เลขาส่วนตัว</option>
        </select>
        <label>ระดับความงอนน่ารัก</label>
        <select value={mem.sulkyLevel} onChange={e=>updateMem({sulkyLevel:e.target.value})}>
          <option value="low">น้อย</option>
          <option value="medium">กลาง</option>
          <option value="high">เยอะหน่อย</option>
        </select>
      </div>
      <button className="primary bottom-action" onClick={finishSetup}>บันทึกและเริ่มคุย</button>
    </section>}

    {screen==="chat" && <section className="screen chat-screen">
      <div className="avatar-layer"><img src={currentImage} alt="Nong Nam"/></div>
      <div className="top floating"><button className="icon" onClick={()=>setScreen("outfits")}>👗</button><div className="pill">{mem.nongnamName}</div><div className="pill">💎 {mem.gems}</div></div>
      <div className={`status ${status}`}>{statusText}</div>
      <div className="latest-line">{mem.chat.slice(-1).map((m,i)=><span key={i} className={m.role==="user"?"latest-user":"latest-ai"}>{m.content}</span>)}</div>
      <div className="chat-history">
        {mem.chat.slice(-12).map((m,i)=><div key={i} className={`bubble ${m.role}`}>
          <b>{m.role==="user"?mem.userNickname:mem.nongnamName}</b>
          <span>{m.content}</span>
        </div>)}
      </div>
      <div className="quick-bar">
        <button onClick={()=>sendToAI("วันนี้เหนื่อยมากเลย")}>เหนื่อย</button>
        <button onClick={()=>sendToAI("โดนหัวหน้าดุ")}>โดนดุ</button>
        <button onClick={()=>sendToAI("คิดถึง")}>คิดถึง</button>
        <button onClick={()=>setScreen("books")}>📚 หนังสือ</button>
      </div>
      <div className="bottom-control">
        <button className={`mic ${status==="recording"?"active":""}`} onPointerDown={startRecording} onPointerUp={stopRecording} onPointerCancel={stopRecording}>{status==="recording"?"🔴":"🎙"}</button>
        <div className="hint">กดค้างไว้แล้วพูด • ปล่อยเพื่อส่ง</div>
        <div className="input-row"><input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")sendText()}} placeholder="พิมพ์คุยกับน้องน้ำ..."/><button onClick={sendText}>➤</button></div>
        <div className="mini-nav"><button onClick={()=>setScreen("outfits")}>ชุด</button><button onClick={()=>setScreen("books")}>ชั้นหนังสือ</button><button onClick={()=>setScreen("settings")}>ตั้งค่า</button></div>
      </div>
    </section>}

    {screen==="outfits" && <section className="screen">
      <div className="top"><button className="icon" onClick={()=>setScreen("chat")}>←</button><div className="brand"><h2>ชุดน้องน้ำ</h2><p>เลือก/ซื้อ/ทดสอบชุด</p></div><button className="icon" onClick={()=>setScreen("admin")}>🔐</button></div>
      <div className="tabs"><button className={category==="regular"?"active":""} onClick={()=>setCategory("regular")}>ทั่วไป</button>{mem.gender==="female" && <button className={category==="special20"?"active adult":""} onClick={()=>setCategory("special20")}>20+</button>}</div>
      <div className="outfit-grid">{visibleOutfits.map(o=><div className="outfit-card" key={o.id}>
        <img src={assets[o.id] || o.defaultImage}/>
        {o.ageRestricted && <div className="adult-badge">20+</div>}
        <b>{o.title}</b><p>{o.desc}</p><span>{o.price===0?"ฟรี":`💎 ${o.price}`}</span>
        {isUnlocked(o.id) ? <button onClick={()=>selectOutfit(o.id)}>ใช้ชุดนี้</button> : <button onClick={()=>buyOutfit(o.id)}>ซื้อ/ปลดล็อก</button>}
      </div>)}</div>
    </section>}

    {screen==="books" && <section className="screen">
      <div className="top"><button className="icon" onClick={()=>setScreen("chat")}>←</button><div className="brand"><h2>ชั้นหนังสือ</h2><p>อ่านให้ฟัง ไม่ใช้โทเค็น AI</p></div><button className="icon" onClick={()=>setScreen("admin")}>＋</button></div>
      <div className="book-list">{books.map(b=><div className="book-card" key={b.id}>
        <img src={b.cover}/>
        <div><b>{b.title}</b><p>{b.desc}</p><span>💎 {b.price}</span></div>
        <button onClick={()=>readBook(b)}>ให้อ่าน</button>
      </div>)}</div>
    </section>}

    {screen==="settings" && <section className="screen">
      <div className="top"><button className="icon" onClick={()=>setScreen("chat")}>←</button><div className="brand"><h2>ตั้งค่า</h2><p>แก้ข้อมูลโดยไม่คืนเครดิต</p></div><div style={{width:48}}/></div>
      <button className="secondary full" onClick={()=>setScreen("setup")}>แก้โปรไฟล์น้องน้ำ</button>
      <button className="secondary full" onClick={hardResetCharacterOnly}>รีเซ็ตความจำ/ตั้งค่าใหม่</button>
      <button className="secondary full" onClick={()=>setScreen("admin")}>หลังบ้านพี่แมน</button>
    </section>}

    {screen==="admin" && <section className="screen">
      <div className="top"><button className="icon" onClick={()=>setScreen(mem.setupDone?"chat":"welcome")}>←</button><div className="brand"><h2>หลังบ้านพี่แมน</h2><p>อัปโหลดรูป/หนังสือ</p></div><div style={{width:48}}/></div>
      {!adminOk ? <div className="setup-card"><label>รหัสหลังบ้าน</label><input value={adminPin} onChange={e=>setAdminPin(e.target.value)} placeholder="2468"/><button className="primary full" onClick={()=> adminPin===ADMIN_PIN ? setAdminOk(true) : notify("รหัสไม่ถูกค่ะ")}>เข้าสู่หลังบ้าน</button><p>ถ้าใส่ Supabase key แล้ว รูปจะอัปโหลดให้ทุกคนเห็นได้</p></div> : <div className="admin-panel">
        <div className="admin-note">{supabaseReady ? "Supabase พร้อมใช้งาน: อัปโหลดแล้วทุกคนจะเห็นรูปเดียวกัน" : "ยังไม่ได้ตั้งค่า Supabase: รูปที่อัปโหลดจะเห็นเฉพาะเครื่องนี้ก่อน"}</div>
        <h3>จัดการรูปชุด</h3>
        <div className="admin-grid">{outfits.map(o=><div className="admin-item" key={o.id}><img src={assets[o.id] || o.defaultImage}/><b>{o.title}</b><small>{o.id}</small><input type="file" accept="image/*" onChange={e=>uploadOutfitImage(o.id,e.target.files?.[0])}/></div>)}</div>
        <h3>เพิ่มหนังสือ (.txt ดีที่สุด)</h3>
        <div className="setup-card"><input type="file" accept=".txt,.md" onChange={e=>addBookFile(e.target.files?.[0])}/><p>Word ให้คัดลอกเป็น .txt ก่อนในเวอร์ชันนี้</p></div>
      </div>}
    </section>}

    {toast && <div className="toast">{toast}</div>}
  </main>
}
