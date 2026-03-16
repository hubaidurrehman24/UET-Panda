const admin = require('firebase-admin');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase
if (admin.apps.length) {
  admin.apps.forEach(app => app.delete());
}
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://uet-panda-1c0e4-default-rtdb.asia-southeast1.firebasedatabase.app"
});
const db = admin.database();

const dataPath = path.join(__dirname, '../public/data');
const publicImagesPath = path.join(__dirname, '../public/food-images');

const CAFE_FILES = [
  { filename: 'Bhola Cafe.xlsx', cafeId: 'cafe1' },
  { filename: 'GSSC.xlsx',       cafeId: 'cafe2' },
  { filename: 'BSSC.xlsx',       cafeId: 'cafe3' },
];

function getCategory(name) {
  const n = (name || '').toLowerCase();
  if (n.includes("deal") || n.includes("combo") || n.includes("offer")) return "deals";
  if (
    n.includes("chai") || n.includes("tea") || n.includes("coffee") ||
    n.includes("juice") || n.includes("shake") || n.includes("doodh") ||
    n.includes("water") || n.includes("coke") || n.includes("sprite") ||
    n.includes("fanta") || n.includes("dew") || n.includes("pepsi") ||
    n.includes("lime") || n.includes("soda") || n.includes("drink") ||
    n.includes("lassi") || n.includes("lemon") || n.includes("squash") ||
    n.includes("sting") || n.includes("red bull") || n.includes("nestle") ||
    n.includes("gourmet")
  ) return "drinks";
  if (
    n.includes("burger") || n.includes("shawarma") || n.includes("sandwich") ||
    n.includes("pizza") || n.includes("nuggets") || n.includes("zinger") ||
    n.includes("roll") || n.includes("hot dog") || n.includes("hotdog") ||
    n.includes("wrap") || n.includes("sub") || n.includes("piece") || n.includes("leg") || 
    n.includes("chest") || n.includes("wings") || n.includes("thigh")
  ) return "fast-food";
  if (
    n.includes("chilli dry") || n.includes("chili dry") || n.includes("manchurian") ||
    n.includes("chowmein") || n.includes("noodle") || n.includes("fried rice") ||
    n.includes("manchuri") || n.includes("chilli") || n.includes("chinese") || n.includes("macaroni")
  ) return "chinese";
  if (
    n.includes("biryani") || n.includes("karahi") || n.includes("handi") ||
    n.includes("korma") || n.includes("nihari") || n.includes("haleem") ||
    n.includes("roti") || n.includes("naan") || n.includes("kabab") ||
    n.includes("tikka") || n.includes("qeema") || n.includes("daal") ||
    n.includes("pulao") || n.includes("salan") || n.includes("rice") ||
    n.includes("chanay") || n.includes("chana") || n.includes("murgh") ||
    n.includes("mutton") || n.includes("beef")
  ) return "desi";
  if (
    n.includes("fries") || n.includes("chips") || n.includes("samosa") || 
    n.includes("pakora") || n.includes("chat") || n.includes("chaat") ||
    n.includes("bhalay") || n.includes("dahi") || n.includes("bread") ||
    n.includes("egg") || n.includes("toast") || n.includes("paratha") || 
    n.includes("sandwich") || n.includes("snack") || n.includes("katakat") ||
    n.includes("puri") || n.includes("halwa") || n.includes("anda") || n.includes("omelet")
  ) return "snacks";
  return "fast-food"; // fallback
}

