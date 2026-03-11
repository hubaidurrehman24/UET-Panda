const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");

function getSummary(file) {
    const wb = XLSX.readFile(path.join("public", "data", file));
    const result = {
        file,
        sheets: wb.SheetNames,
        dealsFound: []
    };
    
    wb.SheetNames.forEach(sheetName => {
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 });
        rows.forEach(r => {
            if (r[0] && String(r[0]).toLowerCase().includes("deal")) {
                result.dealsFound.push({
                    sheet: sheetName,
                    name: r[0],
                    price: r[1]
                });
            }
        });
    });
    return result;
}

const summary = ["Cafe1.xlsx", "Cafe2.xlsx", "Cafe3.xlsx", "Cafe4.xlsx"].map(getSummary);
fs.writeFileSync("tmp_deals_summary.json", JSON.stringify(summary, null, 2));
console.log("Summary written to tmp_deals_summary.json");
