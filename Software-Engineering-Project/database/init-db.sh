#!/bin/bash

# VCDS Database Initialization Script
# This script will create the database and initialize the schema

echo "🚀 Virtual Coupon Distribution System - Database Setup"
echo "=================================================="

# MySQL connection details
MYSQL_PATH="/usr/local/mysql-9.4.0-macos15-arm64/bin/mysql"
DB_NAME="vcds"

echo ""
echo "📋 This script will:"
echo "  1. Create the VCDS database (if not exists)"
echo "  2. Initialize all required tables"
echo "  3. Create default admin user"
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."

echo ""
echo "🔐 Please enter your MySQL root password:"

# Create database
$MYSQL_PATH -u root -p << EOF
CREATE DATABASE IF NOT EXISTS $DB_NAME;
USE $DB_NAME;
SOURCE $(pwd)/database/schema.sql;
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database setup completed successfully!"
    echo ""
    echo "📝 Default credentials:"
    echo "   Admin Email: admin@vcds.com"
    echo "   Password: Admin@123"
    echo ""
    echo "   Merchant Email: merchant@example.com"
    echo "   Password: Admin@123"
    echo ""
    echo "   Customer Email: customer@example.com"
    echo "   Password: Admin@123"
    echo ""
    echo "⚠️  IMPORTANT: Change these passwords in production!"
    echo ""
else
    echo ""
    echo "❌ Database setup failed. Please check the error messages above."
    exit 1
fi
