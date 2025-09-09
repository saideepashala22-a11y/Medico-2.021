import { db } from '../server/db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function createAdminUser() {
  try {
    console.log('Creating default admin user...');
    
    // Check if admin user already exists
    const existingAdmin = await db.select().from(users).where(eq(users.username, 'admin'));
    
    if (existingAdmin.length > 0) {
      console.log('Admin user already exists!');
      console.log('Username: admin');
      console.log('Password: admin123');
      return;
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Create admin user
    const [adminUser] = await db.insert(users).values({
      username: 'admin',
      password: hashedPassword,
      role: 'doctor',
      name: 'Dr. Administrator',
      email: 'admin@hospital.com',
      phoneNumber: '+91-9876543210',
      specialization: 'General Medicine',
      licenseNumber: 'MD123456',
      isOwner: true,
      isCurrent: true,
      isActive: true,
    }).returning();
    
    console.log('✅ Admin user created successfully!');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('Role: doctor');
    console.log('Name: Dr. Administrator');
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

createAdminUser();