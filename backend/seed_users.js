const mongoose = require("mongoose");
const User = require("./models/User");
const Order = require("./models/Order");

async function seedUsers() {
  await mongoose.connect("mongodb://127.0.0.1:27017/techzone");
  console.log("Connected to MongoDB");

  const defaultUsers = [
    {
      name: "Abdulrahman",
      email: "ahabdulrahmanknr@gmail.com",
      password: "password123",
      phone: "9876543210",
      address: {
        street: "Flat 402, Skyline Towers",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400076"
      }
    },
    {
      name: "Rahul Sharma",
      email: "rahul.sharma@techzone.io",
      password: "password123",
      phone: "9876543210",
      address: {
        street: "Flat 402, Skyline Towers, Hiranandani",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400076"
      }
    },
    {
      name: "Priya Sharma",
      email: "priya@example.com",
      password: "password123",
      phone: "9822111234",
      address: {
        street: "12, Green Glen Layout, Bellandur",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560103"
      }
    }
  ];

  for (const uData of defaultUsers) {
    let user = await User.findOne({ email: uData.email });
    if (!user) {
      user = new User(uData);
      await user.save();
      console.log("Created user:", user.email);
    } else {
      console.log("User already exists:", user.email);
    }

    // Link orders
    const updated = await Order.updateMany(
      { "customer.email": new RegExp("^" + user.email + "$", "i") },
      { $set: { userId: user._id } }
    );
    console.log("Linked orders for", user.email, "Matched/Updated:", updated.modifiedCount);
  }

  // Ensure all orders have statusTimeline & estimatedDeliveryDate
  const orders = await Order.find();
  for (const ord of orders) {
    let changed = false;
    if (!ord.statusTimeline || ord.statusTimeline.length === 0) {
      ord.statusTimeline = [
        {
          status: ord.status || "Pending",
          timestamp: ord.createdAt || new Date(),
          note: "Order placed successfully"
        }
      ];
      changed = true;
    }
    if (!ord.estimatedDeliveryDate) {
      const est = new Date(ord.createdAt || Date.now());
      est.setDate(est.getDate() + 4);
      ord.estimatedDeliveryDate = est;
      changed = true;
    }
    if (changed) {
      await ord.save();
    }
  }

  console.log("Finished seeding users & linking orders.");
  process.exit(0);
}

seedUsers().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
