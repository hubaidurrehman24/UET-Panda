
const ExcelJS = require('exceljs');

async function test() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile('C:\\Users\\hubai\\OneDrive\\Desktop\\UET-Panda\\public\\data\\Bhola Cafe.xlsx');
  
  const ws = workbook.getWorksheet('fastfood + fried items');
  const images = ws.getImages();
  console.log(`Found ${images.length} images in Sheet 1`);
  
  if (images.length > 0) {
    const img = images[0];
    const imageMetadata = workbook.getImage(img.imageId);
    console.log(`Image Metadata for ID ${img.imageId}:`, {
      type: imageMetadata.type,
      name: imageMetadata.name,
      extension: imageMetadata.extension,
      bufferSize: imageMetadata.buffer ? imageMetadata.buffer.length : 0
    });
  }
}

test().catch(console.error);
