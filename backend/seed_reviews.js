require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./models/Product");
const Review = require("./models/Review");

const sampleCustomerReviews = [
  // Reviews for OnePlus 13
  {
    productName: "OnePlus 13",
    customerName: "Vikram Malhotra",
    customerEmail: "vikram.m@gmail.com",
    userId: "cust_vikram_101",
    rating: 5,
    title: "Flagship beast! Battery life and display are phenomenal",
    comment: "Upgraded from my 3-year-old phone and the difference is night and day. The LTPO AMOLED display is buttery smooth at 120Hz, charging takes barely 25 minutes to full, and the camera processing produces sharp, vibrant shots. Best flagship value right now.",
    isVerifiedPurchase: true,
    helpfulVotes: 14,
    daysAgo: 3
  },
  {
    productName: "OnePlus 13",
    customerName: "Ananya Deshmukh",
    customerEmail: "ananya.d@outlook.com",
    userId: "cust_ananya_102",
    rating: 4,
    title: "Sleek design and fast performance",
    comment: "Very premium feel in the hand and OxygenOS is super fluid with zero lag. The haptics are top-tier. Only minor gripe is that the camera bump is slightly thick, but with the case on it sits fine.",
    isVerifiedPurchase: true,
    helpfulVotes: 6,
    daysAgo: 7
  },
  {
    productName: "OnePlus 13",
    customerName: "Karthik Raja",
    customerEmail: "karthik.raja@techzone.io",
    userId: "cust_karthik_103",
    rating: 5,
    title: "Amazing thermal performance during heavy gaming",
    comment: "Tested Genshin Impact and COD Mobile for 2 hours straight. Never dropped frames and thermals stayed well within comfortable limits. The stereo speakers are loud and immersive.",
    isVerifiedPurchase: false,
    helpfulVotes: 9,
    daysAgo: 12
  },

  // Reviews for JBL Tune 720BT
  {
    productName: "JBL Tune 720BT",
    customerName: "Rohit Nair",
    customerEmail: "rohit.nair@yahoo.com",
    userId: "cust_rohit_201",
    rating: 5,
    title: "Pure Bass Sound that actually delivers!",
    comment: "JBL's signature bass response is punchy without muddying the vocal clarity. Ear cushions are soft for long work-from-home zoom calls, and the 76-hour battery is unbelievable—I charge it once every two weeks!",
    isVerifiedPurchase: true,
    helpfulVotes: 18,
    daysAgo: 4
  },
  {
    productName: "JBL Tune 720BT",
    customerName: "Shreya Sen",
    customerEmail: "shreya.sen@gmail.com",
    userId: "cust_shreya_202",
    rating: 4,
    title: "Great value wireless headphones",
    comment: "Lightweight, folds easily into my backpack, and bluetooth pairing with both my laptop and phone simultaneously is seamless. Highly recommended for daily commuters.",
    isVerifiedPurchase: true,
    helpfulVotes: 5,
    daysAgo: 10
  },
  {
    productName: "JBL Tune 720BT",
    customerName: "Deepak Agarwal",
    customerEmail: "deepak.a@corp.com",
    userId: "cust_deepak_203",
    rating: 3,
    title: "Good sound but clamping force is slightly tight",
    comment: "Audio quality and battery life are easily 5-star, but if you have a slightly larger head size like me, you might feel some pressure around the temples after 2+ hours.",
    isVerifiedPurchase: false,
    helpfulVotes: 11,
    daysAgo: 16
  },

  // Reviews for Apple AirPods Pro (2nd Gen)
  {
    productName: "Apple AirPods Pro (2nd Gen)",
    customerName: "Priya Patel",
    customerEmail: "priya.p@gmail.com",
    userId: "cust_priya_301",
    rating: 5,
    title: "Noise cancellation is pure magic",
    comment: "Adaptive Audio and Transparency mode make everyday subway commutes peaceful. Spatial Audio with head tracking makes movies feel like a personal theater. Worth every rupee.",
    isVerifiedPurchase: true,
    helpfulVotes: 23,
    daysAgo: 2
  },
  {
    productName: "Apple AirPods Pro (2nd Gen)",
    customerName: "Sameer Joshi",
    customerEmail: "sameer.j@gmail.com",
    userId: "cust_sameer_302",
    rating: 5,
    title: "Unmatched Apple ecosystem integration",
    comment: "Instant pairing between Mac, iPad, and iPhone. The mic clarity in busy coffee shops is surprisingly good due to background voice isolation. Best everyday earbuds period.",
    isVerifiedPurchase: true,
    helpfulVotes: 8,
    daysAgo: 9
  },

  // Reviews for ASUS Vivobook 15
  {
    productName: "ASUS Vivobook 15",
    customerName: "Rohan Kapoor",
    customerEmail: "rohan.k@gmail.com",
    userId: "cust_rohan_401",
    rating: 4,
    title: "Solid workhorse for college and programming",
    comment: "Core i5 12th gen handles VS Code, multiple browser tabs, and Spotify with zero stutters. Keyboard travel is comfortable and the fingerprint sensor is snappy. Battery lasts around 6-7 hours on mixed productivity.",
    isVerifiedPurchase: true,
    helpfulVotes: 12,
    daysAgo: 5
  },
  {
    productName: "ASUS Vivobook 15",
    customerName: "Meera Krishnan",
    customerEmail: "meera.k@outlook.com",
    userId: "cust_meera_402",
    rating: 5,
    title: "Crisp display and fast NVMe boot times",
    comment: "Boots in under 7 seconds. The anti-glare screen is easy on the eyes during long study sessions. Very lightweight charger too.",
    isVerifiedPurchase: false,
    helpfulVotes: 4,
    daysAgo: 14
  },

  // Reviews for Samsung Galaxy S24
  {
    productName: "Samsung Galaxy S24",
    customerName: "Aditya Mehta",
    customerEmail: "aditya.m@gmail.com",
    userId: "cust_aditya_501",
    rating: 5,
    title: "Compact flagship perfection with Galaxy AI",
    comment: "The size fits perfectly in one hand. Circle to Search and live translation features are actually useful in daily work. Display brightness under direct sunlight is incredible.",
    isVerifiedPurchase: true,
    helpfulVotes: 16,
    daysAgo: 6
  },
  {
    productName: "Samsung Galaxy S24",
    customerName: "Neha Chawla",
    customerEmail: "neha.c@gmail.com",
    userId: "cust_neha_502",
    rating: 4,
    title: "Great cameras and 7 years of OS updates",
    comment: "Nightography has improved substantially over the S23. 120Hz flat display with thin bezels looks gorgeous. Only wishing the charging speed was 45W instead of 25W.",
    isVerifiedPurchase: true,
    helpfulVotes: 7,
    daysAgo: 11
  },

  // Reviews for boAt Wave Call
  {
    productName: "boAt Wave Call",
    customerName: "Amitabh Banerjee",
    customerEmail: "amitabh.b@gmail.com",
    userId: "cust_amitabh_601",
    rating: 4,
    title: "Good calling quality at an affordable price",
    comment: "Bluetooth calls are crisp, step tracking is fairly accurate, and the dialer works well. Battery gives 4 days with moderate call usage. Great budget smartwatch.",
    isVerifiedPurchase: true,
    helpfulVotes: 10,
    daysAgo: 8
  }
];

