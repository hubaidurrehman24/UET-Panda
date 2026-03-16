
const ExcelJS = require('exceljs');
const admin = require('firebase-admin');
const fs = require('fs');

const saPath = 'C:\\Users\\hubai\\OneDrive\\Desktop\\UET-Panda\\scripts\\serviceAccountKey.json';
const sa = JSON.parse(fs.readFileSync(saPath, 'utf8'));
const BHOLA_EXCEL = 'C:\\Users\\hubai\\OneDrive\\Desktop\\UET-Panda\\public\\data\\Bhola Cafe.xlsx';
const CAFE_ID = 'cafe1';
// Verified bucket from .env.local
const BUCKET_NAME = 'uet-panda-1c0e4.firebasestorage.app';

if (admin.apps.length === 0) {
    admin.initializeApp({
        credential: admin.credential.cert(sa),
        storageBucket: BUCKET_NAME,
        databaseURL: 'https://uet-panda-1c0e4-default-rtdb.asia-southeast1.firebasedatabase.app'
    });
}

const db = admin.database();
const bucket = admin.storage().bucket();

async function checkBucket() {
    try {
        const [files] = await bucket.getFiles({ maxResults: 1 });
        console.log(`Bucket connected. Found ${files.length} existing files.`);
        return true;
    } catch (e) {
        console.error(`Bucket check failed: ${e.message}`);
        return false;
    }
}

async function uploadImage(imageBuffer, itemName, itemId) {
    if (!imageBuffer) return "";
    try {
        const token = Date.now().toString(36) + Math.random().toString(36).substring(2);
        const filename = `menu/${CAFE_ID}_fix_${itemId}.png`;
        const file = bucket.file(filename);
        
        await file.save(imageBuffer, { 
            metadata: { 
                contentType: 'image/png',
                metadata: { firebaseStorageDownloadTokens: token }
            },
            resumable: false
        });
        
        return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filename)}?alt=media&token=${token}`;
    } catch (e) {
        console.error(`Upload error for ${itemName}: ${e.message}`);
        return "";
    }
}

async function fixImages() {
    if (!await checkBucket()) {
        console.error('Bucket check failed. Stopping.');
        process.exit(1);
    }
    console.log('Fetching database items for Bhola Cafe...');
    const snapshot = await db.ref(`menu/${CAFE_ID}`).once('value');
    const dbItems = snapshot.val() || {};
    const dbItemsArray = Object.values(dbItems);
    console.log(`Working on ${dbItemsArray.length} items.`);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(BHOLA_EXCEL);

    const excelImagesMap = new Map(); // Name -> Buffer

    const sheets = ['fastfood + fried items', 'Menu', 'Drinks', 'Chinese'];
    for (const sname of sheets) {
        const ws = workbook.getWorksheet(sname);
        if (!ws) continue;
        console.log(`Parsing sheet ${sname} for images...`);
        const images = ws.getImages();

        ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            const values = row.values.slice(1);
            if (!values[0]) return;
            const name = String(values[0]);

            const foundImg = images.find(img => img.range.tl.nativeRow === rowNumber - 1);
            if (foundImg) {
                const imgData = workbook.getImage(foundImg.imageId);
                if (imgData && imgData.buffer) {
                    excelImagesMap.set(name.toLowerCase().trim(), imgData.buffer);
                }
            }
        });
    }

    console.log(`Matched ${excelImagesMap.size} unique images from Excel. Starting upload...`);
    
    let updatedCount = 0;
    for (const item of dbItemsArray) {
        const fullName = item.name.toLowerCase().trim();
        const baseName = fullName.split('(')[0].trim();
        
        // Try exact match, then base name, then special pasta/fries logic
        let buffer = excelImagesMap.get(fullName) || excelImagesMap.get(baseName);
        
        if (!buffer) {
            if (fullName.includes('pasta')) buffer = excelImagesMap.get('chicken cheese pasta');
            else if (fullName.includes('loaded fries')) buffer = excelImagesMap.get('loaded fries');
        }

        if (buffer) {
            const url = await uploadImage(buffer, item.name, item.id);
            if (url) {
                await db.ref(`menu/${CAFE_ID}/${item.id}`).update({ image: url });
                updatedCount++;
                process.stdout.write('.');
            }
        }
    }

    console.log(`\nSUCCESS. Updated ${updatedCount} items with correct image URLs.`);
    process.exit();
}

fixImages().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
