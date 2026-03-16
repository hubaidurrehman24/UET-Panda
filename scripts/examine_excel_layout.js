
const ExcelJS = require('exceljs');
const path = require('path');

const files = ['Bhola Cafe.xlsx', 'GSSC.xlsx', 'BSSC.xlsx'];
const dataPath = 'C:\\Users\\hubai\\OneDrive\\Desktop\\UET-Panda\\public\\data';

async function examine() {
  for (const filename of files) {
    console.log(`\n\n=== EXAMINING: ${filename} ===`);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(path.join(dataPath, filename));
    
    workbook.eachSheet((worksheet, sheetId) => {
      console.log(`\nSheet Name: ${worksheet.name}`);
      
      // Look for images
      const images = worksheet.getImages();
      console.log(`Found ${images.length} images.`);
      
      images.slice(0, 3).forEach((img, idx) => {
        const range = img.range;
        console.log(`  Image ${idx + 1}: Anchor Type: ${img.type}, Range: R${range.tl.nativeRow + 1}C${range.tl.nativeCol + 1} to R${range.br.nativeRow + 1}C${range.br.nativeCol + 1}`);
      });

      // Sample first 5 rows
      console.log(`\nSample Rows:`);
      for (let i = 1; i <= 5; i++) {
        const row = worksheet.getRow(i);
        const values = row.values.slice(1); // skip empty idx 0
        if (values.length > 0) {
          console.log(`  Row ${i}: ${JSON.stringify(values)}`);
        }
      }
    });
  }
}

examine().catch(console.error);
