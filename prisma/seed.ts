/**
 * PATA demo seed — fictional catalogue only.
 * All books/authors are invented for demo purposes; demo PDFs are self-authored
 * generated content (no copyrighted material). Safe to re-run (idempotent upserts).
 *
 * Run: bun prisma/seed.ts
 */
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/tokens";

const db = new PrismaClient();

// ─── Minimal self-contained PDF writer (demo eBooks, ASCII text) ─────────────

function makeDemoPdf(title: string, chapters: { heading: string; body: string[] }[]): Buffer {
  const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  const objects: string[] = [];
  const pageWidth = 612;
  const pageHeight = 792;

  const pageObjs: number[] = [];
  const fontObjNum = 3; // reserved
  let nextObj = 4;

  const pageNums: number[] = [];
  const contentNums: number[] = [];
  for (let i = 0; i < chapters.length; i++) {
    pageNums.push(nextObj++);
    contentNums.push(nextObj++);
  }

  objects[1] = `<< /Type /Catalog /Pages 2 0 R >>`;
  objects[2] = `<< /Type /Pages /Kids [${pageNums.map((n) => `${n} 0 R`).join(" ")}] /Count ${pageNums.length} >>`;
  objects[fontObjNum] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`;

  chapters.forEach((ch, i) => {
    const lines: string[] = [];
    let y = pageHeight - 72;
    lines.push(`BT /F1 20 Tf 72 ${y} Td (${esc(ch.heading)}) Tj ET`);
    y -= 40;
    lines.push(`BT /F1 10 Tf 72 ${y} Td (${esc(title)} — PATA demo eBook, self-authored sample content) Tj ET`);
    y -= 30;
    for (const para of ch.body) {
      const words = para.split(" ");
      let line = "";
      for (const w of words) {
        if ((line + " " + w).trim().length > 82) {
          lines.push(`BT /F1 11 Tf 72 ${y} Td (${esc(line)}) Tj ET`);
          y -= 16;
          line = w;
        } else {
          line = line ? line + " " + w : w;
        }
      }
      if (line) {
        lines.push(`BT /F1 11 Tf 72 ${y} Td (${esc(line)}) Tj ET`);
        y -= 16;
      }
      y -= 10;
    }
    const content = lines.join("\n");
    objects[contentNums[i]] = `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`;
    objects[pageNums[i]] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontObjNum} 0 R >> >> /Contents ${contentNums[i]} 0 R >>`;
  });

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  for (let i = 1; i < objects.length; i++) {
    if (!objects[i]) continue;
    offsets[i] = Buffer.byteLength(pdf);
    pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xrefStart = Buffer.byteLength(pdf);
  const maxObj = objects.length - 1;
  pdf += `xref\n0 ${maxObj + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= maxObj; i++) {
    pdf += offsets[i] ? `${String(offsets[i]).padStart(10, "0")} 00000 n \n` : `0000000000 65535 f \n`;
  }
  pdf += `trailer\n<< /Size ${maxObj + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return Buffer.from(pdf, "binary");
}

function demoChapters(bookTitle: string) {
  return [
    {
      heading: "Demo Edition",
      body: [
        `This sample file belongs to the fictional demo title "${bookTitle}" listed in the PATA demo catalogue.`,
        `It is machine-generated placeholder content created for testing the secure download flow. No copyrighted material is included. In production, only files the store owns or is licensed to distribute may be uploaded here.`,
      ],
    },
    {
      heading: "Sample Chapter 1",
      body: [
        `The download you are reading is streamed by the PATA server only after payment verification or an explicit administrator grant. The original file never receives a permanent public URL.`,
        `Each delivery is counted and audited. Expired, revoked, or over-limit entitlements are denied.`,
      ],
    },
    {
      heading: "Sample Chapter 2",
      body: [
        `Replace this file with your own licensed eBook through the admin panel: Admin > Products > Digital asset. Rights confirmation is required for every digital asset before it can be published.`,
        `Thank you for testing PATA.`,
      ],
    },
  ];
}

// ─── Seed data ───────────────────────────────────────────────────────────────

const CATEGORIES = [
  { slug: "uponnash", name: "উপন্যাস", nameEn: "Novel", description: "গল্পের জাদুতে মোড়া দীর্ঘ যাত্রা।" },
  { slug: "golpo", name: "গল্প", nameEn: "Stories", description: "ছোট-বড় গল্পের সংকলন।" },
  { slug: "kobita", name: "কবিতা", nameEn: "Poetry", description: "শব্দের সুরে মনের কথা।" },
  { slug: "attounnayon", name: "আত্মউন্নয়ন", nameEn: "Self-help", description: "নিজেকে জানা ও গড়ার পথনির্দেশিকা।" },
  { slug: "byabsa", name: "ব্যবসা", nameEn: "Business", description: "ব্যবসা, অর্থনীতি ও উদ্যোক্তার বই।" },
  { slug: "itihas", name: "ইতিহাস", nameEn: "History", description: "অতীতের পাঠ, বর্তমানের আয়না।" },
  { slug: "shishu-kishor", name: "শিশু-কিশোর", nameEn: "Children & Teen", description: "ছোটদের জন্য গল্প ও জ্ঞান।" },
  { slug: "academic", name: "একাডেমিক", nameEn: "Academic", description: "পড়াশোনার সহায়ক বই।" },
  { slug: "ranna", name: "রান্না", nameEn: "Cooking", description: "রান্নাঘরের প্রেরণা।" },
];

type SeedBook = {
  slug: string;
  title: string;
  titleEn: string;
  subtitle?: string;
  author: string;
  publisher: string;
  year: number;
  pages: number;
  language: "bn" | "en";
  description: string;
  categories: string[];
  coverPattern: string;
  featured?: boolean;
  newArrival?: boolean;
  editorPick?: boolean;
  variants: { formatType: "physical" | "digital" | "bundle"; price: number; compareAt?: number; stock?: number }[];
};

const BOOKS: SeedBook[] = [
  {
    slug: "nodir-nam-chhilo-apekkha",
    title: "নদীর নাম ছিল অপেক্ষা",
    titleEn: "The River Was Named Waiting",
    subtitle: "একটি নদী, তিন প্রজন্ম, অসমাপ্ত প্রতীক্ষা",
    author: "আফসানা মীরা (ডেমো)",
    publisher: "পাতা প্রকাশনী",
    year: 2024,
    pages: 288,
    language: "bn",
    description:
      "ছোট নদীর গ্রাম চরুকাশ থেকে শুরু করে নগরের কোলাহলে পৌঁছানো তিন প্রজন্মের গল্প। দাদির অপেক্ষা, বাবার নির্মাণ আর মেয়ের প্রশ্ন — এই উপন্যাস বাঁধ ভাঙা নদীর মতোই বয়ে চলে স্মৃতি ও ভালোবাসার পলি জমিয়ে। (ডেমো বই — কাল্পনিক রচনা)",
    categories: ["uponnash"],
    coverPattern: "oxblood",
    featured: true,
    editorPick: true,
    variants: [
      { formatType: "physical", price: 450, compareAt: 520, stock: 24 },
      { formatType: "digital", price: 250 },
      { formatType: "bundle", price: 600, compareAt: 700, stock: 24 },
    ],
  },
  {
    slug: "shohorer-shesh-chithi",
    title: "শহরের শেষ চিঠি",
    titleEn: "The City's Last Letter",
    author: "রুদ্র চৌধুরী (ডেমো)",
    publisher: "পাতা প্রকাশনী",
    year: 2023,
    pages: 216,
    language: "bn",
    description:
      "পুরান ঢাকার এক ভাড়াটিয়া বাড়িতে পাওয়া যায় ত্রিশ বছর আগের একগুচ্ছ চিঠি। প্রতিটি চিঠি খোলার সঙ্গে খোলে শহরের হারানো একটি সময়। (ডেমো বই — কাল্পনিক রচনা)",
    categories: ["uponnash"],
    coverPattern: "teal",
    newArrival: true,
    variants: [
      { formatType: "physical", price: 380, stock: 18 },
      { formatType: "digital", price: 200 },
    ],
  },
  {
    slug: "megheder-kachhe-chithi",
    title: "মেঘেদের কাছে চিঠি",
    titleEn: "Letters to the Clouds",
    author: "নীলফাম আক্তার (ডেমো)",
    publisher: "পাতা প্রকাশনী",
    year: 2024,
    pages: 168,
    language: "bn",
    description:
      "চা-বাগানের মেজাজ মিশ্রিত ষোলোটি গল্প — যেখানে মানুষ মেঘকে চিঠি লেখে, আর মেঘ উত্তর দেয় বৃষ্টিতে। (ডেমো বই — কাল্পনিক রচনা)",
    categories: ["golpo"],
    coverPattern: "sage",
    featured: true,
    newArrival: true,
    variants: [
      { formatType: "physical", price: 320, stock: 30 },
      { formatType: "digital", price: 180 },
      { formatType: "bundle", price: 450, stock: 30 },
    ],
  },
  {
    slug: "shokalbelar-rod",
    title: "সকালবেলার রোদ",
    titleEn: "Morning Light",
    author: "সাদিয়া হক (ডেমো)",
    publisher: "পাতা প্রকাশনী",
    year: 2022,
    pages: 96,
    language: "bn",
    description:
      "প্রথম কবিতা-সংকলন। প্রতিদিনের সাধারণ মুহূর্তগুলোকে ঘিরে লেখা আশির দশকের পরের প্রজন্মের কবিতা। (ডেমো বই — কাল্পনিক রচনা)",
    categories: ["kobita"],
    coverPattern: "mustard",
    variants: [{ formatType: "physical", price: 280, stock: 40 }],
  },
  {
    slug: "nijeke-janar-pothe",
    title: "নিজেকে জানার পথে",
    titleEn: "Toward Knowing Yourself",
    subtitle: "ছোট অভ্যাস, বড় পরিবর্তন",
    author: "তানভীর রহমান (ডেমো)",
    publisher: "পাতা প্রকাশনী",
    year: 2023,
    pages: 240,
    language: "bn",
    description:
      "অভ্যাস, মনোযোগ ও সময় — তিনটি অধ্যায়ে সাজানো বাস্তব অনুশীলননির্ভর আত্মউন্নয়ন গাইড, বাংলাদেশের প্রেক্ষাপটে লেখা উদাহরণসহ। (ডেমো বই — কাল্পনিক রচনা)",
    categories: ["attounnayon"],
    coverPattern: "sage",
    editorPick: true,
    variants: [
      { formatType: "physical", price: 420, stock: 22 },
      { formatType: "digital", price: 220 },
      { formatType: "bundle", price: 560, compareAt: 640, stock: 22 },
    ],
  },
  {
    slug: "choto-byabsa-boro-shwapno",
    title: "ছোট ব্যবসা, বড় স্বপ্ন",
    titleEn: "Small Business, Big Dreams",
    author: "মারিয়া জামান (ডেমো)",
    publisher: "পাতা প্রকাশনী",
    year: 2024,
    pages: 264,
    language: "bn",
    description:
      "অনলাইন দোকান থেকে রেজিস্টার্ড প্রতিষ্ঠান — বাংলাদেশের ক্ষুদ্র উদ্যোক্তাদের জন্য ধাপে ধাপে ব্যবসা-পরিকল্পনার হাতে-কলমে নির্দেশিকা। (ডেমো বই — কাল্পনিক রচনা)",
    categories: ["byabsa"],
    coverPattern: "clay",
    newArrival: true,
    variants: [
      { formatType: "physical", price: 480, stock: 15 },
      { formatType: "digital", price: 260 },
    ],
  },
  {
    slug: "padmar-desh",
    title: "পদ্মার দেশ",
    titleEn: "Land of the Padma",
    subtitle: "নদী, মানুষ ও সময়ের ইতিবৃত্ত",
    author: "প্রফেসর গোলাম কিবরিয়া (ডেমো)",
    publisher: "পাতা প্রকাশনী",
    year: 2021,
    pages: 412,
    language: "bn",
    description:
      "পদ্মা-তীরের জনপদের ইতিহাস — নৌকা, হাট, বাঁধ ও বিস্তারিত প্রত্নচিত্র ঘিরে লেখা জনপ্রিয় ইতিহাস। (ডেমো বই — কাল্পনিক রচনা)",
    categories: ["itihas"],
    coverPattern: "ink",
    featured: true,
    variants: [
      { formatType: "physical", price: 650, stock: 12 },
      { formatType: "digital", price: 350 },
      { formatType: "bundle", price: 850, compareAt: 1000, stock: 12 },
    ],
  },
  {
    slug: "chandmamar-golpo",
    title: "চাঁদমামার গল্প",
    titleEn: "Moon Uncle's Tales",
    author: "ঝুমুর সরকার (ডেমো)",
    publisher: "পাতা প্রকাশনী",
    year: 2023,
    pages: 64,
    language: "bn",
    description:
      "ঘুম পাড়ানোর সময়ের জন্য দশটি মিষ্টি গল্প — চাঁদমামা আর তার তারাবন্ধুদের ছোট্ট অ্যাডভেঞ্চার। (ডেমো বই — কাল্পনিক রচনা)",
    categories: ["shishu-kishor"],
    coverPattern: "teal",
    variants: [{ formatType: "physical", price: 250, stock: 35 }],
  },
  {
    slug: "goniter-moja",
    title: "গণিতের মজা",
    titleEn: "The Fun of Mathematics",
    author: "ড. আরিফুল ইসলাম (ডেমো)",
    publisher: "পাতা প্রকাশনী",
    year: 2022,
    pages: 320,
    language: "bn",
    description:
      "খেলা, ধাঁধা আর গল্পের মাধ্যমে স্কুল-পাঠ্য গণিতের ভয় কাটানোর চেষ্টা — অষ্টম-নবম শ্রেণির শিক্ষার্থীদের জন্য। (ডেমো বই — কাল্পনিক রচনা)",
    categories: ["academic"],
    coverPattern: "plum",
    variants: [{ formatType: "physical", price: 360, stock: 28 }],
  },
  {
    slug: "rannagharer-notebook",
    title: "রান্নাঘরের নোটবুক",
    titleEn: "The Kitchen Notebook",
    subtitle: "শতাধিক ঘরোয়া রেসিপি",
    author: "শিরিন মাহমুদ (ডেমো)",
    publisher: "পাতা প্রকাশনী",
    year: 2024,
    pages: 196,
    language: "bn",
    description:
      "নানির হাতের খিচুড়ি থেকে আধুনিক ফিউশন — পরিমাপসহ সাজানো একশো টি পরীক্ষিত রেসিপি, ছবিসহ। (ডেমো বই — কাল্পনিক রচনা)",
    categories: ["ranna"],
    coverPattern: "clay",
    editorPick: true,
    variants: [
      { formatType: "physical", price: 520, stock: 16 },
      { formatType: "bundle", price: 700, stock: 16 },
    ],
  },
  {
    slug: "shobuj-potaka",
    title: "সবুজ পতাকা",
    titleEn: "The Green Flag",
    author: "ইমতিয়াজ কবীর (ডেমো)",
    publisher: "পাতা ডিজিটাল",
    year: 2025,
    pages: 180,
    language: "bn",
    description:
      "একটি ফুটবল টুর্নামেন্ট, একটি বস্তির ছেলেদের দল আর হার না মানা স্বপ্ন নিয়ে ছোট উপন্যাস। শুধু ডিজিটাল সংস্করণ। (ডেমো বই — কাল্পনিক রচনা)",
    categories: ["uponnash", "shishu-kishor"],
    coverPattern: "sage",
    newArrival: true,
    variants: [{ formatType: "digital", price: 199 }],
  },
  {
    slug: "startup-er-prothom-dhap",
    title: "স্টার্টআপের প্রথম ধাপ",
    titleEn: "First Steps of a Startup",
    author: "সাইফুল আলম (ডেমো)",
    publisher: "পাতা ডিজিটাল",
    year: 2025,
    pages: 220,
    language: "bn",
    description:
      "আইডিয়া যাচাই থেকে প্রথম কাস্টমার — বাংলাদেশি প্রেক্ষাপটে স্টার্টআপ শুরুর প্র্যাকটিক্যাল গাইড। শুধু ডিজিটাল সংস্করণ। (ডেমো বই — কাল্পনিক রচনা)",
    categories: ["byabsa"],
    coverPattern: "oxblood",
    newArrival: true,
    variants: [{ formatType: "digital", price: 249, compareAt: 299 }],
  },
  {
    slug: "bristi-name-shondhay",
    title: "বৃষ্টি নামে সন্ধ্যায়",
    titleEn: "Rain Falls in the Evening",
    author: "সাদিয়া হক (ডেমো)",
    publisher: "পাতা প্রকাশনী",
    year: 2025,
    pages: 88,
    language: "bn",
    description:
      "দ্বিতীয় কাব্যগ্রন্থ — শহর, বৃষ্টি ও বিদায়ের কবিতা। (ডেমো বই — কাল্পনিক রচনা)",
    categories: ["kobita"],
    coverPattern: "ink",
    newArrival: true,
    variants: [
      { formatType: "physical", price: 300, stock: 20 },
      { formatType: "digital", price: 150 },
    ],
  },
  {
    slug: "golposhomogro-1",
    title: "গল্পসমগ্র: প্রথম খণ্ড",
    titleEn: "Collected Stories, Volume One",
    author: "রুদ্র চৌধুরী (ডেমো)",
    publisher: "পাতা প্রকাশনী",
    year: 2020,
    pages: 560,
    language: "bn",
    description:
      "দুই দশকের বাছাই করা ছাপ্পান্নটি গল্পের সংকলন — প্রথম খণ্ড। (ডেমো বই — কাল্পনিক রচনা)",
    categories: ["golpo"],
    coverPattern: "mustard",
    featured: true,
    variants: [{ formatType: "physical", price: 780, stock: 9 }],
  },
];

async function main() {
  console.log("Seeding PATA demo data…");

  // Store settings
  await db.storeSetting.upsert({
    where: { id: "main" },
    update: {},
    create: {
      id: "main",
      announcement: "দেশজুড়ে বই পৌঁছে দিই — ঢাকার ভিতরে ২–৪ দিনে",
      announcementEnabled: true,
      aboutText: "পাতা একটি স্বাধীন বইয়ের দোকান — হার্ড কপি, PDF ও বান্ডেল, তিন ফরম্যাটেই সাবধানে বাছাই করা বই।",
    },
  });

  // Categories
  const catIds: Record<string, string> = {};
  for (const [i, c] of CATEGORIES.entries()) {
    const cat = await db.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, nameEn: c.nameEn, description: c.description, sortOrder: i },
      create: { ...c, sortOrder: i },
    });
    catIds[c.slug] = cat.id;
  }

  // Demo PDF assets (self-authored generated content)
  const { mkdirSync, writeFileSync } = await import("node:fs");
  mkdirSync("private-assets", { recursive: true });

  // Books
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@pata.test";
  let bookIndex = 0;
  for (const b of BOOKS) {
    bookIndex++;
    const digitalVariants = b.variants.filter((v) => v.formatType !== "physical");
    let digitalAssetId: string | null = null;
    if (digitalVariants.length > 0) {
      const fname = `demo-${b.slug}.pdf`;
      writeFileSync(`private-assets/${fname}`, makeDemoPdf(b.titleEn, demoChapters(b.titleEn)));
      const existing = await db.asset.findFirst({ where: { kind: "private_pdf", storagePath: fname } });
      digitalAssetId =
        existing?.id ??
        (
          await db.asset.create({
            data: {
              kind: "private_pdf",
              storageProvider: "local",
              bucket: "private-assets",
              storagePath: fname,
              originalFilename: `${b.slug}-demo.pdf`,
              mimeType: "application/pdf",
              sizeBytes: 0,
              isPrivate: true,
              rightsConfirmedAt: new Date(),
              rightsConfirmedBy: "seed (demo content, self-authored)",
            },
          })
        ).id;
    }

    const product = await db.product.upsert({
      where: { slug: b.slug },
      update: {},
      create: {
        slug: b.slug,
        title: b.title,
        titleEn: b.titleEn,
        subtitle: b.subtitle ?? null,
        authorDisplay: b.author,
        publisher: b.publisher,
        language: b.language,
        publicationYear: b.year,
        pageCount: b.pages,
        binding: b.variants.some((v) => v.formatType !== "digital") ? "হার্ডকভার" : null,
        edition: "প্রথম সংস্করণ",
        isbn: `978-984-DEMO-${String(bookIndex).padStart(2, "0")}-X`,
        description: b.description,
        status: "published",
        featured: b.featured ?? false,
        newArrival: b.newArrival ?? false,
        editorPick: b.editorPick ?? false,
        coverPattern: b.coverPattern,
        seoTitle: `${b.title} — ${b.author}`,
        seoDescription: b.description.slice(0, 155),
      },
    });

    for (const c of b.categories) {
      await db.productCategory.upsert({
        where: { productId_categoryId: { productId: product.id, categoryId: catIds[c] } },
        update: {},
        create: { productId: product.id, categoryId: catIds[c] },
      });
    }

    let vOrder = 0;
    for (const v of b.variants) {
      vOrder++;
      const existingVariant = await db.productVariant.findFirst({ where: { productId: product.id, formatType: v.formatType } });
      const data = {
        productId: product.id,
        formatType: v.formatType,
        priceMinor: v.price * 100,
        compareAtPriceMinor: v.compareAt ? v.compareAt * 100 : null,
        currency: "BDT",
        isActive: true,
        stockOnHand: v.formatType === "digital" ? null : v.stock ?? 0,
        weightGrams: v.formatType === "digital" ? null : 300 + vOrder * 50,
        digitalAssetId: v.formatType === "physical" ? null : digitalAssetId,
        downloadLimit: v.formatType === "physical" ? null : 5,
        downloadExpiryDays: v.formatType === "physical" ? null : 365,
        rightsConfirmedAt: v.formatType === "physical" ? null : new Date(),
        rightsConfirmedBy: v.formatType === "physical" ? null : "seed (demo content, self-authored)",
        sortOrder: vOrder,
        sku: `${b.slug.slice(0, 14).toUpperCase()}-${v.formatType.slice(0, 3).toUpperCase()}`,
      };
      if (existingVariant) {
        await db.productVariant.update({ where: { id: existingVariant.id }, data });
      } else {
        await db.productVariant.create({ data });
      }
    }
    console.log(`  ✓ ${b.title}`);
  }

  // Collections
  const editorBooks = BOOKS.filter((b) => b.editorPick).map((b) => b.slug);
  const newBooks = BOOKS.filter((b) => b.newArrival).map((b) => b.slug);

  const col1 = await db.collection.upsert({
    where: { slug: "shompodoker-pochondro" },
    update: { title: "সম্পাদকের পছন্দ", description: "এই সপ্তাহে আমাদের সম্পাদকের হাতে বেছে নেওয়া বই।", isActive: true },
    create: { slug: "shompodoker-pochondro", title: "সম্পাদকের পছন্দ", description: "এই সপ্তাহে আমাদের সম্পাদকের হাতে বেছে নেওয়া বই।", sortOrder: 0, isActive: true },
  });
  const col2 = await db.collection.upsert({
    where: { slug: "notun-prokashona" },
    update: { title: "নতুন প্রকাশনা", description: "সদ্য প্রকাশিত বইগুলো এক জায়গায়।", isActive: true },
    create: { slug: "notun-prokashona", title: "নতুন প্রকাশনা", description: "সদ্য প্রকাশিত বইগুলো এক জায়গায়।", sortOrder: 1, isActive: true },
  });
  for (const [col, slugs] of [
    [col1, editorBooks],
    [col2, newBooks],
  ] as const) {
    for (const [i, s] of slugs.entries()) {
      const p = await db.product.findUnique({ where: { slug: s } });
      if (!p) continue;
      await db.collectionProduct.upsert({
        where: { collectionId_productId: { collectionId: col.id, productId: p.id } },
        update: { sortOrder: i },
        create: { collectionId: col.id, productId: p.id, sortOrder: i },
      });
    }
  }

  // Coupon
  await db.coupon.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: {
      code: "WELCOME10",
      description: "প্রথম কেনাকাটায় ১০% ছাড় (সর্বনিম্ন ৳৫০০ কেনাকাটায়)",
      discountType: "percent",
      discountValue: 10,
      minSpendMinor: 50000,
      maxDiscountMinor: 15000,
      startsAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      endsAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      isActive: true,
    },
  });

  // Admin + demo customer
  const adminPassword = process.env.ADMIN_PASSWORD ?? "pata-admin-123";
  const admin = await db.user.upsert({
    where: { email: adminEmail },
    update: { role: "admin", passwordHash: hashPassword(adminPassword) },
    create: { email: adminEmail, name: "PATA Admin (ডেমো)", passwordHash: hashPassword(adminPassword), role: "admin" },
  });
  const customerEmail = process.env.DEMO_CUSTOMER_EMAIL ?? "customer@pata.test";
  const customer = await db.user.upsert({
    where: { email: customerEmail },
    update: { passwordHash: hashPassword("pata-customer-123") },
    create: { email: customerEmail, name: "দর্শনা আহমেদ (ডেমো)", passwordHash: hashPassword("pata-customer-123"), role: "customer", phone: "01712345678" },
  });
  console.log(`Admin: ${admin.email} / (password from ADMIN_PASSWORD or documented dev default)`);
  console.log(`Demo customer: ${customer.email}`);

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
