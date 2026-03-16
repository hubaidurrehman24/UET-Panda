
const XLSX = require('xlsx');
const path = require('path');

const files = ['Bhola Cafe.xlsx', 'GSSC.xlsx', 'BSSC.xlsx'];
const dataPath = 'C:\\Users\\hubai\\OneDrive\\Desktop\\UET-Panda\\public\\data';

async function readExcels() {
  for (const filename of files) {
    console.log(`\n================================`);
    console.log(`FILE: ${filename}`);
    console.log(`================================`);
    const workbook = XLSX.readFile(path.join(dataPath, filename));
    
    workbook.SheetNames.forEach(sheetName => {
      console.log(`\n[SHEET: ${sheetName}]`);
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
      
      if (jsonData.length > 0) {
        console.log(`Items found: ${jsonData.length}`);
        jsonData.forEach((row, index) => {
          // Log item name and price for mapping
          const itemName = row['Items'] || row['Item Name'] || row['Name'] || Object.values(row)[0];
          const price = row['Prices (PKR)'] || row['Price'] || row['Prices'] || Object.values(row)[1];
          console.log(`${index + 1}. ${itemName} - Rs. ${price}`);
        });
      } else {
        console.log('Sheet is empty.');
      }
    });
  }
}

readExcels();
