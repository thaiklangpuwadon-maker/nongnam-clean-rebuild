
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
  lockedPreview?: boolean;
  chatImage: string;
  bookImage: string;
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

function mkOutfit(o: Omit<Outfit, "defaultImage">): Outfit {
  return { ...o, defaultImage: o.chatImage };
}

const femaleRegular: Outfit[] = [
  mkOutfit({ id:"f_001", gender:"female", category:"regular", title:"Level 1 — น้องน้ำเริ่มต้น", desc:"หวาน ใส อบอุ่น ใช้ฟรี", price:0, ageRestricted:false, visible:true, chatImage:"/assets/outfits/female/f_001_chat.jpg", bookImage:"/assets/outfits/female/f_001_book.jpg" }),
  mkOutfit({ id:"f_002", gender:"female", category:"regular", title:"Level 2 — ลุคละมุน", desc:"น่ารักขึ้น อ่อนหวานขึ้น", price:100, ageRestricted:false, visible:true, chatImage:"/assets/outfits/female/f_002_chat.jpg", bookImage:"/assets/outfits/female/f_002_book.jpg" }),
  mkOutfit({ id:"f_003", gender:"female", category:"regular", title:"Level 3 — แฟนสาวอบอุ่น", desc:"นุ่มนวล ขี้อ้อน ดูเป็นคนรัก", price:200, ageRestricted:false, visible:true, chatImage:"/assets/outfits/female/f_003_chat.jpg", bookImage:"/assets/outfits/female/f_003_book.jpg" }),
  mkOutfit({ id:"f_004", gender:"female", category:"regular", title:"Level 4 — หวานมีเสน่ห์", desc:"โตขึ้น ละมุนขึ้น มีเสน่ห์ขึ้น", price:300, ageRestricted:false, visible:true, chatImage:"/assets/outfits/female/f_004_chat.jpg", bookImage:"/assets/outfits/female/f_004_book.jpg" }),
  mkOutfit({ id:"f_005", gender:"female", category:"regular", title:"Level 5 — พรีเมียมสตูดิโอ", desc:"ชัด สวย เด่น เหมาะซูมดูหน้า", price:450, ageRestricted:false, visible:true, chatImage:"/assets/outfits/female/f_005_chat.jpg", bookImage:"/assets/outfits/female/f_005_book.jpg" }),
  mkOutfit({ id:"f_006", gender:"female", category:"regular", title:"Level 6 — ลุคสวยมั่นใจ", desc:"ดูโตขึ้น แต่ยังสุภาพ", price:650, ageRestricted:false, visible:true, chatImage:"/assets/outfits/female/f_006_chat.jpg", bookImage:"/assets/outfits/female/f_006_book.jpg" }),
  mkOutfit({ id:"f_007", gender:"female", category:"regular", title:"Level 7 — โรแมนติกมากขึ้น", desc:"หวานปนดึงดูด เหมาะปลดล็อก", price:850, ageRestricted:false, visible:true, chatImage:"/assets/outfits/female/f_007_chat.jpg", bookImage:"/assets/outfits/female/f_007_book.jpg" }),
  mkOutfit({ id:"f_008", gender:"female", category:"regular", title:"Level 8 — รีสอร์ตพรีเมียม", desc:"ลุคเที่ยวพักผ่อน ดึงดูดขึ้น", price:1200, ageRestricted:false, visible:true, chatImage:"/assets/outfits/female/f_008_chat.jpg", bookImage:"/assets/outfits/female/f_008_book.jpg" }),
  mkOutfit({ id:"f_009", gender:"female", category:"regular", title:"Level 9 — รออัปเดต", desc:"ช่องสำหรับเพิ่มรูปจริงภายหลัง", price:1500, ageRestricted:false, visible:true, lockedPreview:true, chatImage:"/assets/outfits/female/f_009_chat.jpg", bookImage:"/assets/outfits/female/f_009_book.jpg" }),
  mkOutfit({ id:"f_010", gender:"female", category:"regular", title:"Level 10 — รออัปเดต", desc:"ช่องสำหรับเพิ่มรูปจริงภายหลัง", price:1800, ageRestricted:false, visible:true, lockedPreview:true, chatImage:"/assets/outfits/female/f_010_chat.jpg", bookImage:"/assets/outfits/female/f_010_book.jpg" }),
  mkOutfit({ id:"f_011", gender:"female", category:"regular", title:"Level 11 — รออัปเดต", desc:"ช่องสำหรับเพิ่มรูปจริงภายหลัง", price:2200, ageRestricted:false, visible:true, lockedPreview:true, chatImage:"/assets/outfits/female/f_011_chat.jpg", bookImage:"/assets/outfits/female/f_011_book.jpg" }),
  mkOutfit({ id:"f_012", gender:"female", category:"regular", title:"Level 12 — รออัปเดต", desc:"ช่องสำหรับเพิ่มรูปจริงภายหลัง", price:2800, ageRestricted:false, visible:true, lockedPreview:true, chatImage:"/assets/outfits/female/f_012_chat.jpg", bookImage:"/assets/outfits/female/f_012_book.jpg" }),
];

