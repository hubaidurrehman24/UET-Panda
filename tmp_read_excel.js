
const XLSX = require('xlsx');
const path = require('path');

const files = ['Bhola Cafe.xlsx', 'GSSC.xlsx', 'BSSC.xlsx'];
const dataPath = 'C:\\Users\\hubai\\OneDrive\\Desktop\\UET-Panda\\public\\data';

async function readExcels() {
  for (const filename of files) {
    console.log(`\n--- READING FILE: ${filename} ---`);
    const workbook = XLSX.readFile(path.join(dataPath, filename));
    
    workbook.SheetNames.forEach(sheetName => {
      console.log(`\nSheet: ${sheetName}`);
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      if (jsonData.length > 0) {
        // Show first 5 rows to understand the structure
        console.log(`Rows: ${jsonData.length}`);
        console.log('Sample Data:');
        console.log(JSON.stringify(jsonData.slice(0, 5), null, 2));
      } else {
        console.log('Sheet is empty.');
      }
    });
  }
}

readExcels();
