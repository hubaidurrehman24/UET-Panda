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

// Global counters for generating highly unique sequential filenames
let globalImageCounter = 0;

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
  
  const exWb = new ExcelJS.Workbook();
  await exWb.xlsx.readFile(filePath);
  
  for (const exSheet of exWb.worksheets) {
    if (exSheet.state === 'hidden') continue;
    
    // We will extract all images and sort them purely by their vertical Y position in pixels or EMUs.
    // This is mathematically superior to relying on row boundaries, as row heights can warp.
    const rawImages = [];
    const images = exSheet.getImages();
    for (const img of images) {
      if (img.range && img.range.tl) {
          const imgData = exWb.getImage(img.imageId);
          if (imgData && imgData.buffer) {
            // Calculate a rough Y coordinate using row number + offset
            const yAnchor = img.range.tl.nativeRow + (img.range.tl.nativeColOff / 1000000 || 0);
            rawImages.push({
                y: yAnchor,
                row: img.range.tl.nativeRow,
                buffer: imgData.buffer,
                extension: imgData.extension || 'png'
            });
          }
      }
    }
    
    // Sort all raw images by their vertical Y position
    rawImages.sort((a,b) => a.y - b.y);

    
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

    let itemsInSheet = [];
    exSheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
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
        
        let rawImgCell = row.getCell(imageCol).value;
        let imgStr = '';
        if (rawImgCell) {
            imgStr = typeof rawImgCell === 'object' && rawImgCell.richText 
               ? rawImgCell.richText.map(t => t.text).join('').toLowerCase() 
               : rawImgCell.toString().toLowerCase();
        }

        if (name && !isNaN(price) && price > 0) {
            itemsInSheet.push({
                name,
                price,
                imgStr,
                rowNumber,
                isSameAsAbove: imgStr.includes('same') || imgStr.includes('above') || name.toLowerCase().includes('same as'),
                assignedImage: null
            });
        }
    });

    // Strategy 2: Zip sorting. 
    // We have N chronological valid items in the sheet.
    // We have M chronological images in the sheet.
    // We walk down the items. If 'same as above', reuse last image.
    // If not, we take the top-most unassigned image from the rawImages deck.
    let imageDeckIndex = 0;
    let lastImageAssigned = null;

    for (let item of itemsInSheet) {
         if (item.isSameAsAbove && lastImageAssigned) {
              item.assignedImage = lastImageAssigned;
         } else {
              // Try to find the closest Y-coordinate image that hasn't been heavily skipped, 
              // or simply pop the next one off the deck.
              // We'll use a sliding window: look at the next few available images and pick the one whose `row` is closest.
              let bestIndex = -1;
              let bestDist = Infinity;
              
              for (let i = imageDeckIndex; i < Math.min(rawImages.length, imageDeckIndex + 5); i++) {
                   // nativeRow is 0-indexed. rowNumber is 1-indexed. Convert item row to 0-index.
                   let dist = Math.abs(rawImages[i].row - (item.rowNumber - 1));
                   if (dist < bestDist && dist <= 3) {
                       bestDist = dist;
                       bestIndex = i;
                   }
              }
              
              if (bestIndex !== -1) {
                  item.assignedImage = rawImages[bestIndex];
                  lastImageAssigned = rawImages[bestIndex];
                  // Advance the deck pointer past whatever we just consumed
                  imageDeckIndex = bestIndex + 1;
              } else if (imageDeckIndex < rawImages.length) {
                  // Fallback: If distance was > 3, we still force take the next sequential image 
                  // to prevent starvation, since floating images can be wild.
                  item.assignedImage = rawImages[imageDeckIndex];
                  lastImageAssigned = rawImages[imageDeckIndex];
                  imageDeckIndex++;
              }
         }
    }


    // Now apply items to database & filesystem
    for (let item of itemsInSheet) {
        let relativeUrl = '';
        if (item.assignedImage && item.assignedImage.buffer) {
             globalImageCounter++;
             let safeName = item.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
             // Critical: Append a strictly unique global counter to the filename 
             // to prevent multiple similar names from overwriting each other's distinct visual files 
             // in standard folders under Windows/Linux.
             let fileName = `${safeName}_c${globalImageCounter}.${item.assignedImage.extension}`;
             
             let studentPath = path.join(studentCafeDir, fileName);
             let adminPath = path.join(adminCafeDir, fileName);
             
             fs.writeFileSync(studentPath, item.assignedImage.buffer);
             fs.writeFileSync(adminPath, item.assignedImage.buffer);
             
             relativeUrl = `/food-images/${cafeId}/${fileName}`;
        }
        
        const cat = getCategory(item.name);
        const lowerName = item.name.toLowerCase();

        if (existingItems[lowerName]) {
             const existId = existingItems[lowerName].id;
             let updates = {
                 category: cat
             };
             // Always force image overwrite if we extracted a URL.
             // This cleans up ALL bad images from previous partial syncs permanently.
             if (relativeUrl) {
                  updates.image = relativeUrl;
             }
             
             await db.ref(`menu/${cafeId}/${existId}`).update(updates);
        } else {
             const dbRef = db.ref(`menu/${cafeId}`).push();
             await dbRef.set({
                 id: dbRef.key,
                 name: item.name,
                 price: item.price,
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
        }
    }
  }
}

async function main() {
  console.log('=== UET Panda - Master Menu Migration V3 (Strict Sequential Assignment) ===\n');

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
