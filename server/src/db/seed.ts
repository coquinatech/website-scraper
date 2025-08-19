import { db } from './index.js';
import { users } from './schema/users.js';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

const demoUsers = [
  {
    email: 'admin@demo.com',
    username: 'admin',
    password: 'Demo123!',
    isActive: true,
  },
  {
    email: 'user@demo.com',
    username: 'demouser',
    password: 'Demo123!',
    isActive: true,
  },
  {
    email: 'guest@demo.com',
    username: 'guest',
    password: 'Demo123!',
    isActive: true,
  },
];

async function seed() {
  console.log('🌱 Starting database seeding...');

  try {
    for (const userData of demoUsers) {
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, userData.email))
        .limit(1);

      if (existingUser.length > 0) {
        console.log(`✓ User ${userData.email} already exists, skipping...`);
        continue;
      }

      const passwordHash = await bcrypt.hash(userData.password, 10);
      
      await db.insert(users).values({
        email: userData.email,
        username: userData.username,
        passwordHash,
        isActive: userData.isActive,
      });

      console.log(`✓ Created user: ${userData.email}`);
    }

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📋 Demo credentials:');
    console.log('┌──────────────────┬─────────────┬───────────────┐');
    console.log('│ Email            │ Username    │ Password      │');
    console.log('├──────────────────┼─────────────┼───────────────┤');
    demoUsers.forEach(user => {
      console.log(`│ ${user.email.padEnd(16)} │ ${user.username.padEnd(11)} │ ${user.password.padEnd(13)} │`);
    });
    console.log('└──────────────────┴─────────────┴───────────────┘');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();