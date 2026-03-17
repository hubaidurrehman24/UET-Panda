const admin = require('firebase-admin');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

const serviceAccount = require('./serviceAccountKey.json');

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
  { filename: 'Annexe Cafe.xlsx', cafeId: 'cafe4' }
];

function getCategory(name, hint = '') {
  const n = (name + ' ' + hint).toLowerCase();
  
  // Strict Deals
  if (n.includes("deal ") || n.includes("combo") || n.includes("offer") || n.includes("platter") || n.match(/^deal\s*\d*/)) return "deals";
  
  // Chinese must go before Drinks so Soup doesn't get grabbed by ambiguous liquid keywords
  if (
    n.includes("chilli dry") || n.includes("chili dry") || n.includes("manchurian") ||
    n.includes("chowmein") || n.includes("noodle") || n.includes("fried rice") ||
    n.includes("manchuri") || n.includes("chilli") || n.includes("chinese") || n.includes("macaroni") ||
    n.includes("pasta") || n.includes("shashlik") || n.includes("pepper") || n.includes("cashewnut") || n.includes("schezwan") ||
    n.includes("soup") || n.includes("corn")
  ) return "chinese";

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
    n.includes("momo") || n.includes("burger") || n.includes("shawarma") || n.includes("sandwich") ||
    n.includes("pizza") || n.includes("nuggets") || n.includes("zinger") ||
    n.includes("roll") || n.includes("hot dog") || n.includes("hotdog") ||
    n.includes("wrap") || n.includes("sub") || n.includes("piece") || n.includes("leg") || 
    n.includes("chest") || n.includes("wings") || n.includes("thigh") || n.includes("drumsticks") || n.includes("drum stick")
  ) return "fast-food";

  if (
    n.includes("biryani") || n.includes("karahi") || n.includes("krahi") || n.includes("handi") ||
    n.includes("korma") || n.includes("qorma") || n.includes("nihari") || n.includes("haleem") ||
    n.includes("roti") || n.includes("naan") || n.includes("kabab") ||
    n.includes("tikka") || n.includes("qeema") || n.includes("daal") ||
    n.includes("pulao") || n.includes("salan") || n.includes("rice") ||
    n.includes("chanay") || n.includes("chana") || n.includes("murgh") ||
    n.includes("mutton") || n.includes("beef") || n.includes("fajita") ||
    n.includes("sabzi") || n.includes("kalejii") || n.includes("mash") || n.includes("moli") || n.includes("tawa")
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
    
    const rawImages = [];
    const images = exSheet.getImages();
    for (const img of images) {
      if (img.range && img.range.tl) {
          const imgData = exWb.getImage(img.imageId);
          if (imgData && imgData.buffer) {
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
    
    rawImages.sort((a,b) => a.y - b.y);

    
    let itemsInSheet = [];
    let lastSeenName = '';
    let currentCategoryHint = '';

    exSheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header
        
        let nameCell = row.getCell(1).value;
        let servingCell = row.getCell(2).value;
        let priceCell = row.getCell(3).value;
        let rawImgCell = row.getCell(4).value;

        let name = nameCell ? (typeof nameCell === 'object' && nameCell.richText ? nameCell.richText.map(t=>t.text).join('') : nameCell.toString()).trim() : '';
        let serving = servingCell ? (typeof servingCell === 'object' && servingCell.richText ? servingCell.richText.map(t=>t.text).join('') : servingCell.toString()).trim() : '';
        let priceStr = priceCell ? priceCell.toString().trim() : '';
        let price = parseFloat(priceStr.replace(/[^0-9.]/g, ''));
        
        let imgStr = '';
        if (rawImgCell) {
            imgStr = typeof rawImgCell === 'object' && rawImgCell.richText 
               ? rawImgCell.richText.map(t => t.text).join('').toLowerCase() 
               : rawImgCell.toString().toLowerCase();
        }

        let finalName = '';
        if (name && !serving && isNaN(price)) {
            currentCategoryHint = name;
            return;
        }

        if (!name && serving && !isNaN(price)) {
             if (lastSeenName) {
                 finalName = lastSeenName + ' (' + serving + ')';
             }
        } else if (name && serving && !isNaN(price)) {
             lastSeenName = name;
             finalName = name + ' (' + serving + ')';
        } else if (name && serving && name.toLowerCase().includes('+')) {
             lastSeenName = name;
             finalName = name + ' (' + serving + ')';
        } else if (name) {
             lastSeenName = name;
             finalName = name;
        }

        if (finalName && ( (!isNaN(price) && price > 0) || imgStr.includes('same') || finalName.toLowerCase().includes('deal') )) {
            itemsInSheet.push({
                name: finalName,
                price: price || 0,
                imgStr: imgStr,
                rowNumber: rowNumber,
                isSameAsAbove: imgStr.includes('same') || imgStr.includes('above') || finalName.toLowerCase().includes('same as'),
                assignedImage: null,
                categoryHint: currentCategoryHint
            });
        }
    });

    let imageDeckIndex = 0;
    let lastImageAssigned = null;

    for (let item of itemsInSheet) {
         if (item.isSameAsAbove && lastImageAssigned) {
              item.assignedImage = lastImageAssigned;
         } else {
              let bestIndex = -1;
              let bestDist = Infinity;
              
              for (let i = imageDeckIndex; i < Math.min(rawImages.length, imageDeckIndex + 5); i++) {
                   let dist = Math.abs(rawImages[i].row - (item.rowNumber - 1));
                   if (dist < bestDist && dist <= 3) {
                       bestDist = dist;
                       bestIndex = i;
                   }
              }
              
              if (bestIndex !== -1) {
                  item.assignedImage = rawImages[bestIndex];
                  lastImageAssigned = rawImages[bestIndex];
                  imageDeckIndex = bestIndex + 1;
              } else if (imageDeckIndex < rawImages.length) {
                  item.assignedImage = rawImages[imageDeckIndex];
                  lastImageAssigned = rawImages[imageDeckIndex];
                  imageDeckIndex++;
              }
         }
    }

    let itemsToUpload = itemsInSheet.filter(i => i.assignedImage || !i.assignedImage); // Just keep all of them
    console.log(`Sheet "${exSheet.name}" produced ${itemsToUpload.length} valid items.`);

    for (let item of itemsInSheet) {
        let relativeUrl = '';
        if (item.assignedImage && item.assignedImage.buffer) {
             globalImageCounter++;
             let safeName = item.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
             let fileName = `${safeName}_c${globalImageCounter}.${item.assignedImage.extension}`;
             
             let studentPath = path.join(studentCafeDir, fileName);
             let adminPath = path.join(adminCafeDir, fileName);
             
             fs.writeFileSync(studentPath, item.assignedImage.buffer);
             fs.writeFileSync(adminPath, item.assignedImage.buffer);
             
             relativeUrl = `/food-images/${cafeId}/${fileName}`;
        }
        
        const cat = getCategory(item.name, item.categoryHint);
        const lowerName = item.name.toLowerCase();

        if (existingItems[lowerName]) {
             const existId = existingItems[lowerName].id;
             let updates = {
                 category: cat
             };
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
  console.log('=== UET Panda - Annexe Migration V3 ===\n');

  for (const cafe of CAFE_FILES) {
    try {
        await processFile(cafe);
    } catch (e) {
        console.error(`Error processing ${cafe.filename}:`, e);
    }
  }

  setTimeout(() => {
     console.log('\n========================================');
     console.log('ANNEXE SYNCED SUCCESSFULLY!');
     console.log('========================================');
     process.exit(0);
  }, 5000);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
