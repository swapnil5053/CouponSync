// Script to update all user passwords with proper hashes
import bcrypt from 'bcryptjs';
import pool from './db.js';

const updatePasswords = async () => {
  try {
    // Hash passwords
    const adminPassword = await bcrypt.hash('Admin@123', 10);
    const merchantPassword = await bcrypt.hash('Merchant@123', 10);
    const customerPassword = await bcrypt.hash('Customer@123', 10);

    console.log('Generated password hashes...');
    console.log('Admin@123:', adminPassword);
    console.log('Merchant@123:', merchantPassword);
    console.log('Customer@123:', customerPassword);

    // Update admin
    await pool.query(
      'UPDATE users SET password_hash = ? WHERE email = ?',
      [adminPassword, 'admin@vcds.com']
    );
    console.log('✓ Updated admin@vcds.com');

    // Update merchants with Admin@123
    await pool.query(
      'UPDATE users SET password_hash = ? WHERE email IN (?, ?)',
      [adminPassword, 'merchant@example.com', 'test@merchant.com']
    );
    console.log('✓ Updated merchant@example.com, test@merchant.com');

    // Update merchant users with Merchant@123
    await pool.query(
      'UPDATE users SET password_hash = ? WHERE email IN (?, ?, ?)',
      [merchantPassword, 'techstore@merchant.com', 'fashionhub@merchant.com', 'foodmart@merchant.com']
    );
    console.log('✓ Updated techstore@merchant.com, fashionhub@merchant.com, foodmart@merchant.com');

    // Update customers with Customer@123
    await pool.query(
      'UPDATE users SET password_hash = ? WHERE email IN (?, ?, ?, ?, ?, ?)',
      [
        customerPassword,
        'customer@example.com',
        'john.doe@gmail.com',
        'jane.smith@yahoo.com',
        'bob.wilson@gmail.com',
        'alice.brown@outlook.com',
        'charlie.davis@gmail.com'
      ]
    );
    console.log('✓ Updated all customer accounts');

    console.log('\n✅ All passwords updated successfully!');
    console.log('\nLogin credentials:');
    console.log('Admin: admin@vcds.com / Admin@123');
    console.log('Merchant: merchant@example.com / Admin@123');
    console.log('Merchant: techstore@merchant.com / Merchant@123');
    console.log('Customer: john.doe@gmail.com / Customer@123');

    process.exit(0);
  } catch (error) {
    console.error('Error updating passwords:', error);
    process.exit(1);
  }
};

updatePasswords();
