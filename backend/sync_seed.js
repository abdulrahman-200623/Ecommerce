require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const Product = require("./models/Product");

async function sync() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/techzone");
  const prods = await Product.find({}, { __v: 0, _id: 0, createdAt: 0, updatedAt: 0 }).lean();
  console.log("Fetched", prods.length, "products from MongoDB.");

  const fileContent = `require("dotenv").config();
const mongoose=require("mongoose");
const Product=require("./models/Product");
const products=${JSON.stringify(prods, null, 2)};
(async()=>{try{await mongoose.connect(process.env.MONGO_URI);await Product.deleteMany({});await Product.insertMany(products);console.log(\`Seeded \${products.length} products\`);process.exit(0)}catch(e){console.error(e);process.exit(1)}})();
`;

  fs.writeFileSync("./seed.js", fileContent, "utf8");
  console.log("Successfully synced seed.js with all 3 images!");
  process.exit(0);
}

sync().catch(err => {
  console.error(err);
  process.exit(1);
});
