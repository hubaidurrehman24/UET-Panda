const admin = require('firebase-admin');
const ExcelJS = require('exceljs');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const serviceAccount = require('./serviceAccountKey.json');

if (admin.apps.length) { admin.apps.forEach(a => a.delete()); }
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://uet-panda-1c0e4-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const db = admin.database();
const dataPath = 'C:\\Users\\hubai\\OneDrive\\Desktop\\UET-Panda\\public\\data';
const imageOutputPath = 'C:\\Users\\hubai\\OneDrive\\Desktop\\UET-Panda\\apps\\student\\public\\images\\menu';

// Ensure output folder exists
fs.mkdirSync(imageOutputPath, { recursive: true });

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
    n.includes("milk") || n.includes("pink chai")
  ) return "drinks";
  if (
    n.includes("burger") || n.includes("shawarma") || n.includes("sandwich") ||
    n.includes("pizza") || n.includes("nuggets") || n.includes("zinger") ||
    n.includes("roll") || n.includes("hot dog") || n.includes("hotdog") ||
    n.includes("wrap") || n.includes("sub") || n.includes("broast")
  ) return "fast-food";
  if (
    n.includes("chilli dry") || n.includes("chili dry") || n.includes("manchurian") ||
    n.includes("manchuri") || n.includes("chowmein") || n.includes("noodle") ||
    n.includes("fried rice") || n.includes("chopsuey") || n.includes("chowmein") ||
    n.includes("chinese") || n.includes("chilli chicken") || n.includes("kung pao")
  ) return "chinese";
  if (
    n.includes("biryani") || n.includes("karahi") || n.includes("handi") ||
    n.includes("korma") || n.includes("nihari") || n.includes("haleem") ||
    n.includes("roti") || n.includes("naan") || n.includes("kabab") ||
    n.includes("tikka") || n.includes("qeema") || n.includes("daal") ||
    n.includes("pulao") || n.includes("plao") || n.includes("salan") || 
    n.includes("rice") || n.includes("paya") || n.includes("bbq")
  ) return "desi";
  if (
    n.includes("fries") || n.includes("chips") || n.includes("samosa") ||
    n.includes("pakora") || n.includes("chat") || n.includes("chaat") ||
    n.includes("bhalay") || n.includes("dahi") || n.includes("bread") ||
    n.includes("egg") || n.includes("toast") || n.includes("paratha") ||
    n.includes("snack") || n.includes("katakat") || n.includes("puri") ||
    n.includes("halwa") || n.includes("fruit") || n.includes("gol gappa") ||
    n.includes("vegetarian") || n.includes("veggie")
  ) return "snacks";
  return "fast-food"; // default fallback
}

async function processFile({ filename, cafeId }) {
  const filePath = path.join(dataPath, filename);
  console.log(`\n--- Processing: ${filename} → ${cafeId} ---`);

  // 1. Parse rows with XLSX
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

  // Build item list
  const itemsByRow = {};
  for (let i = headerRow + 1; i < rows.length; i++) {
    const row = rows[i];
    const name = (row[0] || '').toString().trim();
    const priceVal = row[1];
    const price = parseFloat(priceVal);
    if (name && !isNaN(price) && price > 0) {
      // +1 because XLSX is 0-indexed, ExcelJS is 1-indexed
      itemsByRow[i + 1] = { name, price };
    }
  }
  console.log(`Found ${Object.keys(itemsByRow).length} valid items.`);

  // 2. Extract images with ExcelJS
  const exWb = new ExcelJS.Workbook();
  await exWb.xlsx.readFile(filePath);
  const exSheet = exWb.worksheets[0];

  const imageMap = {};
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

  // 3. Clear existing items for this cafe first
  await db.ref(`menu/${cafeId}`).remove();
  console.log(`Cleared old data for ${cafeId}`);

  // 4. Save images locally and write to DB
  let uploadedCount = 0;
  let noImageCount = 0;
  let index = 0;

  for (const [rowStr, item] of Object.entries(itemsByRow)) {
    const rowNum = parseInt(rowStr);
    index++;
    
    const safeItemName = item.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase().substring(0, 30);
    const itemId = `${cafeId}_${index}_${safeItemName}`;

    let imageUrl = '';
    const imgData = imageMap[rowNum];
    if (imgData) {
      try {
        const ext = imgData.extension === 'jpeg' ? 'jpg' : (imgData.extension || 'png');
        const imageFileName = `${itemId}.${ext}`;
        const imagePath = path.join(imageOutputPath, imageFileName);
        fs.writeFileSync(imagePath, imgData.buffer);
        imageUrl = `/images/menu/${imageFileName}`;
        uploadedCount++;
        console.log(`  ✓ [${item.category || getCategory(item.name)}] ${item.name} → ${imageFileName}`);
      } catch (e) {
        console.log(`  ✗ Image save failed for ${item.name}: ${e.message}`);
      }
    } else {
      noImageCount++;
    }

    const dbRef = db.ref(`menu/${cafeId}/${itemId}`);
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

  console.log(`\n✅ ${cafeId} complete:`);
  console.log(`   Total items: ${Object.keys(itemsByRow).length}`);
  console.log(`   With images: ${uploadedCount}`);
  console.log(`   Without images: ${noImageCount}`);
}

async function main() {
  console.log('=== UET Panda - Menu Migration (Local Images) ===\n');
  for (const cafe of CAFE_FILES) {
    await processFile(cafe);
  }
  console.log('\n=== ALL CAFES MIGRATED SUCCESSFULLY! ===');
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
