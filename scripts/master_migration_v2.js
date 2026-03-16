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
const studentImagesPath = path.join(__dirname, '../apps/student/public/food-images');
const adminImagesPath = path.join(__dirname, '../apps/admin/public/food-images');

const CAFE_FILES = [
  { filename: 'Bhola Cafe.xlsx', cafeId: 'cafe1' },
  { filename: 'GSSC.xlsx',       cafeId: 'cafe2' },
  { filename: 'BSSC.xlsx',       cafeId: 'cafe3' },
];

function getCategory(name) {
  const n = (name || '').toLowerCase();
  if (n.includes("deal") || n.includes("combo") || n.includes("offer") || n.includes("platter")) return "deals";
  if (
    n.includes("chai") || n.includes("tea") || n.includes("coffee") ||
    n.includes("juice") || n.includes("shake") || n.includes("doodh") ||
    n.includes("water") || n.includes("coke") || n.includes("sprite") ||
    n.includes("fanta") || n.includes("dew") || n.includes("pepsi") ||
    n.includes("lime") || n.includes("soda") || n.includes("drink") ||
    n.includes("lassi") || n.includes("lemon") || n.includes("squash") ||
    n.includes("sting") || n.includes("red bull") || n.includes("nestle") ||
    n.includes("gourmet") || n.includes("7up") || n.includes("up") ||
    n.includes("mineral")
  ) return "drinks";
  if (
    n.includes("burger") || n.includes("shawarma") || n.includes("sandwich") ||
    n.includes("pizza") || n.includes("nuggets") || n.includes("zinger") ||
    n.includes("roll") || n.includes("hot dog") || n.includes("hotdog") ||
    n.includes("wrap") || n.includes("sub") || n.includes("piece") || n.includes("leg") || 
    n.includes("chest") || n.includes("wings") || n.includes("thigh") || n.includes("drumsticks")
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
    n.includes("mutton") || n.includes("beef") || n.includes("fajita")
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

function findClosestImage(imageMap, targetRow, maxDistance = 1) {
    if (imageMap[targetRow]) {
        let img = imageMap[targetRow];
        delete imageMap[targetRow];
        return img;
    }
    for (let i = 1; i <= maxDistance; i++) {
        if (imageMap[targetRow - i]) {
            let img = imageMap[targetRow - i];
            delete imageMap[targetRow - i];
            return img;
        }
        if (imageMap[targetRow + i]) {
            let img = imageMap[targetRow + i];
            delete imageMap[targetRow + i];
            return img;
        }
    }
    return null;
}

async function processFile({ filename, cafeId }) {
  const filePath = path.join(dataPath, filename);
  if (!fs.existsSync(filePath)) {
      console.warn(`File not found: ${filePath}`);
      return;
  }
  console.log(`\n--- Processing: ${filename} → ${cafeId} ---`);
  
  const studentCafeDir = path.join(studentImagesPath, cafeId);
  if (!fs.existsSync(studentCafeDir)) fs.mkdirSync(studentCafeDir, { recursive: true });
  
  const adminCafeDir = path.join(adminImagesPath, cafeId);
  if (!fs.existsSync(adminCafeDir)) fs.mkdirSync(adminCafeDir, { recursive: true });

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
      if (img.range && img.range.tl) {
          // NativeRow is usually 0-indexed.
          // Store it directly under its nativeRow index.
          const imgRow = img.range.tl.nativeRow;
          const imgData = exWb.getImage(img.imageId);
          if (imgData && imgData.buffer) {
            imageMap[imgRow] = { buffer: imgData.buffer, extension: imgData.extension || 'png' };
          }
      }
    }
    
    let uploadedCount = 0;
    let updatedCount = 0;
    
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
        
        let rawImgCell = row.getCell(imageCol).value;
        let imgStr = '';
        if (rawImgCell) {
            imgStr = typeof rawImgCell === 'object' && rawImgCell.richText 
               ? rawImgCell.richText.map(t => t.text).join('').toLowerCase() 
               : rawImgCell.toString().toLowerCase();
        }

        // RowNumber corresponds to 1-indexed. nativeRow corresponds to 0-indexed.
        const nativeRowIndex = rowNumber - 1;

        // Find closest image, allowing a margin to catch floated misalignments
        // Don't margin-search if it explicitly says "same"
        let currentImgData = null;
        if (imgStr.includes('same') || imgStr.includes('above') || name.toLowerCase().includes('same as')) {
            if (lastImageBuffer) {
                currentImgData = { buffer: lastImageBuffer, extension: lastImageExt };
            }
        } else {
            // Find an image mapped to the exact row, or 1 row above/below
            currentImgData = findClosestImage(imageMap, nativeRowIndex, 1);
        }
        
        // Update persistent last image for subsequent "same as above"
        if (currentImgData) {
            lastImageBuffer = currentImgData.buffer;
            lastImageExt = currentImgData.extension;
        }

        let relativeUrl = '';
        if (currentImgData && currentImgData.buffer) {
             let safeName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
             let fileName = `${safeName}_r${rowNumber}.${currentImgData.extension}`;
             
             let studentPath = path.join(studentCafeDir, fileName);
             let adminPath = path.join(adminCafeDir, fileName);
             
             fs.writeFileSync(studentPath, currentImgData.buffer);
             fs.writeFileSync(adminPath, currentImgData.buffer);
             
             relativeUrl = `/food-images/${cafeId}/${fileName}`;
        }
        
        const cat = getCategory(name);
        const lowerName = name.toLowerCase();

        if (existingItems[lowerName]) {
             const existId = existingItems[lowerName].id;
             const existImg = existingItems[lowerName].image;
             
             let updates = {};
             // We now force update the DB if we found a valid currentImgData local image 
             // because the previous script may have skipped setting proper images on existing items
             if (relativeUrl && existImg !== relativeUrl) {
                  updates.image = relativeUrl;
             }
             if (existingItems[lowerName].category !== cat) {
                  updates.category = cat;
             }
             
             if (Object.keys(updates).length > 0) {
                 await db.ref(`menu/${cafeId}/${existId}`).update(updates);
                 updatedCount++;
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
    console.log(`Queued updates/writes for ${exSheet.name}.`);
  }
}

async function main() {
  console.log('=== UET Panda - Master Menu Migration with Enhanced Image Sync ===\n');

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
     console.log('ALL CAFES SYNCED SUCCESSFULLY!');
     console.log('========================================');
     process.exit(0);
  }, 5000);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
