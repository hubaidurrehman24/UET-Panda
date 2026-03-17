const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

async function checkAnnexe() {
  const exWb = new ExcelJS.Workbook();
  const filePath = path.join(__dirname, '../public/data/Annexe Cafe.xlsx');
  await exWb.xlsx.readFile(filePath);
  
  let output = [];
  
  for (const sheet of exWb.worksheets) {
    if (sheet.state === 'hidden') continue;
    output.push(`\n=== SHEET: ${sheet.name} ===`);
    let rowCount = 0;
    sheet.eachRow((row, rowNumber) => {
      rowCount++;
      if (rowNumber <= 20) {
        output.push(`Row ${rowNumber}: ` + JSON.stringify(row.values));
      }
    });
    output.push(`Total rows in sheet: ${rowCount}`);
  }
  
  fs.writeFileSync(path.join(__dirname, 'annexe_debug.txt'), output.join('\n'));
  console.log('Done, check annexe_debug.txt');
}

checkAnnexe().catch(console.error);
