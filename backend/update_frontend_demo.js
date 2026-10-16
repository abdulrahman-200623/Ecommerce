require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const Product = require("./models/Product");

async function updateMainDemo() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/techzone");
  const prods = await Product.find({}, { __v: 0 }).lean();
  console.log("Fetched", prods.length, "products for main.jsx demo array.");

  const mainPath = "../frontend/src/main.jsx";
  let mainContent = fs.readFileSync(mainPath, "utf8");

  const demoProds = prods.map((p, idx) => ({
    _id: String(p._id || idx + 1),
    name: p.name,
    description: p.description,
    price: p.price,
    originalPrice: p.originalPrice || p.price,
    discount: p.discount || 0,
    category: p.category,
    image: p.image,
    images: p.images || [p.image],
    rating: p.rating || 4.5,
    reviews: p.reviews || 0,
    stock: p.stock || 0
  }));

  const demoStr = "const demo=" + JSON.stringify(demoProds, null, 2) + ";";
  mainContent = mainContent.replace(/const demo\s*=\s*\[[\s\S]*?\n\];/, demoStr);

  fs.writeFileSync(mainPath, mainContent, "utf8");
  console.log("Successfully updated demo array in main.jsx!");
  process.exit(0);
}

updateMainDemo().catch(err => {
  console.error(err);
  process.exit(1);
});
