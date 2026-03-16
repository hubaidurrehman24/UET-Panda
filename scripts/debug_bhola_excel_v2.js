
const ExcelJS = require('exceljs');
const fs = require('fs');

const filePath = 'C:\\Users\\hubai\\OneDrive\\Desktop\\UET-Panda\\public\\data\\Bhola Cafe.xlsx';
const outputPath = 'C:\\Users\\hubai\\OneDrive\\Desktop\\UET-Panda\\bhola_debug_full.txt';

async function examine() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  let output = '';
  output += '--- SHEETS FOUND ---\n';
  workbook.worksheets.forEach(ws => {
    output += `Sheet: ${ws.name}\n`;
  });

  for (const ws of workbook.worksheets) {
    output += `\n=== DATA FROM SHEET: ${ws.name} ===\n`;
    ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      // Row.values is often [empty, col1, col2, ...]
      const values = row.values.slice(1); 
      output += `Row ${rowNumber}: ${JSON.stringify(values)}\n`;
    });

    output += `\n--- IMAGES IN SHEET: ${ws.name} ---\n`;
    const images = ws.getImages();
    output += `Total images: ${images.length}\n`;
    images.forEach((img, idx) => {
      output += `Image ${idx}: ${JSON.stringify(img.range)}\n`;
    });
  }

  fs.writeFileSync(outputPath, output);
  console.log('Analysis written to ' + outputPath);
}

examine().catch(err => {
    console.error('Error during examination:', err);
    process.exit(1);
});
