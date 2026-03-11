/**
 * UET Panda — Menu Seed Script
 * Run: node scripts/seed.js
 * 
 * Reads the 4 Excel files from public/data/ and pushes
 * all menu items to Realtime Database under the "products" node.
 */

const { initializeApp, cert } = require("firebase-admin/app");
const { getDatabase } = require("firebase-admin/database");
const XLSX = require("xlsx");
const path = require("path");

// ─── 1. Load your Firebase service account key ───────────────────────────────
// Download from: Firebase Console → Project Settings → Service Accounts → Generate new private key
// Place the downloaded JSON at: scripts/serviceAccountKey.json
const serviceAccount = require("./serviceAccountKey.json");

initializeApp({ 
  credential: cert(serviceAccount),
  databaseURL: "https://uet-panda-1c0e4-default-rtdb.asia-southeast1.firebasedatabase.app" // Your RTDB URL
});

const db = getDatabase();

// ─── 2. Helpers ──────────────────────────────────────────────────────────────
const clean = (s) =>
  String(s || "")
    .trim()
    .replace(/\s+/g, " ");

const toTitleCase = (s) =>
  clean(s).replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

const isHeader = (name) => {
  if (!name) return true;
  const headers = [
    "items", "prices", "price", "serving", "deal", "sides", "charges",
    "egg", "pizza", "chinese", "fast food", "gravies", "rice", "regular fried items",
    "hot menu", "samosa variety", "fried items", "fresh shake", "fresh juices",
    "coffee", "parathas", "sandwiches", "salads", "drinks", "snacks",
    "starter", "soup", "desi", "breakfast",
  ];
  return headers.some((h) => clean(name).toLowerCase() === h) ||
    (typeof name === "object");
};

const makeItem = (name, price, cafeId, cafeName, category, serving = null) => {
  const encodedName = encodeURIComponent(name);
  return {
    name: toTitleCase(name),
    price: Number(price),
    cafeId,
    cafeName,
    category,
    serving: serving || "Single",
    description: "",
    image: `https://placehold.jp/32/ffd700/002366/600x400.png?text=${encodedName}`,
    isHidden: false,
    createdAt: new Date().toISOString(),
  };
};

// ─── 3. Category assignment logic ─────────────────────────────────────────────
const sheetToCategory = {
  // Cafe 1
  "Desi": "desi",
  "Chinese": "chinese",
  "Fast Food": "fast-food",
  "Deals": "deals",
  // Cafe 2
  "fast food + breakfast": "fast-food",  // split internally
  "desi": "desi",
  "chinese": "chinese",
  "salads + fried items": "snacks",
  "drinks": "drinks",
  "snacks ": "snacks",
  // Cafe 3
  "Fast food": "fast-food",
  "menu": "desi",
  "chineese": "chinese",
  // Cafe 4
  "menu": "desi",
  "salads + fried items": "snacks",
  "fast food + breakfast": "fast-food",
  "snacks ": "snacks",
  "chinese": "chinese",
};

