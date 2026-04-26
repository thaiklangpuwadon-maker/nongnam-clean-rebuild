"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ADMIN_PIN,
  BOOK_CATEGORIES,
  BookCategory,
  Book,
  Outfit,
  buildDefaultManifest,
  Manifest,
} from "../../lib/appData";
import {
  LOCAL_ASSETS_KEY,
  MANIFEST_KEY,
  loadJSON,
  loadLocalManifest,
  saveJSON,
  saveLocalManifest,
} from "../../lib/storage";
import {
  hasSupabaseConfig,
  uploadOutfitImageRemote,
  uploadBookCoverRemote,
  uploadManifestRemote,
} from "../../lib/supabase";

type Tab = "outfits" | "books" | "addbook";

export default function StudioPage() {
  const [pin, setPin] = useState("");
  const [ok, setOk] = useState(false);
  const [tab, setTab] = useState<Tab>("outfits");
  const [manifest, setManifest] = useState<Manifest>(buildDefaultManifest());
  const [assets, setAssets] = useState<Record<string, string>>({});
  const [toast, setToast] = useState("");
  const [dirty, setDirty] = useState(false);

  // new book form
  const [newBook, setNewBook] = useState<Partial<Book>>({
    title: "",
    desc: "",
    category: "encourage",
    price: 1,
    text: "",
    cover: "/assets/books/default_cover.jpg",
  });

  const supabaseReady = hasSupabaseConfig();

  useEffect(() => {
    setManifest(loadLocalManifest());
    setAssets(loadJSON<Record<string, string>>(LOCAL_ASSETS_KEY, {}));
  }, []);

  function notify(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2400);
  }

  function tryEnter() {
    if (pin === ADMIN_PIN) {
      setOk(true);
      notify("เข้าสู่จัดการไฟล์แล้ว");
    } else {
      notify("รหัสไม่ถูกต้อง");
    }
  }

  function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /* ---------- OUTFIT EDIT ---------- */
  function updateOutfit(id: string, patch: Partial<Outfit>) {
    setManifest(prev => ({
      ...prev,
      outfits: prev.outfits.map(o => o.id === id ? { ...o, ...patch } : o),
    }));
    setDirty(true);
  }

  async function uploadOutfitImage(id: string, variant: "chat" | "book", file?: File) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return notify("ไฟล์ใหญ่เกิน 5MB");

    if (supabaseReady) {
      const r = await uploadOutfitImageRemote(id, variant === "chat" ? "chatImage" : "bookImage", file);
      if (r.ok && r.url) {
        setAssets(prev => {
          const next = { ...prev, [`${id}_${variant}`]: r.url! };
          saveJSON(LOCAL_ASSETS_KEY, next);
          return next;
        });
        notify("อัปโหลดขึ้น Supabase แล้ว ✨");
        return;
      }
      notify(`Supabase พัง: ${r.error || "?"} → ใช้ local แทน`);
    }

    const data = await fileToDataUrl(file);
    setAssets(prev => {
      const next = { ...prev, [`${id}_${variant}`]: data };
      saveJSON(LOCAL_ASSETS_KEY, next);
      return next;
    });
    notify("อัปโหลดในเครื่องนี้แล้ว (เห็นเฉพาะเครื่องนี้)");
  }

  /* ---------- BOOK EDIT ---------- */
  function updateBook(id: string, patch: Partial<Book>) {
    setManifest(prev => ({
      ...prev,
      books: prev.books.map(b => b.id === id ? { ...b, ...patch } : b),
    }));
    setDirty(true);
  }

  function deleteBook(id: string) {
    if (!confirm("ลบหนังสือเล่มนี้?")) return;
    setManifest(prev => ({
      ...prev,
      books: prev.books.filter(b => b.id !== id),
    }));
    setDirty(true);
  }

  async function uploadBookCover(id: string, file?: File) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return notify("ไฟล์ใหญ่เกิน 5MB");

    if (supabaseReady) {
      const r = await uploadBookCoverRemote(id, file);
      if (r.ok && r.url) {
        updateBook(id, { cover: r.url });
        notify("อัปโหลดปกขึ้น Supabase แล้ว");
        return;
      }
    }
    const data = await fileToDataUrl(file);
    updateBook(id, { cover: data });
    notify("อัปโหลดปกในเครื่องนี้แล้ว");
  }

  async function addBookFromFile(file?: File) {
    if (!file) return;
    const text = await file.text().catch(() => "");
    if (!text.trim()) return notify("ไฟล์อ่านเป็นข้อความไม่ได้ ใช้ .txt หรือ .md");
    const b: Book = {
      id: `book_${Date.now()}`,
      title: file.name.replace(/\.[^.]+$/, ""),
      desc: "หนังสือที่พี่อัปโหลดเอง",
      category: "other",
      price: 1,
      cover: "/assets/books/default_cover.jpg",
      text,
    };
    setManifest(prev => ({ ...prev, books: [b, ...prev.books] }));
    setDirty(true);
    notify(`เพิ่ม "${b.title}" แล้ว`);
  }

  function addBookManual() {
    if (!newBook.title?.trim()) return notify("ใส่ชื่อหนังสือก่อน");
    if (!newBook.text?.trim()) return notify("ใส่เนื้อหาหนังสือก่อน");
    const b: Book = {
      id: `book_${Date.now()}`,
      title: newBook.title!.trim(),
      desc: newBook.desc?.trim() || "หนังสือใหม่",
      category: (newBook.category || "other") as BookCategory,
      price: Number(newBook.price) || 1,
      cover: newBook.cover || "/assets/books/default_cover.jpg",
      text: newBook.text!.trim(),
    };
    setManifest(prev => ({ ...prev, books: [b, ...prev.books] }));
    setDirty(true);
    setNewBook({ title: "", desc: "", category: "encourage", price: 1, text: "", cover: "/assets/books/default_cover.jpg" });
    notify(`เพิ่ม "${b.title}" แล้ว`);
    setTab("books");
  }

  /* ---------- SAVE ALL ---------- */
  async function saveAll() {
    saveLocalManifest(manifest);
    setDirty(false);

    if (supabaseReady) {
      const r = await uploadManifestRemote(manifest);
      if (r.ok) notify("บันทึก & sync Supabase แล้ว ✨");
      else notify(`บันทึก local แล้ว (Supabase: ${r.error})`);
    } else {
      notify("บันทึกในเครื่องนี้แล้ว — ตั้งค่า Supabase เพื่อให้ทุกคนเห็น");
    }
  }

  function resetManifest() {
    if (!confirm("รีเซ็ตชุด/หนังสือกลับเป็น default? (รูปอัปโหลดยังอยู่)")) return;
    const def = buildDefaultManifest();
    setManifest(def);
    saveLocalManifest(def);
    setDirty(false);
    notify("รีเซ็ต manifest แล้ว");
  }

  /* ============= RENDER ============= */

  if (!ok) {
    return (
      <main className="app">
        <section className="screen">
          <div className="top">
            <Link href="/" className="icon">←</Link>
            <div className="brand"><h2>จัดการไฟล์</h2><p>Studio</p></div>
            <div style={{ width: 48 }} />
          </div>
          <div className="setup-card">
            <label>รหัสเข้าจัดการไฟล์</label>
            <input
              type="password"
              value={pin}
              onChange={e => setPin(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") tryEnter(); }}
              placeholder="••••"
              autoFocus
            />
            <button className="primary full" onClick={tryEnter}>เข้าระบบ</button>
            <p style={{ fontSize: 12 }}>
              {supabaseReady
                ? "Supabase พร้อมใช้งาน: บันทึกแล้วทุกคนเห็นเหมือนกัน"
                : "ยังไม่ได้ตั้งค่า Supabase: รูปและข้อมูลจะเห็นเฉพาะเครื่องนี้ก่อน"}
            </p>
          </div>
        </section>
        {toast && <div className="toast">{toast}</div>}
      </main>
    );
  }

  return (
    <main className="app">
      <section className="screen">
        <div className="top">
          <Link href="/" className="icon">←</Link>
          <div className="brand"><h2>จัดการไฟล์</h2><p>{supabaseReady ? "ออนไลน์ผ่าน Supabase" : "เก็บในเครื่องนี้"}</p></div>
          <button className="icon" onClick={saveAll} disabled={!dirty} title="บันทึก">
            {dirty ? "💾" : "✓"}
          </button>
        </div>

        <div className="tabs">
          <button className={tab === "outfits" ? "active" : ""} onClick={() => setTab("outfits")}>ชุด</button>
          <button className={tab === "books" ? "active" : ""} onClick={() => setTab("books")}>หนังสือ</button>
          <button className={tab === "addbook" ? "active" : ""} onClick={() => setTab("addbook")}>เพิ่มหนังสือ</button>
        </div>

        <div className="admin-note">
          {supabaseReady
            ? "Supabase พร้อม: ทุกอย่างที่บันทึกจะ sync ขึ้น cloud"
            : "ยังไม่ได้ตั้งค่า Supabase: รูปจะเห็นเฉพาะเครื่องนี้ก่อน"}
        </div>

        {/* ====== OUTFITS TAB ====== */}
        {tab === "outfits" && (
          <div className="admin-list">
            {manifest.outfits.map(o => (
              <div className="admin-card" key={o.id}>
                <div className="admin-card-head">
                  <small>{o.id} · {o.gender} · {o.category}</small>
                  <label className="visible-toggle">
                    <input type="checkbox" checked={o.visible !== false}
                      onChange={e => updateOutfit(o.id, { visible: e.target.checked })} />
                    แสดง
                  </label>
                </div>

                <div className="admin-img-row">
                  <div>
                    <small>chat</small>
                    <img src={assets[`${o.id}_chat`] || o.chatImage}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/assets/books/default_cover.jpg"; }} />
                    <input type="file" accept="image/*"
                      onChange={e => uploadOutfitImage(o.id, "chat", e.target.files?.[0])} />
                  </div>
                  <div>
                    <small>book</small>
                    <img src={assets[`${o.id}_book`] || o.bookImage || o.chatImage}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/assets/books/default_cover.jpg"; }} />
                    <input type="file" accept="image/*"
                      onChange={e => uploadOutfitImage(o.id, "book", e.target.files?.[0])} />
                  </div>
                </div>

                <label>ชื่อชุด</label>
                <input value={o.title} onChange={e => updateOutfit(o.id, { title: e.target.value })} />
                <label>คำอธิบาย</label>
                <input value={o.desc} onChange={e => updateOutfit(o.id, { desc: e.target.value })} />
                <label>ราคาเพชร</label>
                <input type="number" value={o.price}
                  onChange={e => updateOutfit(o.id, { price: Math.max(0, parseInt(e.target.value) || 0) })} />
              </div>
            ))}
          </div>
        )}

        {/* ====== BOOKS TAB ====== */}
        {tab === "books" && (
          <div className="admin-list">
            {manifest.books.map(b => (
              <div className="admin-card" key={b.id}>
                <div className="admin-card-head">
                  <small>{b.id}</small>
                  <button className="link-danger" onClick={() => deleteBook(b.id)}>ลบ</button>
                </div>
                <div className="admin-img-single">
                  <img src={b.cover}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/assets/books/default_cover.jpg"; }} />
                  <input type="file" accept="image/*"
                    onChange={e => uploadBookCover(b.id, e.target.files?.[0])} />
                </div>
                <label>ชื่อหนังสือ</label>
                <input value={b.title} onChange={e => updateBook(b.id, { title: e.target.value })} />
                <label>คำอธิบาย</label>
                <input value={b.desc} onChange={e => updateBook(b.id, { desc: e.target.value })} />
                <label>หมวด</label>
                <select value={b.category} onChange={e => updateBook(b.id, { category: e.target.value as BookCategory })}>
                  {BOOK_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.emoji} {c.label}</option>)}
                </select>
                <label>ราคาเพชร</label>
                <input type="number" value={b.price}
                  onChange={e => updateBook(b.id, { price: Math.max(0, parseInt(e.target.value) || 0) })} />
                <label>เนื้อหา</label>
                <textarea rows={6} value={b.text}
                  onChange={e => updateBook(b.id, { text: e.target.value })} />
              </div>
            ))}
          </div>
        )}

        {/* ====== ADD BOOK TAB ====== */}
        {tab === "addbook" && (
          <div className="setup-card">
            <label>เพิ่มจากไฟล์ (.txt / .md)</label>
            <input type="file" accept=".txt,.md" onChange={e => addBookFromFile(e.target.files?.[0])} />
            <hr style={{ border: "none", borderTop: "1px dashed #e8c5d2", margin: "12px 0" }} />

            <label>ชื่อหนังสือ</label>
            <input value={newBook.title}
              onChange={e => setNewBook(prev => ({ ...prev, title: e.target.value }))}
              placeholder="เช่น เรื่องเล่าก่อนนอน" />

            <label>คำอธิบาย</label>
            <input value={newBook.desc}
              onChange={e => setNewBook(prev => ({ ...prev, desc: e.target.value }))} />

            <label>หมวด</label>
            <select value={newBook.category}
              onChange={e => setNewBook(prev => ({ ...prev, category: e.target.value as BookCategory }))}>
              {BOOK_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.emoji} {c.label}</option>)}
            </select>

            <label>ราคาเพชร</label>
            <input type="number" value={newBook.price}
              onChange={e => setNewBook(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))} />

            <label>เนื้อหา</label>
            <textarea rows={8} value={newBook.text}
              onChange={e => setNewBook(prev => ({ ...prev, text: e.target.value }))}
              placeholder="พิมพ์เนื้อหาหนังสือที่นี่..." />

            <button className="primary full" onClick={addBookManual}>เพิ่มหนังสือ</button>
          </div>
        )}

        <div className="bottom-actions">
          <button className="primary full" onClick={saveAll} disabled={!dirty}>
            {dirty ? "บันทึกทั้งหมด" : "บันทึกแล้ว ✓"}
          </button>
          <button className="secondary full" onClick={resetManifest}>รีเซ็ต manifest</button>
        </div>
      </section>
      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}
