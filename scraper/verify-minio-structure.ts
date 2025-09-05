import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';

async function verifyMinIOStructure() {
  console.log('Verifying MinIO archive structure...\n');
  
  const client = new S3Client({
    endpoint: 'http://minio:9010',
    region: 'us-east-1',
    credentials: {
      accessKeyId: 'minioadmin',
      secretAccessKey: 'minioadmin',
    },
    forcePathStyle: true,
  });
  
  try {
    // List all objects in the bucket
    console.log('Listing all objects in website-archives bucket:\n');
    const listCommand = new ListObjectsV2Command({
      Bucket: 'website-archives',
    });
    
    const response = await client.send(listCommand);
    
    if (response.Contents && response.Contents.length > 0) {
      // Group objects by domain and timestamp
      const archives: { [key: string]: string[] } = {};
      
      response.Contents.forEach(obj => {
        if (obj.Key) {
          const parts = obj.Key.split('/');
          if (parts.length >= 3) {
            const domain = parts[0];
            const timestamp = parts[2];
            const archiveKey = `${domain} - ${timestamp}`;
            
            if (!archives[archiveKey]) {
              archives[archiveKey] = [];
            }
            archives[archiveKey].push(obj.Key);
          }
        }
      });
      
      // Display the structure
      console.log('Archive Structure:');
      console.log('================\n');
      
      Object.entries(archives).forEach(([archive, files]) => {
        console.log(`📁 ${archive}`);
        console.log(`   Files: ${files.length}`);
        
        // Show first few files as examples
        files.slice(0, 5).forEach(file => {
          const relativePath = file.split('/').slice(3).join('/');
          console.log(`   └─ ${relativePath || 'index.html'}`);
        });
        
        if (files.length > 5) {
          console.log(`   └─ ... and ${files.length - 5} more files`);
        }
        console.log();
      });
      
      // Verify the expected path structure
      console.log('Path Structure Verification:');
      console.log('===========================\n');
      
      const examplePath = response.Contents[0].Key!;
      const pathParts = examplePath.split('/');
      
      console.log('Example path:', examplePath);
      console.log('Path components:');
      console.log(`  1. Domain: ${pathParts[0]}`);
      console.log(`  2. Type: ${pathParts[1]} (should be "source")`);
      console.log(`  3. Timestamp: ${pathParts[2]} (ISO 8601 format)`);
      console.log(`  4. Resource path: ${pathParts.slice(3).join('/')}\n`);
      
      // Validate timestamp format
      const timestampRegex = /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z$/;
      const isValidTimestamp = timestampRegex.test(pathParts[2]);
      console.log(`Timestamp format valid: ${isValidTimestamp ? '✅' : '❌'}`);
      
      // Check if structure matches expected format
      const isValidStructure = pathParts[1] === 'source' && isValidTimestamp;
      console.log(`Overall structure valid: ${isValidStructure ? '✅' : '❌'}\n`);
      
      // Try to read a sample HTML file
      const htmlFiles = response.Contents.filter(obj => obj.Key?.endsWith('.html'));
      if (htmlFiles.length > 0 && htmlFiles[0].Key) {
        console.log('Sample HTML Content:');
        console.log('==================\n');
        
        const getCommand = new GetObjectCommand({
          Bucket: 'website-archives',
          Key: htmlFiles[0].Key,
        });
        
        const htmlResponse = await client.send(getCommand);
        if (htmlResponse.Body) {
          const chunks: Uint8Array[] = [];
          const stream = htmlResponse.Body as any;
          
          for await (const chunk of stream) {
            chunks.push(chunk);
          }
          
          const content = Buffer.concat(chunks).toString('utf-8');
          console.log(`File: ${htmlFiles[0].Key}`);
          console.log(`Size: ${content.length} bytes`);
          console.log(`First 200 chars: ${content.substring(0, 200)}...\n`);
        }
      }
      
      console.log('✅ Archive structure verification complete!');
      
    } else {
      console.log('No objects found in the bucket.');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

verifyMinIOStructure();