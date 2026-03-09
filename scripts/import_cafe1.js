const { initializeApp, cert } = require("firebase-admin/app");
const { getDatabase } = require("firebase-admin/database");
const XLSX = require("xlsx");
const path = require("path");
const serviceAccount = require("./serviceAccountKey.json");

if (!require("firebase-admin/app").getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
    databaseURL: "https://uet-panda-1c0e4-default-rtdb.asia-southeast1.firebasedatabase.app"
  });
}

const db = getDatabase();

const clean = (s) => String(s || "").trim().replace(/\s+/g, " ");
const toTitleCase = (s) => clean(s).replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
const isHeader = (name) => {
  if (!name) return true;
  const headers = [
    "items", "prices", "price", "serving", "deal", "sides", "charges",
    "egg", "pizza", "chinese", "fast food", "gravies", "rice", "regular fried items",
    "hot menu", "samosa variety", "fried items", "fresh shake", "fresh juices",
    "coffee", "parathas", "sandwiches", "salads", "drinks", "snacks",
    "starter", "soup", "desi", "breakfast", "extras", "burgers", "rolls",
    "loaded fries", "chicken piece", "chicken cheese pasta", "nuggets / wings", "sandwich"
  ];
  return headers.some((h) => clean(name).toLowerCase() === h) || (typeof name === "object");
};

const makeItem = (name, price, category, serving = "Single") => ({
  name: toTitleCase(name),
  price: Number(price),
  cafeId: "cafe1",
  cafeName: "Cafe 1",
  category,
  serving,
  description: "Freshly prepared from our campus kitchen.",
  image: `https://via.placeholder.com/400x300/002366/FFD700?text=${encodeURIComponent(toTitleCase(name))}`,
  isHidden: false,
  createdAt: new Date().toISOString(),
});

const sheetToCategory = { "Desi": "desi", "Chinese": "chinese", "Fast Food": "fast-food", "Deals": "deals" };

function parseSheet(rows, sheetName) {
  const items = [];
  const baseCat = sheetToCategory[sheetName] || "desi";
  let currentParentName = null;

  for (const row of rows) {
    const col0 = clean(row[0]);
    const col1 = row[1];
    const col2 = row[2];

    if (col0 && !isHeader(col0)) {
       // Regular row with name
       if (typeof col1 === "number") {
           // name, price
           items.push(makeItem(col0, col1, baseCat));
           currentParentName = col0;
       } else if ((typeof col1 === "string" || col1 == null) && typeof col2 === "number") {
           // name, serving, price
           items.push(makeItem(`${col0} (${col1 || 'Single'})`, col2, baseCat, col1 || 'Single'));
           currentParentName = col0;
       } else if (typeof col2 === "string" && col2.includes("full") && typeof col1 === "string") {
            const halfP = parseInt(col1.split("-")[0].trim());
            const fullP = parseInt(col2.split("-")[0].trim());
            items.push(makeItem(`${col0} (Regular)`, halfP, baseCat, "Regular"));
            items.push(makeItem(`${col0} (Large)`, fullP, baseCat, "Large"));
       }
    } else if (!col0 && col1 && typeof col2 === "number" && currentParentName) {
       // Size variant row
       items.push(makeItem(`${currentParentName} (${col1})`, col2, baseCat, col1));
    }
  }
  return items;
}

async function fixCafe1() {
  console.log("Reading Cafe1.xlsx...");
  const wb = XLSX.readFile(path.join("public", "data", "Cafe1.xlsx"));
  let cafeItems = [];

  for (const sheetName of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 });
    const nonEmpty = rows.filter((r) => r.some((c) => c !== null && c !== undefined && c !== ""));
    const parsed = parseSheet(nonEmpty, sheetName);
    console.log(`Sheet "${sheetName}": ${parsed.length} items`);
    cafeItems.push(...parsed);
  }

  // Deduplicate
  const seen = new Set();
  cafeItems = cafeItems.filter((item) => {
    const key = item.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(`Total unique items for Cafe 1: ${cafeItems.length}`);

  const productsRef = db.ref("products");
  
  // 1. Delete old cafe 1 items
  console.log("Fetching existing products...");
  const snapshot = await productsRef.once('value');
  const allProducts = snapshot.val() || {};
  const updates = {};
  
  let deletedCount = 0;
  for (const [key, val] of Object.entries(allProducts)) {
      if (val.cafeId === "cafe1") {
          updates[key] = null;
          deletedCount++;
      }
  }
  console.log(`Deleting ${deletedCount} old Cafe 1 items...`);
  
  // 2. Add new items
  cafeItems.forEach((item) => {
    const newRef = productsRef.push();
    updates[newRef.key] = item;
  });
  
  await productsRef.update(updates);
  console.log(`Added ${cafeItems.length} new Cafe 1 items.`);
  console.log("Done!");
  process.exit(0);
}

fixCafe1().catch(e => { console.error(e); process.exit(1); });
