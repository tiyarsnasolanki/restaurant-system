/**
 * Database seed script - Run once to populate initial data
 * Usage: node backend/utils/seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const User     = require('../models/User');
const MenuItem = require('../models/MenuItem');

const MENU_ITEMS = [
  // Paper Dosa
  { name: 'Sada Paper',              category: 'Paper Dosa', price: 60,  isVeg: true },
  { name: 'Cheese Sada Paper',       category: 'Paper Dosa', price: 120, isVeg: true },
  { name: 'Baby Paper',              category: 'Paper Dosa', price: 60,  isVeg: true },
  { name: 'Cheese Garlic Paper',     category: 'Paper Dosa', price: 130, isVeg: true },
  { name: 'Schezwan Sada Paper',     category: 'Paper Dosa', price: 90,  isVeg: true },
  { name: 'Cheese Schezwan Sada',    category: 'Paper Dosa', price: 130, isVeg: true },
  { name: 'Jeera Nylon',             category: 'Paper Dosa', price: 90,  isVeg: true },
  { name: 'Nylon Paper',             category: 'Paper Dosa', price: 80,  isVeg: true },
  { name: 'Cheese Nylon Paper',      category: 'Paper Dosa', price: 130, isVeg: true },
  { name: 'Baby Nylon Paper',        category: 'Paper Dosa', price: 80,  isVeg: true },
  { name: 'Cheese Baby Nylon',       category: 'Paper Dosa', price: 130, isVeg: true },
  { name: 'Garlic Nylon',            category: 'Paper Dosa', price: 90,  isVeg: true },
  { name: 'Cheese Garlic Nylon',     category: 'Paper Dosa', price: 140, isVeg: true },
  { name: 'Chocolate Paper',         category: 'Paper Dosa', price: 80,  isVeg: true },
  { name: 'Cheese Baby Paper',       category: 'Paper Dosa', price: 120, isVeg: true },
  { name: 'Schezwan Nylon',          category: 'Paper Dosa', price: 100, isVeg: true },
  { name: 'Cheese Schezwan Nylon',   category: 'Paper Dosa', price: 140, isVeg: true },
  { name: 'Cheese Chili Garlic Nylon',category: 'Paper Dosa', price: 150, isVeg: true },
  { name: 'Limbu Mari Nylon',        category: 'Paper Dosa', price: 90,  isVeg: true },
  { name: 'Cheese Limbu Mari Nylon', category: 'Paper Dosa', price: 130, isVeg: true },
  { name: 'Mari Nylon',              category: 'Paper Dosa', price: 90,  isVeg: true },
  { name: 'Cheese Mari Nylon',       category: 'Paper Dosa', price: 130, isVeg: true },
  { name: 'Jeera Mari Nylon',        category: 'Paper Dosa', price: 90,  isVeg: true },
  { name: 'Cheese Jeera Mari Nylon', category: 'Paper Dosa', price: 130, isVeg: true },
  { name: 'Cheese Chocolate Nylon',  category: 'Paper Dosa', price: 130, isVeg: true },

  // Gravy Items
  { name: 'Mysore',                  category: 'Gravy Item', price: 140, isVeg: true },
  { name: 'Tawa Mysore',             category: 'Gravy Item', price: 180, isVeg: true },
  { name: 'Cheese Mysore',           category: 'Gravy Item', price: 200, isVeg: true },
  { name: 'Paneer Surma',            category: 'Gravy Item', price: 200, isVeg: true },
  { name: 'Paneer Tukda Mysore',     category: 'Gravy Item', price: 200, isVeg: true },
  { name: 'Cheese Paneer Surma',     category: 'Gravy Item', price: 250, isVeg: true },
  { name: 'Cheese Paneer Tukda Mysore', category: 'Gravy Item', price: 250, isVeg: true },
  { name: 'Cheese Surma',            category: 'Gravy Item', price: 250, isVeg: true },
  { name: 'Cheese Gotalo',           category: 'Gravy Item', price: 280, isVeg: true },
  { name: 'Cheese Patra',            category: 'Gravy Item', price: 300, isVeg: true },
  { name: 'JK Special Garlic Fry',   category: 'Gravy Item', price: 330, isVeg: true },

  // Fancy Dosa
  { name: 'Masala Dosa',             category: 'Fancy Dosa', price: 100, isVeg: true },
  { name: 'Separate Masala Dosa',    category: 'Fancy Dosa', price: 120, isVeg: true },
  { name: 'Cheese Masala Dosa',      category: 'Fancy Dosa', price: 180, isVeg: true },
  { name: 'Palak Dosa',              category: 'Fancy Dosa', price: 170, isVeg: true },
  { name: 'Aloo Paneer Dosa',        category: 'Fancy Dosa', price: 170, isVeg: true },
  { name: 'Sweet Corn Dosa',         category: 'Fancy Dosa', price: 170, isVeg: true },
  { name: 'Cheese Sweet Corn Dosa',  category: 'Fancy Dosa', price: 200, isVeg: true },
  { name: 'Palak Paneer Dosa',       category: 'Fancy Dosa', price: 190, isVeg: true },
  { name: 'Cheese Palak Dosa',       category: 'Fancy Dosa', price: 200, isVeg: true },
  { name: 'Cheese Palak Paneer',     category: 'Fancy Dosa', price: 220, isVeg: true },
  { name: 'Cheese Aloo Palak',       category: 'Fancy Dosa', price: 200, isVeg: true },
  { name: 'Paneer Dosa',             category: 'Fancy Dosa', price: 200, isVeg: true },
  { name: 'Cheese Paneer Dosa',      category: 'Fancy Dosa', price: 220, isVeg: true },
  { name: 'Jini Dosa',               category: 'Fancy Dosa', price: 200, isVeg: true },
  { name: 'Mix Dosa',                category: 'Fancy Dosa', price: 220, isVeg: true },
  { name: 'Pizza Dosa',              category: 'Fancy Dosa', price: 260, isVeg: true },

  // Beverages
  { name: 'Special Salad',           category: 'Beverages',  price: 20,  isVeg: true },
  { name: 'Cold Drinks',             category: 'Beverages',  price: 20,  isVeg: true },
  { name: 'Buttermilk',              category: 'Beverages',  price: 20,  isVeg: true },
  { name: 'Water',                   category: 'Beverages',  price: 20,  isVeg: true },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Create admin user
    const adminExists = await User.findOne({ email: 'admin@jkdosa.com' });
    if (!adminExists) {
      await User.create({
        name: 'Admin',
        email: 'admin@jkdosa.com',
        password: 'admin123',
        role: 'admin',
      });
      console.log('✅ Admin user created: admin@jkdosa.com / admin123');
    }

    // Seed menu
    await MenuItem.deleteMany({});
    await MenuItem.insertMany(MENU_ITEMS);
    console.log(`✅ Seeded ${MENU_ITEMS.length} menu items`);

    console.log('\n🎉 Database seeded successfully!');
    console.log('Login: admin@jkdosa.com | Password: admin123');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
}

seed();
