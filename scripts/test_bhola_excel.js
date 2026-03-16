const ExcelJS = require('exceljs');
const path = require('path');

async function checkBhola() {
  const exWb = new ExcelJS.Workbook();
  await exWb.xlsx.readFile(path.join(__dirname, '../public/data/Bhola Cafe.xlsx'));
  const sheet = exWb.worksheets[0]; // Assuming it's the first sheet
  
  const imageMap = {};
  for (const img of sheet.getImages()) {
    if (img.range && img.range.tl) {
      const row = img.range.tl.nativeRow;
      if (!imageMap[row]) imageMap[row] = 0;
      imageMap[row]++;
    }
  }
  console.log("Image Map rows:");
  console.log(Object.keys(imageMap).sort((a,b)=>a-b).map(k => `${k}: ${imageMap[k]} images`).join(', '));
  
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber >= 70 && rowNumber <= 90) {
      console.log(`Row ${rowNumber}:`, row.values);
    }
  });
}

checkBhola().catch(console.error);
