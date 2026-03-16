
const admin = require('firebase-admin');
const fs = require('fs');

const saPath = 'C:\\Users\\hubai\\OneDrive\\Desktop\\UET-Panda\\scripts\\serviceAccountKey.json';
const sa = JSON.parse(fs.readFileSync(saPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(sa),
  databaseURL: 'https://uet-panda-1c0e4-default-rtdb.asia-southeast1.firebasedatabase.app'
});

const db = admin.database();

async function check() {
  console.log('Checking menu/cafe1 data...');
  try {
    const snapshot = await db.ref('menu').once('value');
    const val = snapshot.val();
    if (!val) {
      console.log('No data found at menu');
    } else {
      fs.writeFileSync('C:\\Users\\hubai\\OneDrive\\Desktop\\UET-Panda\\menu_dump.json', JSON.stringify(val, null, 2));
      console.log('Data dumped to menu_dump.json');
    }
  } catch (err) {
    console.error('Error fetching data:', err.message);
  } finally {
    process.exit();
  }
}

check();
