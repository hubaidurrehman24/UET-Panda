
const { Storage } = require('@google-cloud/storage');
const path = require('path');

const saPath = 'C:\\Users\\hubai\\OneDrive\\Desktop\\UET-Panda\\scripts\\serviceAccountKey.json';

async function listBuckets() {
  const storage = new Storage({
    keyFilename: saPath,
    projectId: 'uet-panda-1c0e4'
  });

  try {
    const [buckets] = await storage.getBuckets();
    console.log('Buckets:');
    buckets.forEach(bucket => {
      console.log(` - ${bucket.name}`);
    });
  } catch (err) {
    console.error('ERROR:', err.message);
  }
}

listBuckets();
