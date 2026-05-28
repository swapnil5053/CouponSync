#!/bin/bash

# VCDS Complete Setup Script
# This script sets up both backend and frontend

echo "🎫 Virtual Coupon Distribution System - Complete Setup"
echo "========================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the script's directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "📍 Project directory: $SCRIPT_DIR"
echo ""

# Step 1: Database Setup
echo "${BLUE}📊 Step 1: Database Setup${NC}"
echo "======================================"
read -p "Do you want to initialize the database? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd database
    chmod +x init-db.sh
    ./init-db.sh
    if [ $? -eq 0 ]; then
        echo "${GREEN}✅ Database initialized successfully${NC}"
    else
        echo "${RED}❌ Database initialization failed${NC}"
        exit 1
    fi
    cd ..
else
    echo "⏭️  Skipping database initialization"
fi

echo ""

# Step 2: Backend Setup
echo "${BLUE}🔧 Step 2: Backend Setup${NC}"
echo "======================================"
cd backend

if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "${GREEN}✅ .env file created${NC}"
    echo "⚠️  Please edit backend/.env with your configuration:"
    echo "   - DB_PASSWORD"
    echo "   - JWT_SECRET"
    echo "   - ENCRYPTION_KEY"
    echo "   - Email settings (optional)"
    echo "   - Twilio settings (optional)"
    echo ""
    read -p "Press Enter once you've configured the .env file..."
fi

echo "Installing backend dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "${GREEN}✅ Backend dependencies installed${NC}"
else
    echo "${RED}❌ Backend installation failed${NC}"
    exit 1
fi

cd ..
echo ""

# Step 3: Frontend Setup
echo "${BLUE}🎨 Step 3: Frontend Setup${NC}"
echo "======================================"
cd frontend

if [ ! -f ".env" ]; then
    echo "Creating frontend .env file..."
    echo "REACT_APP_API_URL=http://localhost:5000/api" > .env
    echo "${GREEN}✅ Frontend .env file created${NC}"
fi

echo "Installing frontend dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "${GREEN}✅ Frontend dependencies installed${NC}"
else
    echo "${RED}❌ Frontend installation failed${NC}"
    exit 1
fi

cd ..
echo ""

# Setup Complete
echo "${GREEN}🎉 Setup Complete!${NC}"
echo "======================================"
echo ""
echo "📝 Next Steps:"
echo ""
echo "1️⃣  Start the Backend Server:"
echo "   cd backend"
echo "   npm run dev"
echo "   ${BLUE}→ Backend will run on http://localhost:5000${NC}"
echo ""
echo "2️⃣  Start the Frontend (in a new terminal):"
echo "   cd frontend"
echo "   npm start"
echo "   ${BLUE}→ Frontend will run on http://localhost:3000${NC}"
echo ""
echo "3️⃣  Login with default credentials:"
echo "   ${GREEN}Admin:${NC} admin@vcds.com / Admin@123"
echo "   ${GREEN}Merchant:${NC} merchant@example.com / Admin@123"
echo "   ${GREEN}Customer:${NC} customer@example.com / Admin@123"
echo ""
echo "⚠️  Remember to change default passwords in production!"
echo ""
echo "📚 Documentation: See README.md for more details"
echo ""
echo "${GREEN}Happy Coding! 🚀${NC}"
