
const ExcelJS = require('exceljs');
const path = require('path');

const files = ['Bhola Cafe.xlsx', 'GSSC.xlsx', 'BSSC.xlsx'];
const dataPath = 'C:\\Users\\hubai\\OneDrive\\Desktop\\UET-Panda\\public\\data';

async function examine() {
  for (const filename of files) {
    console.log(`\n\n=== EXAMINING: ${filename} ===`);
    const workbook = new ExcelJS.Workbook();
    try {
      await workbook.xlsx.readFile(path.join(dataPath, filename));
    } catch (e) {
      console.error(`Failed to read ${filename}: ${e.message}`);
      continue;
    }
    
    workbook.eachSheet((worksheet, sheetId) => {
      console.log(`\n[Sheet: ${worksheet.name}]`);
      
      const images = worksheet.getImages() || [];
      console.log(`Found ${images.length} images.`);
      
      images.slice(0, 5).forEach((img, idx) => {
        if (img && img.range) {
          const tl = img.range.tl;
          if (tl) {
            console.log(`  Image ${idx + 1}: TopLeft Row=${tl.nativeRow + 1}, Col=${tl.nativeCol + 1}`);
          }
        }
      });

      console.log(`\nRows Analysis:`);
      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber <= 30) {
          const values = row.values.slice(1);
          console.log(`  Row ${rowNumber}: ${JSON.stringify(values)}`);
        }
      });
    });
  }
}

examine().catch(console.error);
