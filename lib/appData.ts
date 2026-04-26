export type Gender = "female" | "male";
export type OutfitCategory = "regular" | "special20";
export type BookCategory = "encourage" | "tale" | "ghost" | "love" | "knowledge" | "other";

export type Outfit = {
  id: string;
  gender: Gender;
  category: OutfitCategory;
  title: string;
  desc: string;
  price: number;
  ageRestricted: boolean;
  visible: boolean;
  /** ภาพหลักในหน้าแชต */
  chatImage: string;
  /** ภาพในโหมดอ่านหนังสือ ถ้าไม่มี ให้ fallback เป็น chatImage */
  bookImage: string;
  /** legacy alias — เก็บไว้เพื่อ backward compat กับ code เดิม */
  defaultImage?: string;
};

export type Book = {
  id: string;
  title: string;
  desc: string;
  category: BookCategory;
  price: number;
  text: string;
  cover: string;
};

export const ADMIN_PIN = process.env.NEXT_PUBLIC_ADMIN_PIN || "2468";
export const STARTING_GEMS = 120;

/* =========================================================
   OUTFITS — แต่ละชุดมี chatImage และ bookImage แยกกัน
   ถ้า bookImage ยังไม่มีรูปจริง ให้ใช้ chatImage แทน (fallback)
   ========================================================= */
function mkOutfit(o: Omit<Outfit, "defaultImage">): Outfit {
  return { ...o, defaultImage: o.chatImage };
}

export const outfits: Outfit[] = [
  mkOutfit({
    id: "f_001", gender: "female", category: "regular",
    title: "ชุดหวานเริ่มต้น", desc: "ลุคอบอุ่น คุยง่าย ใช้เปิดแชตประจำ",
    price: 0, ageRestricted: false, visible: true,
    chatImage: "/assets/outfits/female/f_001.jpg",
    bookImage: "/assets/outfits/female/f_001.jpg",
  }),
  mkOutfit({
    id: "f_002", gender: "female", category: "regular",
    title: "ชุดละมุน", desc: "หวานขึ้นเล็กน้อย เหมาะกับวันอบอุ่น",
    price: 200, ageRestricted: false, visible: true,
    chatImage: "/assets/outfits/female/f_002.jpg",
    bookImage: "/assets/outfits/female/f_002.jpg",
  }),
  mkOutfit({
    id: "f_003", gender: "female", category: "regular",
    title: "เดรสชมพู", desc: "น่ารัก สดใส ใส่เดทดี",
    price: 300, ageRestricted: false, visible: true,
    chatImage: "/assets/outfits/female/f_003.jpg",
    bookImage: "/assets/outfits/female/f_003.jpg",
  }),
  mkOutfit({
    id: "f_004", gender: "female", category: "regular",
    title: "พรีเมียมดำ", desc: "ดูดี มีเสน่ห์",
    price: 500, ageRestricted: false, visible: true,
    chatImage: "/assets/outfits/female/f_004.jpg",
    bookImage: "/assets/outfits/female/f_004.jpg",
  }),

  mkOutfit({
    id: "m_001", gender: "male", category: "regular",
    title: "ลุคสุภาพเริ่มต้น", desc: "อบอุ่น พึ่งพาได้",
    price: 0, ageRestricted: false, visible: true,
    chatImage: "/assets/outfits/male/m_001.jpg",
    bookImage: "/assets/outfits/male/m_001.jpg",
  }),
  mkOutfit({
    id: "m_002", gender: "male", category: "regular",
    title: "เชิ้ตฟ้า", desc: "สุภาพ สดใส",
    price: 200, ageRestricted: false, visible: true,
    chatImage: "/assets/outfits/male/m_002.jpg",
    bookImage: "/assets/outfits/male/m_002.jpg",
  }),

  mkOutfit({
    id: "s20_001", gender: "female", category: "special20",
    title: "ลุคพิเศษ 1 (20+)", desc: "หมวดสำหรับผู้ใหญ่ พี่อัปโหลดเอง",
    price: 10000, ageRestricted: true, visible: true,
    chatImage: "/assets/outfits/special20/s20_001.jpg",
    bookImage: "/assets/outfits/special20/s20_001.jpg",
  }),
  mkOutfit({
    id: "s20_002", gender: "female", category: "special20",
    title: "ลุคพิเศษ 2 (20+)", desc: "หมวดสำหรับผู้ใหญ่ พี่อัปโหลดเอง",
    price: 20000, ageRestricted: true, visible: true,
    chatImage: "/assets/outfits/special20/s20_002.jpg",
    bookImage: "/assets/outfits/special20/s20_002.jpg",
  }),
];

/* =========================================================
   BOOKS — มี category, ไม่มีรูปจริงใช้ default_cover.jpg
   ========================================================= */
export const defaultBooks: Book[] = [
  {
    id: "book_001",
    title: "นิทานก่อนนอน: วันที่เหนื่อยที่สุด",
    desc: "เรื่องสั้นปลอบใจ อ่านให้ฟังได้",
    category: "encourage",
    price: 1,
    cover: "/assets/books/default_cover.jpg",
    text: "วันนี้อาจเป็นวันที่เหนื่อยมากสำหรับใครบางคน แต่ไม่เป็นไรเลยนะ พักตรงนี้ก่อน หายใจช้า ๆ แล้วปล่อยให้หัวใจได้วางของหนักลงบ้าง เธอไม่ได้ต้องเข้มแข็งตลอดเวลา แค่ยังอยู่ตรงนี้ได้ ก็เก่งมากแล้ว",
  },
  {
    id: "book_002",
    title: "กำลังใจเล็ก ๆ จากน้องน้ำ",
    desc: "บทความสั้นสำหรับวันที่โดนดุ",
    category: "encourage",
    price: 1,
    cover: "/assets/books/default_cover.jpg",
    text: "ถ้าวันนี้โดนหัวหน้าดุ หรือรู้สึกว่าไม่มีใครเข้าใจ อยากให้รู้ว่ายังมีคนหนึ่งที่รับฟังอยู่เสมอ บางวันเราไม่ได้แพ้ แค่เหนื่อยเกินไปเท่านั้นเอง พักก่อนนะ แล้วค่อยเริ่มใหม่ก็ได้",
  },
];

export const BOOK_CATEGORIES: { key: BookCategory; label: string; emoji: string }[] = [
  { key: "encourage", label: "กำลังใจ", emoji: "🌸" },
  { key: "tale",      label: "นิทาน",   emoji: "📖" },
  { key: "ghost",     label: "เรื่องผี", emoji: "👻" },
  { key: "love",      label: "ความรัก", emoji: "💗" },
  { key: "knowledge", label: "ความรู้", emoji: "📚" },
  { key: "other",     label: "อื่น ๆ",  emoji: "✨" },
];

/* =========================================================
   MANIFEST — รวมข้อมูลที่ studio แก้ได้
   ========================================================= */
export type Manifest = {
  version: number;
  outfits: Outfit[];
  books: Book[];
  updatedAt: number;
};

export function buildDefaultManifest(): Manifest {
  return {
    version: 1,
    outfits: outfits.map(o => ({ ...o })),
    books: defaultBooks.map(b => ({ ...b })),
    updatedAt: Date.now(),
  };
}
