require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const { bootstrapSuperAdmin } = require("./config/bootstrap");
const { initSocket } = require("./socket");

const app = express();
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());

connectDB().then(() => {
  bootstrapSuperAdmin();
}).catch((err) => {
  console.error("DB connection error in bootstrap:", err.message);
});

const server = http.createServer(app);
const io = initSocket(server);

app.get("/", (req, res) => res.json({ message: "TechZone API is running" }));
app.use("/api/superadmin", require("./routes/superAdmin"));
app.use("/api/admin", require("./routes/adminAuth"));
app.use("/api/products", require("./routes/products"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/users", require("./routes/users"));
app.use("/api/auth", require("./routes/users"));
app.use("/api/wishlist", require("./routes/wishlist"));
app.use("/api/reviews", require("./routes/reviews"));
app.use("/api/coupons", require("./routes/coupons"));
app.use("/api/support", require("./routes/support"));
app.use("/api/flash-sales", require("./routes/flashSales"));
app.use("/api/returns", require("./routes/returns"));
app.use("/api/recently-viewed", require("./routes/recentlyViewed"));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));

