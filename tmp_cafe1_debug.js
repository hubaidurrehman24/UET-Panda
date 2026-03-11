const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");

function debugCafe1Deals() {
    const filePath = path.join("public", "data", "Cafe1.xlsx");
    const wb = XLSX.readFile(filePath);
    const sheetName = "Deals";
    const sheet = wb.Sheets[sheetName];
    if (!sheet) {
        fs.writeFileSync("tmp_cafe1_debug.txt", "Sheet 'Deals' not found in Cafe1.xlsx");
        return;
    }
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    let output = `Analyzing sheet 'Deals' in Cafe1.xlsx (${rows.length} rows):\n`;
    rows.slice(0, 30).forEach((row, i) => {
        output += `Row ${i}: ${JSON.stringify(row)}\n`;
    });
    fs.writeFileSync("tmp_cafe1_debug.txt", output);
}

debugCafe1Deals();
