const XLSX = require("xlsx");
const path = require("path");

const clean = (s) => String(s || "").trim().replace(/\s+/g, " ");
const toTitleCase = (s) => clean(s).replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
const isHeader = (name) => {
  if (!name) return true;
  const headers = [
    "items", "prices", "price", "serving", "deal", "sides", "charges",
    "egg", "pizza", "chinese", "fast food", "gravies", "rice", "regular fried items",
    "hot menu", "samosa variety", "fried items", "fresh shake", "fresh juices",
    "coffee", "parathas", "sandwiches", "salads", "drinks", "snacks",
    "starter", "soup", "desi", "breakfast",
  ];
  return headers.some((h) => clean(name).toLowerCase() === h) || (typeof name === "object");
};

const makeItem = (name, price, cafeId, cafeName, category, serving = null) => ({ name: toTitleCase(name), price: Number(price) });

const sheetToCategory = { "Desi": "desi", "Chinese": "chinese", "Fast Food": "fast-food", "Deals": "deals" };

function parseSheet(rows, sheetName, cafeId, cafeName) {
  const items = [];
  const baseCat = sheetToCategory[sheetName] || "desi";
  let currentSubCat = baseCat;
  let currentParentName = null;
  const subCatMap = { "pizza": "fast-food", "starter": "snacks", "soup": "desi", "gravies+egg rice": "chinese", "rice": "chinese", "deals": "deals", "chinese": "chinese" };

  for (const row of rows) {
    const col0 = clean(row[0]);
    const col1 = row[1];
    const col2 = row[2];

    const colLow = col0.toLowerCase();
    if (subCatMap[colLow] !== undefined) {
      currentSubCat = subCatMap[colLow];
      currentParentName = null;
      continue;
    }

    const effectiveCat = currentSubCat || baseCat;

    if (col0 && !isHeader(col0)) {
      const isEggHeader = col0.toLowerCase().includes("egg") && !col1;
      if (!isEggHeader) {
        if (typeof col1 === "string" && col1.includes('"')) {
          const price = typeof col2 === "number" ? col2 : null;
          if (price) items.push(makeItem(`${col0} (${col1})`, price, cafeId, cafeName, effectiveCat, col1));
          currentParentName = col0;
        } else if (typeof col1 === "number") {
          items.push(makeItem(col0, col1, cafeId, cafeName, effectiveCat));
          currentParentName = col0;
          if (typeof col2 === "string" && col2.includes("full")) {
            const fullPrice = parseInt(col2.split("-")[0].trim());
            items.push(makeItem(`${col0} (Large)`, fullPrice, cafeId, cafeName, effectiveCat, "Large"));
          }
        } else if (typeof col1 === "string" && col1.includes("half")) {
          const halfP = parseInt(col1.split("-")[0].trim());
          const fullP = typeof col2 === "string" ? parseInt(col2.split("-")[0].trim()) : null;
          items.push(makeItem(`${col0} (Regular)`, halfP, cafeId, cafeName, effectiveCat, "Regular"));
          if (fullP) items.push(makeItem(`${col0} (Large)`, fullP, cafeId, cafeName, effectiveCat, "Large"));
        } else {
            console.log("SKIPPED col0:", col0, "col1:", col1, "col2:", col2);
        }
      }
    }

    if (!col0 && col1 && currentParentName) {
      if (typeof col1 === "string" && col1.includes('"')) {
        if (typeof col2 === "number") {
          items.push(makeItem(`${currentParentName} (${col1})`, col2, cafeId, cafeName, effectiveCat, col1));
        }
      } else if (typeof col1 === "number") {
        items.push(makeItem(`${currentParentName} (Large)`, col1, cafeId, cafeName, effectiveCat, "Large"));
      } else {
          console.log("SKIPPED SIZE col0:", col0, "col1:", col1, "col2:", col2, "parent:", currentParentName);
      }
    }
    if (!col0 && typeof col1 === "string" && col1.toLowerCase().includes("large") && typeof col2 === "number" && currentParentName) {
      items.push(makeItem(`${currentParentName} (${col1})`, col2, cafeId, cafeName, effectiveCat, col1));
    }
  }
  return items;
}

const wb = XLSX.readFile("public/data/Cafe1.xlsx");
let sum = 0;
for (const sheetName of wb.SheetNames) {
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 });
  const nonEmpty = rows.filter((r) => r.some((c) => c !== null && c !== undefined && c !== ""));
  const parsed = parseSheet(nonEmpty, sheetName, "cafe1", "Cafe 1");
  console.log(sheetName, parsed.length);
  sum += parsed.length;
}
console.log("Total:", sum);