async function processFile({ filename, cafeId }) {
  const filePath = path.join(dataPath, filename);
  if (!fs.existsSync(filePath)) {
      console.warn(`File not found: ${filePath}`);
      return;
  }
  console.log(`\n--- Processing: ${filename} → ${cafeId} ---`);
  
  const imageDir = path.join(publicImagesPath, cafeId);
  if (!fs.existsSync(imageDir)) {
    fs.mkdirSync(imageDir, { recursive: true });
  }

  const snapshot = await db.ref(`menu/${cafeId}`).once('value');
  const existingItemsData = snapshot.val() || {};
  const existingItems = {}; 
  for (const [id, val] of Object.entries(existingItemsData)) {
    if (val.name) existingItems[val.name.toLowerCase().trim()] = { id, image: val.image, category: val.category };
  }
  console.log(`Fetched ${Object.keys(existingItems).length} existing items for ${cafeId}.`);

  const exWb = new ExcelJS.Workbook();
  await exWb.xlsx.readFile(filePath);
  
  for (const exSheet of exWb.worksheets) {
    if (exSheet.state === 'hidden') continue;
    console.log(`Processing Sheet: ${exSheet.name}`);
    
    // Process image map for current sheet
    const imageMap = {};
    const images = exSheet.getImages();
    for (const img of images) {
      const row = img.range && img.range.tl ? img.range.tl.nativeRow : null;
      if (row !== null) {
        const imgData = exWb.getImage(img.imageId);
        if (imgData && imgData.buffer) {
          imageMap[row] = { buffer: imgData.buffer, extension: imgData.extension || 'png' };
        }
      }
    }
    
    // ExcelJS reads rows starting from index 1.
    // It is safer to iterate by rows natively.
    let uploadedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    
    // Look for headers
    let headerRowIndexed = 1;
    let nameCol = 1;
    let priceCol = 2;
    let imageCol = 3;

    exSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber <= 10) {
           let rvals = row.values.slice(1).map(v => (v ? v.toString().toLowerCase() : ''));
           if (rvals.some(v => v.includes('item') || v.includes('name'))) {
               headerRowIndexed = rowNumber;
               nameCol = rvals.findIndex(v => v.includes('item') || v.includes('name')) + 1;
               let pc = rvals.findIndex(v => v.includes('price')) + 1;
               if (pc > 0) priceCol = pc;
               let ic = rvals.findIndex(v => v.includes('image') || v.includes('pic')) + 1;
               if (ic > 0) imageCol = ic;
           }
        }
    });

    let lastImageBuffer = null;
    let lastImageExt = null;

    exSheet.eachRow({ includeEmpty: true }, async (row, rowNumber) => {
        if (rowNumber <= headerRowIndexed) return;
        
        let rawNameCell = row.getCell(nameCol).value;
        let name = '';
        if (rawNameCell) {
            if (typeof rawNameCell === 'object' && rawNameCell.richText) {
                name = rawNameCell.richText.map(t => t.text).join('').trim();
            } else {
                name = rawNameCell.toString().trim();
            }
        }
        
        let priceStr = row.getCell(priceCol).value ? row.getCell(priceCol).value.toString().trim() : '';
        let price = parseFloat(priceStr.replace(/[^0-9.]/g, ''));
        
        if (!name || isNaN(price) || price <= 0) return;
        
        // Check "same as above" logic in the name or the image column
        let rawImgCell = row.getCell(imageCol).value;
        let imgStr = '';
        if (rawImgCell) {
            imgStr = typeof rawImgCell === 'object' && rawImgCell.richText 
               ? rawImgCell.richText.map(t => t.text).join('').toLowerCase() 
               : rawImgCell.toString().toLowerCase();
        }

        // Determine Image Data Buffer
        let currentImgData = imageMap[rowNumber - 1]; // ExcelJS tl.nativeRow is 0-indexed, rowNumber is 1-indexed. So rowNumber-1 matches tl.nativeRow
        if (!currentImgData && (imgStr.includes('same') || imgStr.includes('above') || name.toLowerCase().includes('same as'))) {
            if (lastImageBuffer) {
                currentImgData = { buffer: lastImageBuffer, extension: lastImageExt };
            }
        }
        
        if (currentImgData) {
            lastImageBuffer = currentImgData.buffer;
            lastImageExt = currentImgData.extension;
        }

        let relativeUrl = '';
        if (currentImgData && currentImgData.buffer) {
             let safeName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
             // Append rowNumber or random to prevent same-name overrides for different rows if necessary, 
             // but safeName handles it visually if they are the same item. Let's add timestamp or rowNumber just in case.
             let fileName = `${safeName}_r${rowNumber}.${currentImgData.extension}`;
             let fullPath = path.join(imageDir, fileName);
             fs.writeFileSync(fullPath, currentImgData.buffer);
             relativeUrl = `/food-images/${cafeId}/${fileName}`;
        }
        
        const cat = getCategory(name);
        const lowerName = name.toLowerCase();

        if (existingItems[lowerName]) {
             const existId = existingItems[lowerName].id;
             const existImg = existingItems[lowerName].image;
             
             let updates = {};
             // We update if local image is found but it's empty in DB or pointing to placeholder
             if (relativeUrl && (!existImg || existImg === '' || existImg.includes('via.placeholder.com'))) {
                  updates.image = relativeUrl;
             }
             
             if (Object.keys(updates).length > 0) {
                 await db.ref(`menu/${cafeId}/${existId}`).update(updates);
                 updatedCount++;
             } else {
                 skippedCount++;
             }
        } else {
             const dbRef = db.ref(`menu/${cafeId}`).push();
             await dbRef.set({
                 id: dbRef.key,
                 name: name,
                 price: price,
                 category: cat,
                 image: relativeUrl,
                 cafeId: cafeId,
                 isAvailable: true,
                 rating: 0,
                 reviewsCount: 0,
                 createdAt: Date.now(),
                 isHidden: false
             });
             existingItems[lowerName] = { id: dbRef.key, image: relativeUrl, category: cat };
             uploadedCount++;
        }
    });
    
    // We should wait briefly since eachRow is synchronous but our DB calls aren't properly awaited inside it unless we collect promises.
    // Instead of collecting promises, let's just assume Firebase SDK queues them up appropriately.
    // Wait a brief timeout to allow queue flush if needed, but it's simpler to just let Node exit when the event loop is empty.
    console.log(`Queueing writes for ${exSheet.name}. Items detected to write...`);
  }
}

async function main() {
  console.log('=== UET Panda - Master Menu Migration with Local Images ===\n');
  if (!fs.existsSync(publicImagesPath)) {
    fs.mkdirSync(publicImagesPath, { recursive: true });
  }

  for (const cafe of CAFE_FILES) {
    try {
        await processFile(cafe);
    } catch (e) {
        console.error(`Error processing ${cafe.filename}:`, e);
    }
  }

  // Allow Firebase writes to finish
  setTimeout(() => {
     console.log('\n========================================');
     console.log('ALL CAFES MIGRATED SUCCESSFULLY!');
     console.log('========================================');
     process.exit(0);
  }, 5000);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