async function seedReviews() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/techzone");
    console.log("Connected to MongoDB for seeding reviews");

    // Clear existing reviews
    await Review.deleteMany({});
    console.log("Cleared existing reviews");

    const allProducts = await Product.find({});
    console.log(`Found ${allProducts.length} products in database`);

    const createdReviews = [];

    for (const sample of sampleCustomerReviews) {
      // Find matching product
      const product = allProducts.find(p =>
        p.name.toLowerCase().includes(sample.productName.toLowerCase())
      );

      if (product) {
        const createdDate = new Date(Date.now() - (sample.daysAgo || 1) * 86400000);
        const review = await Review.create({
          productId: product._id,
          productIdStr: String(product._id),
          userId: sample.userId,
          customerName: sample.customerName,
          customerEmail: sample.customerEmail,
          rating: sample.rating,
          title: sample.title,
          comment: sample.comment,
          isVerifiedPurchase: sample.isVerifiedPurchase,
          helpfulVotes: sample.helpfulVotes || 0,
          helpfulUsers: [],
          createdAt: createdDate,
          updatedAt: createdDate
        });
        createdReviews.push(review);
      }
    }

    console.log(`Seeded ${createdReviews.length} real customer reviews!`);

    // Recalculate dynamic ratings and sync with Product documents
    for (const product of allProducts) {
      const pReviews = await Review.find({ productIdStr: String(product._id) });
      const count = pReviews.length;
      if (count > 0) {
        const sum = pReviews.reduce((acc, r) => acc + r.rating, 0);
        const avg = Math.round((sum / count) * 10) / 10;
        await Product.findByIdAndUpdate(product._id, {
          rating: avg,
          reviews: count
        });
        console.log(`Product "${product.name}": Updated to rating ${avg} (${count} reviews)`);
      } else {
        // Products with no reviews yet
        await Product.findByIdAndUpdate(product._id, {
          rating: 0,
          reviews: 0
        });
        console.log(`Product "${product.name}": Reset to 0 reviews (to test empty state)`);
      }
    }

    console.log("Review seeding and dynamic product rating calculation complete!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding reviews failed:", error);
    process.exit(1);
  }
}

seedReviews();
