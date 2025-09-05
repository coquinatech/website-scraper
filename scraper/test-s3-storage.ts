import { S3Storage } from './storage/s3.js';

async function testS3Storage() {
  console.log('Testing S3Storage implementation...\n');
  
  const storage = new S3Storage({
    endpoint: 'http://minio:9010',
    accessKeyId: 'minioadmin',
    secretAccessKey: 'minioadmin',
    bucket: 'test-storage',
    region: 'us-east-1',
    forcePathStyle: true,
    useSSL: false,
  });
  
  try {
    // Test 1: Initialize storage (should create bucket if not exists)
    console.log('1. Testing initialize()...');
    await storage.initialize();
    console.log('✓ Storage initialized successfully\n');
    
    // Test 2: Save a file
    console.log('2. Testing save()...');
    const testContent = Buffer.from('Hello from S3Storage test!');
    const testPath = 'test-domain.com/source/2025-09-05T10-00-00Z/index.html';
    await storage.save(testPath, testContent);
    console.log(`✓ Saved file to: ${testPath}\n`);
    
    // Test 3: Check if file exists
    console.log('3. Testing exists()...');
    const exists = await storage.exists(testPath);
    console.log(`✓ File exists: ${exists}\n`);
    
    // Test 4: Read the file back
    console.log('4. Testing read()...');
    const readContent = await storage.read(testPath);
    const contentMatches = readContent.toString() === testContent.toString();
    console.log(`✓ Read file successfully. Content matches: ${contentMatches}\n`);
    
    // Test 5: List files with prefix
    console.log('5. Testing list()...');
    const files = await storage.list('test-domain.com/');
    console.log(`✓ Found ${files.length} files with prefix 'test-domain.com/'`);
    files.forEach(file => console.log(`  - ${file}`));
    console.log();
    
    // Test 6: Save multiple files
    console.log('6. Testing multiple file saves...');
    const resources = [
      { path: 'test-domain.com/source/2025-09-05T10-00-00Z/css/style.css', content: 'body { margin: 0; }' },
      { path: 'test-domain.com/source/2025-09-05T10-00-00Z/js/script.js', content: 'console.log("test");' },
      { path: 'test-domain.com/source/2025-09-05T10-00-00Z/images/logo.png', content: 'PNG_DATA_HERE' },
    ];
    
    for (const resource of resources) {
      await storage.save(resource.path, Buffer.from(resource.content));
      console.log(`  ✓ Saved: ${resource.path}`);
    }
    console.log();
    
    // Test 7: List all files again
    console.log('7. Testing list() after multiple saves...');
    const allFiles = await storage.list('test-domain.com/source/2025-09-05T10-00-00Z/');
    console.log(`✓ Found ${allFiles.length} files total:`);
    allFiles.forEach(file => console.log(`  - ${file}`));
    console.log();
    
    // Test 8: Test cleanup of incomplete uploads
    console.log('8. Testing cleanupIncomplete()...');
    const incompletePath = 'test-domain.com/source/2025-09-05T11-00-00Z/';
    await storage.save(incompletePath + 'partial.html', Buffer.from('partial content'));
    console.log(`  Created incomplete upload at: ${incompletePath}`);
    
    await storage.cleanupIncomplete(incompletePath);
    const cleanupExists = await storage.exists(incompletePath + 'partial.html');
    console.log(`✓ Cleanup successful. File exists after cleanup: ${cleanupExists}\n`);
    
    // Test 9: Delete a file
    console.log('9. Testing delete()...');
    await storage.delete(testPath);
    const deletedExists = await storage.exists(testPath);
    console.log(`✓ Delete successful. File exists after delete: ${deletedExists}\n`);
    
    // Test 10: Error handling - read non-existent file
    console.log('10. Testing error handling...');
    try {
      await storage.read('non-existent-file.txt');
      console.log('✗ Should have thrown an error for non-existent file');
    } catch (error: any) {
      console.log(`✓ Correctly threw error for non-existent file: ${error.name}\n`);
    }
    
    console.log('All S3Storage tests passed successfully! ✨');
    
  } catch (error) {
    console.error('Test failed with error:', error);
    process.exit(1);
  }
}

testS3Storage();