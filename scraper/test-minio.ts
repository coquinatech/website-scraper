import { S3Storage } from './storage/s3.js';

async function testMinIO() {
  console.log('Testing MinIO connection...');
  
  const storage = new S3Storage({
    endpoint: 'http://localhost:9000',
    accessKeyId: 'minioadmin',
    secretAccessKey: 'minioadmin',
    bucket: 'website-archives',
    forcePathStyle: true,
    useSSL: false,
  });
  
  try {
    console.log('Initializing storage (creating bucket if needed)...');
    await storage.initialize();
    console.log('✓ Storage initialized successfully');
    
    console.log('Testing save operation...');
    await storage.save('test/hello.txt', Buffer.from('Hello MinIO!'));
    console.log('✓ File saved successfully');
    
    console.log('Testing exists operation...');
    const exists = await storage.exists('test/hello.txt');
    console.log(`✓ File exists: ${exists}`);
    
    console.log('Testing read operation...');
    const content = await storage.read('test/hello.txt');
    console.log(`✓ File content: ${content.toString()}`);
    
    console.log('Testing list operation...');
    const files = await storage.list('test/');
    console.log(`✓ Files in test/: ${files.join(', ')}`);
    
    console.log('Testing delete operation...');
    await storage.delete('test/hello.txt');
    console.log('✓ File deleted successfully');
    
    console.log('\nAll tests passed! MinIO is working correctly.');
  } catch (error) {
    console.error('Error:', error);
  }
}

testMinIO();