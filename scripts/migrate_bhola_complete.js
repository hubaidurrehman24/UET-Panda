
const ExcelJS = require('exceljs');
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Absolute path to service account
const saPath = 'C:\\Users\\hubai\\OneDrive\\Desktop\\UET-Panda\\scripts\\serviceAccountKey.json';
const sa = JSON.parse(fs.readFileSync(saPath, 'utf8'));

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(sa),
    storageBucket: 'uet-panda-1c0e4.firebasestorage.app',
    databaseURL: 'https://uet-panda-1c0e4-default-rtdb.asia-southeast1.firebasedatabase.app'
  });
}

const db = admin.database();
const bucket = admin.storage().bucket();

const BHOLA_EXCEL = 'C:\\Users\\hubai\\OneDrive\\Desktop\\UET-Panda\\public\\data\\Bhola Cafe.xlsx';
const CAFE_ID = 'cafe1';

function getCategory(itemName) {
  const name = itemName.toLowerCase();
  if (name.includes('+') || name.includes('deal') || name.includes('hot deals')) return 'deals';
  if (name.includes('juice') || name.includes('shake') || name.includes('tea') || 
      name.includes('coffee') || name.includes('doodh') || name.includes('tang') || 
      name.includes('margarita') || name.includes('kehwa') || name.includes('cola')) return 'drinks';
  if (name.includes('chowmein') || name.includes('manchurian') || name.includes('rice') || 
      name.includes('drumsticks')) return 'chinese';
  if (name.includes('burger') || name.includes('pizza') || name.includes('zinger') || 
      name.includes('sandwich') || name.includes('panini') || name.includes('roll') || 
      name.includes('shawarma') || name.includes('pasta') || name.includes('lasagna')) return 'fast-food';
  if (name.includes('fries') || name.includes('nuggets') || name.includes('fried') || 
      name.includes('pakora') || name.includes('samosa') || name.includes('bhalla') || 
      name.includes('chaat')) return 'snacks';
  return 'desi';
}

async function uploadImage(imageBuffer, itemName) {
    if (!imageBuffer) return "";
    try {
        const filename = `food-images/${CAFE_ID}_${Date.now()}_${itemName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
        const file = bucket.file(filename);
        await file.save(imageBuffer, { 
            contentType: 'image/png',
            metadata: { cacheControl: 'public, max-age=31536000' }
        });
        await file.makePublic();
        return `https://storage.googleapis.com/${bucket.name}/${filename}`;
    } catch (e) {
        console.error(`Failed to upload image for ${itemName}: ${e.message}`);
        return "";
    }
}

async function migrate() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(BHOLA_EXCEL);
    console.log('Opened Bhola Excel.');

    const menuItems = [];

    function getImageForCell(row, col, images, wb) {
        const found = images.find(img => img.range.tl.nativeRow === row - 1);
        if (found) {
            const imageMetadata = wb.model.media[found.imageId];
            return imageMetadata ? imageMetadata.buffer : null;
        }
        return null;
    }

    const sheets = [
        { name: 'fastfood + fried items', startRow: 4 },
        { name: 'Menu', startRow: 3 },
        { name: 'Drinks', startRow: 3 },
        { name: 'Chinese', startRow: 3 }
    ];

    for (const sheetInfo of sheets) {
        const sheet = workbook.getWorksheet(sheetInfo.name);
        if (!sheet) continue;
        
        console.log(`Processing ${sheetInfo.name}...`);
        const images = sheet.getImages();
        let currentSection = '';

        sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            const values = row.values.slice(1);
            if (!values[0]) return;

            const nameStr = String(values[0]).toLowerCase();

            if (sheetInfo.name === 'fastfood + fried items') {
                if (rowNumber === 3) currentSection = 'pizza';
                else if (rowNumber === 19) currentSection = 'fried';
                else if (rowNumber === 30) currentSection = 'chaat';
                else if (rowNumber === 37) currentSection = 'burgers';
                else if (rowNumber === 50) currentSection = 'sandwich';
                else if (rowNumber === 54) currentSection = 'pasta';
                else if (rowNumber === 59) currentSection = 'roll';
                else if (rowNumber === 67) currentSection = 'loaded fries';
                else if (rowNumber === 71) currentSection = 'nuggets';
                else if (rowNumber === 77) currentSection = 'deals';
                
                if ([3, 19, 30, 37, 50, 54, 59, 67, 71, 77].includes(rowNumber)) return;
            }

            const buf = getImageForCell(rowNumber, 1, images, workbook);

            // Pizza multi-size
            if (currentSection === 'pizza' && rowNumber >= 4 && rowNumber <= 17) {
                const sizes = ['Small 8"', 'Medium 11"', 'Large 14"'];
                [values[1], values[2], values[3]].forEach((p, i) => {
                    if (p && p !== '-') {
                        menuItems.push({
                            name: `${values[0]} (${sizes[i]})`,
                            price: Number(p),
                            description: `Freshly baked ${values[0]} - ${sizes[i]} size`,
                            category: 'fast-food',
                            imageBuffer: buf
                        });
                    }
                });
                return;
            }

            // Pasta/Fries Small/Large
            if ((currentSection === 'pasta' || currentSection === 'loaded fries') && 
                (nameStr === 'small' || nameStr === 'large')) {
                const parent = currentSection === 'pasta' ? 'Chicken Cheese Pasta' : 'Loaded Fries';
                menuItems.push({
                    name: `${parent} (${nameStr})`,
                    price: Number(values[1]),
                    description: `${parent} - ${nameStr} portion`,
                    category: currentSection === 'pasta' ? 'fast-food' : (currentSection === 'loaded fries' ? 'snacks' : getCategory(parent)),
                    imageBuffer: buf
                });
                return;
            }

            // Hot Drinks
            if (sheetInfo.name === 'Drinks' && rowNumber >= 23 && rowNumber <= 30) {
                const sizes = ['Regular', 'Large'];
                [values[1], values[2]].forEach((p, i) => {
                    if (p && p !== '-') {
                        menuItems.push({
                            name: `${values[0]} (${sizes[i]})`,
                            price: Number(p),
                            description: `Hot ${values[0]} - ${sizes[i]}`,
                            category: 'drinks',
                            imageBuffer: buf
                        });
                    }
                });
                return;
            }

            // Standard Item
            if (rowNumber >= sheetInfo.startRow && values[1] && typeof values[1] === 'number') {
                menuItems.push({
                    name: values[0],
                    price: values[1],
                    description: `Delicious ${values[0]} from Bhola Cafe.`,
                    category: getCategory(values[0]),
                    imageBuffer: buf
                });
            }
        });
    }

    console.log(`Extracted ${menuItems.length} items. Uploading to Firebase...`);

    const finalData = {};
    for (const item of menuItems) {
        process.stdout.write('.');
        const url = await uploadImage(item.imageBuffer, item.name);
        const ref = db.ref(`menu/${CAFE_ID}`).push();
        finalData[ref.key] = {
            id: ref.key,
            name: item.name,
            price: item.price,
            category: item.category,
            description: item.description,
            image: url,
            cafeId: CAFE_ID,
            isHidden: false,
            createdAt: new Date().toISOString()
        };
    }
    console.log('\nUpload starting...');
    await db.ref(`menu/${CAFE_ID}`).set(finalData);
    console.log('Bhola Cafe re-migration SUCCESSFUL.');
    process.exit();
}

migrate().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