// ─── 4. Parse each row into structured items  ─────────────────────────────────
function parseSheet(rows, sheetName, cafeId, cafeName) {
  const items = [];
  const baseCat = sheetToCategory[sheetName] || "desi";
  let currentSubCat = baseCat;
  let currentParentName = null;
  let lastItemRef = null;

  // Sub-category markers inside sheets
  const subCatMap = {
    "pizza": "fast-food",
    "starter": "snacks",
    "soup": "desi",
    "gravies+egg rice": "chinese",
    "rice": "chinese",
    "fresh shake": "drinks",
    "fresh juices": "drinks",
    "coffee": "drinks",
    "hot menu": "drinks",
    "samosa variety": "snacks",
    "fried items": "snacks",
    "parathas": "breakfast",
    "sandwiches": "fast-food",
    "breakfast": "breakfast",
    "deals": "deals",
    "hot deals": "deals",
    "deal": "deals",
    "snacks": "snacks",
    "salads": "snacks",
    "chinese": "chinese",
    "anda bhurji section": "breakfast",
  };

  for (const row of rows) {
    const col0 = clean(row[0]);
    const col1 = row[1];
    const col2 = row[2];
    const col4 = row[4]; // sides column
    const col5 = row[5]; // sides price

    // ── Detect sub-category headers ──────────────────────────────────────────
    const colLow = col0.toLowerCase();
    if (subCatMap[colLow] !== undefined) {
      currentSubCat = subCatMap[colLow];
      currentParentName = null;
      continue;
    }

    const effectiveCat = currentSubCat || baseCat;

    // ── Main item (col0 = name, col1 = price or serving, col2 = price?) ──────
    if (col0 && !isHeader(col0)) {
      const isEggHeader = col0.toLowerCase().includes("egg") && !col1;

      if (!isEggHeader) {
        // Handle multi-size rows (e.g. Pizza - Small/Medium/Large)
        if (typeof col1 === "string" && col1.includes('"')) {
          // col1 = serving label, col2 = price
          const price = typeof col2 === "number" ? col2 : null;
          if (price) {
            items.push(makeItem(`${col0} (${col1})`, price, cafeId, cafeName, effectiveCat, col1));
          }
          currentParentName = col0;
        } else if (typeof col1 === "number") {
          // Normal: col0=name, col1=price
          const newItem = makeItem(col0, col1, cafeId, cafeName, effectiveCat);
          items.push(newItem);
          currentParentName = col0;

          // If this is a deal, track it for potential multi-row details
          if (effectiveCat === "deals") {
            lastItemRef = newItem;
          } else {
            lastItemRef = null;
          }

          // Dual size soup ("150 - half", "450 - full")
          if (typeof col2 === "string" && col2.includes("full")) {
            const fullPrice = parseInt(col2.split("-")[0].trim());
            items.push(makeItem(`${col0} (Large)`, fullPrice, cafeId, cafeName, effectiveCat, "Large"));
            items[items.length - 2].name = toTitleCase(`${col0} (Regular)`);
            items[items.length - 2].serving = "Regular";
          }
        } else if (typeof col1 === "string" && typeof col2 === "number") {
          // Case for Cafe 1 Deals: col0=name, col1="Deal", col2=price
          const newItem = makeItem(col0, col2, cafeId, cafeName, effectiveCat, col1);
          items.push(newItem);
          currentParentName = col0;
          if (effectiveCat === "deals") lastItemRef = newItem;
        } else if (typeof col1 === "string" && col1.includes("half")) {
          // Soup dual-price row
          const halfP = parseInt(col1.split("-")[0].trim());
          const fullP = typeof col2 === "string" ? parseInt(col2.split("-")[0].trim()) : null;
          items.push(makeItem(`${col0} (Regular)`, halfP, cafeId, cafeName, effectiveCat, "Regular"));
          if (fullP) items.push(makeItem(`${col0} (Large)`, fullP, cafeId, cafeName, effectiveCat, "Large"));
        }
      }
    }

    // ── Null or text-only first column = detail/variant ──────────────────────
    if (!col1 && col0 && lastItemRef) {
      // row contains deal details like "1 fries", "1 zinger"
      const currentDesc = lastItemRef.description || "";
      lastItemRef.description = currentDesc ? `${currentDesc}, ${col0}` : col0;
      continue; // Don't process as normal item
    }

    if (!col0 && col1 && currentParentName) {
      if (typeof col1 === "string" && col1.includes('"')) {
        // e.g. col1 = 'Medium (10")', col2 = 750
        if (typeof col2 === "number") {
          items.push(makeItem(`${currentParentName} (${col1})`, col2, cafeId, cafeName, effectiveCat, col1));
        }
      } else if (typeof col1 === "number") {
        items.push(makeItem(`${currentParentName} (Large)`, col1, cafeId, cafeName, effectiveCat, "Large"));
      }
    }

    // Check multi-size rows where col1 is like "Small (7\")", col2 is price
    if (!col0 && typeof col1 === "string" && col1.toLowerCase().includes("large") && typeof col2 === "number" && currentParentName) {
      items.push(makeItem(`${currentParentName} (${col1})`, col2, cafeId, cafeName, effectiveCat, col1));
    }

    // ── Sides column (Cafe2 + Cafe4) ─────────────────────────────────────────
    if (col4 && clean(col4) && !isHeader(col4) && typeof col5 === "number") {
      const sideClean = clean(col4);
      if (!["egg", "sides", "charges", "items"].includes(sideClean.toLowerCase())) {
        items.push(makeItem(sideClean, col5, cafeId, cafeName, "breakfast", "Single"));
      }
    }
  }

  return items;
}

// ─── 5. Main seeder ──────────────────────────────────────────────────────────
const FILES = [
  { file: "Cafe1.xlsx", cafeId: "cafe1", cafeName: "Cafe 1" },
  { file: "Cafe2.xlsx", cafeId: "cafe2", cafeName: "Cafe 2" },
  { file: "Cafe3.xlsx", cafeId: "cafe3", cafeName: "Cafe 3" },
  { file: "Cafe4.xlsx", cafeId: "cafe4", cafeName: "Cafe 4" },
];

async function seed() {
  let totalPushed = 0;
  const productsRef = db.ref("products");
  console.log("🧹 Clearing old products...");
  await productsRef.remove();

  for (const { file, cafeId, cafeName } of FILES) {
    console.log(`\n📂 Processing ${file}...`);
    const wb = XLSX.readFile(path.join("public", "data", file));
    let cafeItems = [];

    for (const sheetName of wb.SheetNames) {
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 });
      const nonEmpty = rows.filter((r) => r.some((c) => c !== null && c !== undefined && c !== ""));
      const parsed = parseSheet(nonEmpty, sheetName, cafeId, cafeName);
      console.log(`   Sheet "${sheetName}": ${parsed.length} items`);
      cafeItems.push(...parsed);
    }

    // Deduplicate by name+cafeId
    const seen = new Set();
    cafeItems = cafeItems.filter((item) => {
      const key = `${item.cafeId}||${item.name.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Write to Firebase Realtime Database
    const BATCH_SIZE = 400;
    for (let i = 0; i < cafeItems.length; i += BATCH_SIZE) {
      const updates = {};
      cafeItems.slice(i, i + BATCH_SIZE).forEach((item) => {
        const newRef = productsRef.push();
        updates[newRef.key] = item;
      });
      await productsRef.update(updates);
    }

    console.log(`   ✅ ${cafeName}: ${cafeItems.length} unique items pushed`);
    totalPushed += cafeItems.length;
  }

  console.log(`\n🎉 Done! Total items pushed: ${totalPushed}`);
  process.exit(0);
}

seed().catch((e) => {
  console.error("❌ Error:", e.message);
  process.exit(1);
});
