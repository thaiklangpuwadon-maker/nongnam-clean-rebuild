import {
  buildDefaultManifest,
  Manifest,
  STARTING_GEMS,
  type Gender,
} from "./appData";

/* =========================================================
   STORAGE KEYS — เปลี่ยน v1 → v2 เพราะ schema เปลี่ยน
   (chatImage/bookImage แยกจาก defaultImage)
   ========================================================= */
export const MEMORY_KEY = "nongnam_clean_memory_v2";
export const LOCAL_ASSETS_KEY = "nongnam_clean_local_assets_v2";
export const MANIFEST_KEY = "nongnam_clean_manifest_v2";

/* =========================================================
   USER MEMORY
   ========================================================= */
export type Chat = { role: "user" | "assistant"; content: string };

export type UserMemory = {
  setupDone: boolean;
  gender: Gender;
  userNickname: string;
  nongnamName: string;
  relationshipMode: "friend" | "lover" | "wife" | "assistant";
  sulkyLevel: "low" | "medium" | "high";
  selectedOutfitId: string;
  age20Confirmed: boolean;
  gems: number;
  purchasedOutfitIds: string[];
  purchasedBookIds: string[];
  affectionLevel: number;
  chat: Chat[];
};

export const DEFAULT_USER_MEMORY: UserMemory = {
  setupDone: false,
  gender: "female",
  userNickname: "พี่",
  nongnamName: "น้องน้ำ",
  relationshipMode: "lover",
  sulkyLevel: "medium",
  selectedOutfitId: "f_001",
  age20Confirmed: false,
  gems: STARTING_GEMS,
  purchasedOutfitIds: ["f_001", "m_001"],
  purchasedBookIds: ["book_001", "book_002"],
  affectionLevel: 0,
  chat: [],
};

export function getDefaultOutfitId(gender: Gender): string {
  return gender === "male" ? "m_001" : "f_001";
}

/* =========================================================
   RESET — ลบเฉพาะคาแรกเตอร์/ความจำ
   ห้าม! คืนเพชร / ห้าม! ลบชุดที่ซื้อแล้ว / ห้าม! ลบหนังสือที่ซื้อแล้ว
   ========================================================= */
export function resetCharacterOnly(memory: UserMemory): UserMemory {
  const fresh = { ...DEFAULT_USER_MEMORY };
  // เก็บค่าที่ห้ามคืน
  fresh.gems = memory.gems;
  fresh.purchasedOutfitIds = [...memory.purchasedOutfitIds];
  fresh.purchasedBookIds = [...memory.purchasedBookIds];
  // selectedOutfitId ต้องตรงกับ gender ใหม่ (ซึ่ง reset เป็น female)
  fresh.selectedOutfitId = getDefaultOutfitId(fresh.gender);
  return fresh;
}

/* =========================================================
   LOCALSTORAGE HELPERS — safe (no SSR crash)
   ========================================================= */
export function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveJSON(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota exceeded หรือ private mode — ไม่ต้องทำอะไร */
  }
}

/* =========================================================
   MANIFEST — โหลด/save manifest (ชุด+หนังสือ ที่ studio แก้ได้)
   ========================================================= */
export function loadLocalManifest(): Manifest {
  return loadJSON<Manifest>(MANIFEST_KEY, buildDefaultManifest());
}

export function saveLocalManifest(m: Manifest) {
  saveJSON(MANIFEST_KEY, { ...m, updatedAt: Date.now() });
}
