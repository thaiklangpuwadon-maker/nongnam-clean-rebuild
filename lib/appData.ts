
export type Gender = "female" | "male";
export type OutfitCategory = "regular" | "special20";

export type Outfit = {
  id: string;
  gender: Gender;
  category: OutfitCategory;
  title: string;
  desc: string;
  price: number;
  ageRestricted: boolean;
  defaultImage: string;
};

export type Book = {
  id: string;
  title: string;
  desc: string;
  price: number;
  text: string;
  cover: string;
};

export const ADMIN_PIN = process.env.NEXT_PUBLIC_ADMIN_PIN || "2468";
export const STARTING_GEMS = 120;

export const outfits: Outfit[] = [
  { id:"f_001", gender:"female", category:"regular", title:"สุภาพเริ่มต้น", desc:"คุยสบาย อบอุ่น", price:0, ageRestricted:false, defaultImage:"/assets/outfits/female/f_001.jpg" },
  { id:"f_002", gender:"female", category:"regular", title:"ลุคคาเฟ่", desc:"หวานขึ้นเล็กน้อย", price:200, ageRestricted:false, defaultImage:"/assets/outfits/female/f_002.jpg" },
  { id:"f_003", gender:"female", category:"regular", title:"เดรสชมพู", desc:"น่ารัก สดใส", price:300, ageRestricted:false, defaultImage:"/assets/outfits/female/f_003.jpg" },
  { id:"f_004", gender:"female", category:"regular", title:"พรีเมียมดำ", desc:"ดูดี มีเสน่ห์", price:500, ageRestricted:false, defaultImage:"/assets/outfits/female/f_004.jpg" },

  { id:"m_001", gender:"male", category:"regular", title:"สุภาพเริ่มต้น", desc:"อบอุ่น พึ่งพาได้", price:0, ageRestricted:false, defaultImage:"/assets/outfits/male/m_001.jpg" },
  { id:"m_002", gender:"male", category:"regular", title:"เชิ้ตฟ้า", desc:"สุภาพ สดใส", price:200, ageRestricted:false, defaultImage:"/assets/outfits/male/m_002.jpg" },

  { id:"s20_001", gender:"female", category:"special20", title:"20+ ช่องรูป 1", desc:"พี่แมนอัปโหลดเอง", price:10000, ageRestricted:true, defaultImage:"/assets/outfits/special20/s20_001.jpg" },
  { id:"s20_002", gender:"female", category:"special20", title:"20+ ช่องรูป 2", desc:"พี่แมนอัปโหลดเอง", price:20000, ageRestricted:true, defaultImage:"/assets/outfits/special20/s20_002.jpg" }
];

export const defaultBooks: Book[] = [
  {
    id:"book_001",
    title:"นิทานก่อนนอน: วันที่เหนื่อยที่สุด",
    desc:"เรื่องสั้นปลอบใจ อ่านให้ฟังได้",
    price:1,
    cover:"/assets/books/default_cover.jpg",
    text:"วันนี้อาจเป็นวันที่เหนื่อยมากสำหรับใครบางคน แต่ไม่เป็นไรเลยนะ พักตรงนี้ก่อน หายใจช้า ๆ แล้วปล่อยให้หัวใจได้วางของหนักลงบ้าง เธอไม่ได้ต้องเข้มแข็งตลอดเวลา แค่ยังอยู่ตรงนี้ได้ ก็เก่งมากแล้ว"
  },
  {
    id:"book_002",
    title:"กำลังใจเล็ก ๆ จากน้องน้ำ",
    desc:"บทความสั้นสำหรับวันที่โดนดุ",
    price:1,
    cover:"/assets/books/default_cover.jpg",
    text:"ถ้าวันนี้โดนหัวหน้าดุ หรือรู้สึกว่าไม่มีใครเข้าใจ อยากให้รู้ว่ายังมีคนหนึ่งที่รับฟังอยู่เสมอ บางวันเราไม่ได้แพ้ แค่เหนื่อยเกินไปเท่านั้นเอง พักก่อนนะ แล้วค่อยเริ่มใหม่ก็ได้"
  }
];