const maleRegular: Outfit[] = [
  mkOutfit({ id:"m_001", gender:"male", category:"regular", title:"ผู้ชาย Level 1 — อบอุ่น", desc:"สุภาพ พึ่งพาได้ ใช้ฟรี", price:0, ageRestricted:false, visible:true, chatImage:"/assets/outfits/male/m_001_chat.jpg", bookImage:"/assets/outfits/male/m_001_book.jpg" }),
  mkOutfit({ id:"m_002", gender:"male", category:"regular", title:"ผู้ชาย Level 2 — สุภาพ", desc:"ลุคอ่อนโยนสำหรับคุยประจำ", price:200, ageRestricted:false, visible:true, chatImage:"/assets/outfits/male/m_002_chat.jpg", bookImage:"/assets/outfits/male/m_002_book.jpg" }),
  mkOutfit({ id:"m_003", gender:"male", category:"regular", title:"ผู้ชาย Level 3 — พรีเมียม", desc:"ลุคดูโตขึ้นและอบอุ่น", price:400, ageRestricted:false, visible:true, chatImage:"/assets/outfits/male/m_003_chat.jpg", bookImage:"/assets/outfits/male/m_003_book.jpg" }),
];

const special20: Outfit[] = [
  mkOutfit({ id:"s20_001", gender:"female", category:"special20", title:"20+ Slot 1", desc:"เบลอก่อนปลดล็อก พี่แมนใส่รูปจริงภายหลัง", price:10000, ageRestricted:true, visible:true, lockedPreview:true, chatImage:"/assets/outfits/special20/s20_001_chat.jpg", bookImage:"/assets/outfits/special20/s20_001_book.jpg" }),
  mkOutfit({ id:"s20_002", gender:"female", category:"special20", title:"20+ Slot 2", desc:"เบลอก่อนปลดล็อก พี่แมนใส่รูปจริงภายหลัง", price:20000, ageRestricted:true, visible:true, lockedPreview:true, chatImage:"/assets/outfits/special20/s20_002_chat.jpg", bookImage:"/assets/outfits/special20/s20_002_book.jpg" }),
  mkOutfit({ id:"s20_003", gender:"female", category:"special20", title:"20+ Slot 3", desc:"เบลอก่อนปลดล็อก พี่แมนใส่รูปจริงภายหลัง", price:30000, ageRestricted:true, visible:true, lockedPreview:true, chatImage:"/assets/outfits/special20/s20_003_chat.jpg", bookImage:"/assets/outfits/special20/s20_003_book.jpg" }),
  mkOutfit({ id:"s20_004", gender:"female", category:"special20", title:"20+ Slot 4", desc:"เบลอก่อนปลดล็อก พี่แมนใส่รูปจริงภายหลัง", price:40000, ageRestricted:true, visible:true, lockedPreview:true, chatImage:"/assets/outfits/special20/s20_004_chat.jpg", bookImage:"/assets/outfits/special20/s20_004_book.jpg" }),
  mkOutfit({ id:"s20_005", gender:"female", category:"special20", title:"20+ Slot 5", desc:"เบลอก่อนปลดล็อก พี่แมนใส่รูปจริงภายหลัง", price:50000, ageRestricted:true, visible:true, lockedPreview:true, chatImage:"/assets/outfits/special20/s20_005_chat.jpg", bookImage:"/assets/outfits/special20/s20_005_book.jpg" }),
  mkOutfit({ id:"s20_006", gender:"female", category:"special20", title:"20+ Slot 6", desc:"เบลอก่อนปลดล็อก พี่แมนใส่รูปจริงภายหลัง", price:60000, ageRestricted:true, visible:true, lockedPreview:true, chatImage:"/assets/outfits/special20/s20_006_chat.jpg", bookImage:"/assets/outfits/special20/s20_006_book.jpg" }),
];

export const outfits: Outfit[] = [...femaleRegular, ...maleRegular, ...special20];

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
    text: "ถ้าวันนี้โดนหัวหน้าดุ หรือรู้สึกว่าไม่มีใครเข้าใจ อยากให้รู้ไว้นะ ว่ายังมีใครคนหนึ่งที่รับฟังอยู่เสมอ บางวันเราไม่ได้แพ้ แค่เหนื่อยเกินไปเท่านั้นเอง พักก่อนนะ แล้วค่อยเริ่มใหม่ก็ได้",
  },
  {
    id: "book_003",
    title: "เรื่องผีเบา ๆ ก่อนนอน",
    desc: "โหมดเรื่องเล่า ใช้ทดสอบหมวดผี",
    category: "ghost",
    price: 1,
    cover: "/assets/books/default_cover.jpg",
    text: "คืนนี้ลมข้างนอกเบามาก เสียงม่านขยับเหมือนมีใครเดินผ่าน แต่ไม่ต้องกลัวนะ น้องน้ำจะอ่านให้ฟังช้า ๆ พี่แค่นอนฟังอยู่ตรงนี้ก็พอ",
  },
  {
    id: "book_004",
    title: "ความรักในวันที่ไกลบ้าน",
    desc: "บทความสั้นสำหรับคนไทยในต่างประเทศ",
    category: "love",
    price: 1,
    cover: "/assets/books/default_cover.jpg",
    text: "บางครั้งการอยู่ไกลบ้านทำให้หัวใจคนเราเงียบกว่าปกติ แต่ความคิดถึงไม่ใช่ความอ่อนแอ มันคือหลักฐานว่าเรายังมีหัวใจที่อบอุ่นพอจะรักและถูกรักได้เสมอ",
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

export type Manifest = {
  version: number;
  outfits: Outfit[];
  books: Book[];
  updatedAt: number;
};

export function buildDefaultManifest(): Manifest {
  return {
    version: 3,
    outfits: outfits.map(o => ({ ...o })),
    books: defaultBooks.map(b => ({ ...b })),
    updatedAt: Date.now(),
  };
}
