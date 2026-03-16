
const ExcelJS = require('exceljs');
const path = require('path');

const filePath = 'C:\\Users\\hubai\\OneDrive\\Desktop\\UET-Panda\\public\\data\\Bhola Cafe.xlsx';

async function examine() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  console.log('--- SHEETS FOUND ---');
  workbook.worksheets.forEach(ws => {
    console.log(`Sheet: ${ws.name}`);
  });

  for (const ws of workbook.worksheets) {
    console.log(`\n=== DATA FROM SHEET: ${ws.name} ===`);
    ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber <= 20) {
        console.log(`Row ${rowNumber}:`, JSON.stringify(row.values));
      }
    });

    console.log(`\n--- IMAGES IN SHEET: ${ws.name} ---`);
    const images = ws.getImages();
    console.log(`Total images: ${images.length}`);
    images.forEach((img, idx) => {
      if (idx < 5) {
        console.log(`Image ${idx}: ${JSON.stringify(img.range)}`);
      }
    });
  }
}

examine().catch(console.error);
