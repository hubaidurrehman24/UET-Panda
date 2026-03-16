
const ExcelJS = require('exceljs');
const fs = require('fs');

const filePath = 'C:\\Users\\hubai\\OneDrive\\Desktop\\UET-Panda\\public\\data\\Bhola Cafe.xlsx';
const outputPath = 'C:\\Users\\hubai\\OneDrive\\Desktop\\UET-Panda\\bhola_debug_v3.txt';

async function examine() {
  const workbook = new ExcelJS.Workbook();
  try {
      console.log('Reading file...');
      await workbook.xlsx.readFile(filePath);
      console.log('File read successfully.');

      let output = '';
      output += '--- SHEETS FOUND ---\n';
      workbook.worksheets.forEach(ws => {
        output += `Sheet: ${ws.name}\n`;
      });

      for (const ws of workbook.worksheets) {
        output += `\n=== DATA FROM SHEET: ${ws.name} ===\n`;
        ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
          try {
            const values = Array.isArray(row.values) ? row.values.slice(1) : [];
            output += `Row ${rowNumber}: ${JSON.stringify(values)}\n`;
          } catch (e) {
            output += `Row ${rowNumber}: ERROR PARSING ROW VALUES: ${e.message}\n`;
          }
        });

        output += `\n--- IMAGES IN SHEET: ${ws.name} ---\n`;
        try {
            const images = ws.getImages();
            output += `Total images: ${images.length}\n`;
            images.forEach((img, idx) => {
              output += `Image ${idx}: ${JSON.stringify(img.range)}\n`;
            });
        } catch (e) {
            output += `ERROR GETTING IMAGES: ${e.message}\n`;
        }
      }

      fs.writeFileSync(outputPath, output);
      console.log('Analysis written to ' + outputPath);
  } catch (err) {
      console.error('CRITICAL ERROR DURING EXAMINATION:');
      console.error(err);
      process.exit(1);
  }
}

examine().catch(err => {
    console.error('Unhandled Rejection:', err);
    process.exit(1);
});
