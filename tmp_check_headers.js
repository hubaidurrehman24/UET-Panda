
const XLSX = require('xlsx');
const path = require('path');

const files = ['GSSC.xlsx', 'BSSC.xlsx'];
const dataPath = 'C:\\Users\\hubai\\OneDrive\\Desktop\\UET-Panda\\public\\data';

async function checkHeaders() {
  for (const filename of files) {
    console.log(`\nHeader for ${filename}:`);
    const workbook = XLSX.readFile(path.join(dataPath, filename));
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    console.log(JSON.stringify(jsonData.slice(0, 3)));
  }
}

checkHeaders();
