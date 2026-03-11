const XLSX = require("xlsx");
const path = require("path");

function getSummary(file) {
    const wb = XLSX.readFile(path.join("public", "data", file));
    console.log(`\n--- Summary of ${file} ---`);
    console.log(`Sheet Names: ${wb.SheetNames.join(", ")}`);
    
    wb.SheetNames.forEach(sheetName => {
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 });
        const dealRows = rows.filter(r => r[0] && String(r[0]).toLowerCase().includes("deal"));
        if (dealRows.length > 0) {
            console.log(`  Sheet "${sheetName}" has ${dealRows.length} rows containing the word 'deal':`);
            dealRows.slice(0, 5).forEach(r => console.log(`    - ${r[0]} | ${r[1]}`));
        }
    });
}

["Cafe1.xlsx", "Cafe2.xlsx", "Cafe3.xlsx", "Cafe4.xlsx"].forEach(getSummary);
