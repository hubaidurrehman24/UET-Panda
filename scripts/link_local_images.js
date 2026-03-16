
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const saPath = 'C:\\Users\\hubai\\OneDrive\\Desktop\\UET-Panda\\scripts\\serviceAccountKey.json';
const sa = JSON.parse(fs.readFileSync(saPath, 'utf8'));

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(sa),
    databaseURL: 'https://uet-panda-1c0e4-default-rtdb.asia-southeast1.firebasedatabase.app'
  });
}

const db = admin.database();
const imgDir = 'C:\\Users\\hubai\\OneDrive\\Desktop\\UET-Panda\\apps\\student\\public\\images\\menu';

function getCategory(itemName) {
  const name = itemName.toLowerCase();
  
  if (name.includes('+') || name.includes('deal') || name.includes('hot deals')) return 'deals';
  
  if (name.includes('juice') || name.includes('shake') || name.includes('tea') || 
      name.includes('coffee') || name.includes('doodh') || name.includes('tang') || 
      name.includes('margarita') || name.includes('kehwa') || name.includes('cola') ||
      name.includes('drink')) return 'drinks';
      
  if (name.includes('chowmein') || name.includes('manchurian') || name.includes('rice') || 
      name.includes('drumsticks') || name.includes('chinese')) return 'chinese';
      
  if (name.includes('burger') || name.includes('buger') || name.includes('pizza') || 
      name.includes('zinger') || name.includes('sandwich') || name.includes('sandwish') || 
      name.includes('panini') || name.includes('roll') || name.includes('shawarma') || 
      name.includes('pasta') || name.includes('lasagna') || name.includes('6 pcs') || 
      name.includes('12 pcs') || name.includes('nuggets') || name.includes('chicken piece') ||
      name.includes('tikka') || name.includes('fajita') || name.includes('mexican') ||
      name.includes('supreme') || name.includes('lover') || name.includes('star')) return 'fast-food';
      
  if (name.includes('fries') || name.includes('fried') || 
      name.includes('pakora') || name.includes('pakory') || name.includes('samosa') || 
      name.includes('bhalla') || name.includes('chaat')) return 'snacks';
      
  return 'desi';
}

function normalizeForMatch(str) {
  return str.toLowerCase()
    .replace(/^cafe1_\d+_/, '') // Remove prefix like cafe1_1_
    .replace(/^\d+_/, '')       // Remove prefix like 1_
    .replace(/chicke /g, 'chicken')
    .replace(/chicken /g, 'chicke')
    .replace(/chicke/g, 'chicken') // Global
    .replace(/buger/g, 'burger')
    .replace(/sandwish/g, 'sandwich')
    .replace(/8"/g, '')
    .replace(/11"/g, '')
    .replace(/14"/g, '')
    .replace(/\(.*\)/g, '')
    .replace(/[^a-z0-9]/gi, '')
    .trim();
}

async function linkImages() {
  console.log('Fetching Bhola Cafe items...');
  const snapshot = await db.ref('menu/cafe1').once('value');
  const items = snapshot.val();
  
  if (!items) {
    console.log('No items found for cafe1');
    process.exit();
  }

  const files = fs.readdirSync(imgDir).filter(f => f.startsWith('cafe1_'));
  console.log(`Found ${files.length} local images for cafe1.`);

  const updates = {};
  let imageCount = 0;
  let categoryCount = 0;

  for (const [id, item] of Object.entries(items)) {
    const originalName = item.name;
    const normalizedItemName = normalizeForMatch(originalName);
    
    // 1. Fix Category
    const newCategory = getCategory(originalName);
    if (newCategory !== item.category) {
        updates[`menu/cafe1/${id}/category`] = newCategory;
        categoryCount++;
    }

    // 2. Fix Image
    const match = files.find(f => {
        const normalizedFileName = normalizeForMatch(f.replace(/\.[^/.]+$/, ""));
        return normalizedItemName === normalizedFileName || 
               normalizedItemName.includes(normalizedFileName) || 
               normalizedFileName.includes(normalizedItemName);
    });

    if (match) {
      const newImg = `/images/menu/${match}`;
      if (item.image !== newImg) {
          updates[`menu/cafe1/${id}/image`] = newImg;
          imageCount++;
          console.log(`Matched: "${originalName}" -> ${match}`);
      }
    } else {
        console.log(`MISS: "${originalName}" (Normalized: ${normalizedItemName})`);
    }
  }

  if (Object.keys(updates).length > 0) {
    console.log(`Updating ${imageCount} images and ${categoryCount} categories...`);
    await db.ref().update(updates);
    console.log('SUCCESS: Updates applied.');
  } else {
    console.log('No updates needed.');
  }
  
  process.exit();
}

linkImages().catch(err => {
  console.error(err);
  process.exit(1);
});
