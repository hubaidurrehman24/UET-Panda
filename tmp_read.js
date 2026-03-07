const XLSX = require('xlsx');

const files = ['Cafe1.xlsx','Cafe2.xlsx','Cafe3.xlsx','Cafe4.xlsx'];

files.forEach(f => {
  const wb = XLSX.readFile('public/data/' + f);
  console.log('\n\n============================');
  console.log('FILE:', f);
  console.log('============================');
  wb.SheetNames.forEach(sheetName => {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 });
    const nonEmpty = rows.filter(r => r.some(c => c !== null && c !== undefined && c !== ''));
    console.log('\n  SHEET: "' + sheetName + '" | ' + nonEmpty.length + ' non-empty rows');
    nonEmpty.slice(0, 25).forEach((r, i) => console.log('    row' + i + ':', JSON.stringify(r)));
  });
});
