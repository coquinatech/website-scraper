import { S3Client, CreateBucketCommand, ListBucketsCommand, PutObjectCommand } from '@aws-sdk/client-s3';

async function testMinIOSimple() {
  console.log('Testing MinIO with simple AWS SDK commands...\n');
  
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
    // List buckets
    console.log('Listing buckets...');
    const listCommand = new ListBucketsCommand({});
    const listResponse = await client.send(listCommand);
    console.log('Existing buckets:', listResponse.Buckets?.map(b => b.Name) || []);
    
    // Try to create bucket
    console.log('\nCreating bucket website-archives...');
    const createCommand = new CreateBucketCommand({
      Bucket: 'website-archives',
    });
    
    try {
      await client.send(createCommand);
      console.log('✓ Bucket created successfully');
    } catch (error: any) {
      if (error.name === 'BucketAlreadyOwnedByYou' || error.name === 'BucketAlreadyExists') {
        console.log('✓ Bucket already exists');
      } else {
        throw error;
      }
    }
    
    // Upload a test file
    console.log('\nUploading test file...');
    const putCommand = new PutObjectCommand({
      Bucket: 'website-archives',
      Key: 'test.txt',
      Body: Buffer.from('Hello from MinIO!'),
    });
    await client.send(putCommand);
    console.log('✓ Test file uploaded successfully');
    
    console.log('\nMinIO is working correctly!');
  } catch (error) {
    console.error('Error details:', error);
  }
}

testMinIOSimple();