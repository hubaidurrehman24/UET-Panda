const admin = require('firebase-admin');
const ExcelJS = require('exceljs');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const serviceAccount = require('./serviceAccountKey.json');

// Destroy any existing apps
if (admin.apps.length) {
  admin.apps.forEach(app => app.delete());
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://uet-panda-1c0e4-default-rtdb.asia-southeast1.firebasedatabase.app",
  storageBucket: "uet-panda-1c0e4.firebasestorage.app"
});

const db = admin.database();
const bucket = admin.storage().bucket();

const dataPath = 'C:\\Users\\hubai\\OneDrive\\Desktop\\UET-Panda\\public\\data';

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
    n.includes("lassi") || n.includes("lemon") || n.includes("squash")
  ) return "drinks";
  if (
    n.includes("burger") || n.includes("shawarma") || n.includes("sandwich") ||
    n.includes("pizza") || n.includes("nuggets") || n.includes("zinger") ||
    n.includes("roll") || n.includes("hot dog") || n.includes("hotdog") ||
    n.includes("wrap") || n.includes("sub")
  ) return "fast-food";
  if (
    n.includes("chilli dry") || n.includes("chili dry") || n.includes("manchurian") ||
    n.includes("chowmein") || n.includes("noodle") || n.includes("fried rice") ||
    n.includes("manchuri") || n.includes("chilli") || n.includes("chinese")
  ) return "chinese";
  if (
    n.includes("biryani") || n.includes("karahi") || n.includes("handi") ||
    n.includes("korma") || n.includes("nihari") || n.includes("haleem") ||
    n.includes("roti") || n.includes("naan") || n.includes("kabab") ||
    n.includes("tikka") || n.includes("qeema") || n.includes("daal") ||
    n.includes("pulao") || n.includes("salan") || n.includes("rice")
  ) return "desi";
  if (
    n.includes("fries") || n.includes("chips") || n.includes("samosa") || 
    n.includes("pakora") || n.includes("chat") || n.includes("chaat") ||
    n.includes("bhalay") || n.includes("dahi") || n.includes("bread") ||
    n.includes("egg") || n.includes("toast") || n.includes("paratha") || 
    n.includes("sandwich") || n.includes("snack") || n.includes("katakat") ||
    n.includes("puri") || n.includes("halwa")
  ) return "snacks";
  return "fast-food"; // default fallback
}

async function uploadImageBuffer(buffer, extension, fileName) {
  const token = Date.now().toString(36) + Math.random().toString(36).substring(2);
  const dest = `menu/${fileName}.${extension}`;
  const file = bucket.file(dest);

  await file.save(buffer, {
    metadata: {
      contentType: `image/${extension === 'jpg' ? 'jpeg' : extension}`,
      metadata: { firebaseStorageDownloadTokens: token }
    },
    resumable: false
  });

  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(dest)}?alt=media&token=${token}`;
}

async function processFile({ filename, cafeId }) {
  const filePath = path.join(dataPath, filename);
  console.log(`\n--- Processing: ${filename} → ${cafeId} ---`);

  // 1. Parse rows with XLSX (fast)
  const wb = XLSX.readFile(filePath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  // Find header row
  let headerRow = 0;
  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    const row = rows[i];
    if ((row[0] || '').toString().toLowerCase().includes('item') ||
        (row[1] || '').toString().toLowerCase().includes('price')) {
      headerRow = i;
      break;
    }
  }

  // Build item list (name + price)
  const itemsByRow = {}; // rowIndex (1-based) => { name, price }
  for (let i = headerRow + 1; i < rows.length; i++) {
    const row = rows[i];
    const name = (row[0] || '').toString().trim();
    const priceVal = row[1];
    const price = parseFloat(priceVal);
    if (name && !isNaN(price) && price > 0) {
      itemsByRow[i + 1] = { name, price }; // +1 because XLSX is 0-indexed, ExcelJS is 1-indexed
    }
  }
  console.log(`Found ${Object.keys(itemsByRow).length} valid items.`);

  // 2. Extract images with ExcelJS
  const exWb = new ExcelJS.Workbook();
  await exWb.xlsx.readFile(filePath);
  const exSheet = exWb.worksheets[0];

  const imageMap = {}; // nativeRow+1 => imageData buffer
  try {
    const images = exSheet.getImages();
    for (const img of images) {
      const row = img.range && img.range.tl ? (img.range.tl.nativeRow + 1) : null;
      if (row !== null) {
        const imgData = exWb.getImage(img.imageId);
        if (imgData && imgData.buffer) {
          imageMap[row] = { buffer: imgData.buffer, extension: imgData.extension || 'png' };
        }
      }
    }
    console.log(`Mapped ${Object.keys(imageMap).length} images.`);
  } catch (e) {
    console.warn(`Image extraction warning: ${e.message}`);
  }

  // 3. Upload everything
  let uploadedCount = 0;
  let noImageCount = 0;

  for (const [rowStr, item] of Object.entries(itemsByRow)) {
    const rowNum = parseInt(rowStr);
    const dbRef = db.ref(`menu/${cafeId}`).push();
    const itemId = dbRef.key;

    let imageUrl = '';
    const imgData = imageMap[rowNum];
    if (imgData) {
      try {
        process.stdout.write(`  ↑ "${item.name}" ... `);
        imageUrl = await uploadImageBuffer(imgData.buffer, imgData.extension, `${cafeId}_${itemId}`);
        uploadedCount++;
        console.log('✓');
      } catch (e) {
        console.log(`✗ (${e.message})`);
      }
    } else {
      noImageCount++;
    }

    await dbRef.set({
      id: itemId,
      name: item.name,
      price: item.price,
      category: getCategory(item.name),
      image: imageUrl,
      cafeId: cafeId,
      isAvailable: true,
      rating: 0,
      reviewsCount: 0,
      createdAt: Date.now()
    });
  }

  console.log(`✅ ${cafeId}: ${Object.keys(itemsByRow).length} items written. ${uploadedCount} images uploaded, ${noImageCount} items without image.`);
}

async function main() {
  console.log('=== UET Panda - Master Menu Migration ===\n');

  for (const cafe of CAFE_FILES) {
    await processFile(cafe);
  }

  console.log('\n========================================');
  console.log('ALL CAFES MIGRATED SUCCESSFULLY!');
  console.log('========================================');
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
