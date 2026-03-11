const XLSX = require("xlsx");
const path = require("path");

const sheetToCategory = {
  "Desi": "desi", "Chinese": "chinese", "Fast Food": "fast-food", "Deals": "deals",
  "fast food + breakfast": "fast-food", "desi": "desi", "chinese": "chinese",
  "salads + fried items": "snacks", "drinks": "drinks", "snacks ": "snacks",
  "Fast food": "fast-food", "menu": "desi", "chineese": "chinese",
  "menu": "desi", "salads + fried items": "snacks", "fast food + breakfast": "fast-food",
  "snacks ": "snacks", "chinese": "chinese"
};

const subCatMap = { "deals": "deals" };

function checkDeals(file, cafeId) {
    const wb = XLSX.readFile(path.join("public", "data", file));
    const deals = [];
    wb.SheetNames.forEach(sheetName => {
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 });
        let isDealsSection = sheetToCategory[sheetName] === "deals";
        
        rows.forEach(row => {
            const col0 = String(row[0] || "").trim().toLowerCase();
            if (subCatMap[col0] === "deals") isDealsSection = true;
            else if (col0 && col0 !== "deals" && isDealsSection) {
                // If we hit another subcat header, we might stop, but seed.js keeps going until next subCatMap match
            }

            if (isDealsSection && row[0] && row[1]) {
                const name = String(row[0]).trim();
                if (!["items", "prices", "price", "deal", "deals"].includes(name.toLowerCase())) {
                    deals.push(name);
                }
            }
        });
    });
    return deals;
}

const FILES = [
  { file: "Cafe1.xlsx", id: "cafe1" },
  { file: "Cafe2.xlsx", id: "cafe2" },
  { file: "Cafe3.xlsx", id: "cafe3" },
  { file: "Cafe4.xlsx", id: "cafe4" },
];

FILES.forEach(f => {
    const deals = checkDeals(f.file, f.id);
    console.log(`Deals for ${f.id} (${f.file}):`);
    if (deals.length === 0) console.log("  None found.");
    else deals.slice(0, 10).forEach(d => console.log(`  - ${d}`));
    if (deals.length > 10) console.log(`  ... and ${deals.length - 10} more`);
});
