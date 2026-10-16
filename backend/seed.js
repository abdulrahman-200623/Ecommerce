require("dotenv").config();
const mongoose=require("mongoose");
const Product=require("./models/Product");
const products=[
  {
    "name": "OnePlus 13",
    "description": "Powerful flagship smartphone",
    "price": 69999,
    "originalPrice": 79999,
    "discount": 12,
    "category": "Mobiles",
    "image": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80",
    "rating": 4.7,
    "reviews": 3,
    "stock": 20,
    "images": [
      "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1585060544812-6b45742d762f?auto=format&fit=crop&w=800&q=80"
    ]
  },
  {
    "name": "ASUS Vivobook 15",
    "description": "Intel Core i5 12th Gen | 8GB | 512GB SSD",
    "price": 44990,
    "originalPrice": 49990,
    "discount": 10,
    "category": "Laptops",
    "image": "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80",
    "rating": 4.5,
    "reviews": 2,
    "stock": 13,
    "images": [
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80"
    ]
  },
  {
    "name": "JBL Tune 720BT",
    "description": "Wireless Over-Ear Headphones",
    "price": 5099,
    "originalPrice": 5999,
    "discount": 15,
    "category": "Headphones",
    "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
    "rating": 4,
    "reviews": 3,
    "stock": 25,
    "images": [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80"
    ]
  },
  {
    "name": "boAt Wave Call",
    "description": "Bluetooth Calling Smartwatch",
    "price": 1999,
    "originalPrice": 2499,
    "discount": 20,
    "category": "Smartwatches",
    "image": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
    "rating": 4,
    "reviews": 1,
    "stock": 30,
    "images": [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80"
    ]
  },
  {
    "name": "Samsung Galaxy S24",
    "description": "8GB RAM | 256GB Storage",
    "price": 69999,
    "originalPrice": 75999,
    "discount": 8,
    "category": "Mobiles",
    "image": "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=800&q=80",
    "rating": 4.5,
    "reviews": 2,
    "stock": 18,
    "images": [
      "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=800&q=80"
    ]
  },
  {
    "name": "Apple AirPods Pro (2nd Gen)",
    "description": "Active Noise Cancellation",
    "price": 24999,
    "originalPrice": 30500,
    "discount": 18,
    "category": "Earbuds",
    "image": "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80",
    "rating": 5,
    "reviews": 2,
    "stock": 22,
    "images": [
      "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1588423771073-b8903fbb85b5?auto=format&fit=crop&w=800&q=80"
    ]
  },
  {
    "name": "LG 24MP60G",
    "description": "24-inch Full HD Monitor | 75Hz",
    "price": 10999,
    "originalPrice": 12999,
    "discount": 14,
    "category": "Monitors",
    "image": "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80",
    "rating": 4.5,
    "reviews": 0,
    "stock": 12,
    "images": [
      "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&w=800&q=80"
    ]
  },
  {
    "name": "Anker 20W Fast Charger",
    "description": "Type-C PD Charger",
    "price": 1499,
    "originalPrice": 1999,
    "discount": 25,
    "category": "Accessories",
    "image": "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=800&q=80",
    "rating": 4.5,
    "reviews": 0,
    "stock": 40,
    "images": [
      "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1622445268065-25a8942b7c63?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80"
    ]
  },
  {
    "name": "iPhone 16",
    "description": "Premium mobiles product with modern features",
    "price": 20499,
    "originalPrice": 23573,
    "discount": 15,
    "category": "Mobiles",
    "image": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80",
    "rating": 0,
    "reviews": 0,
    "stock": 18,
    "images": [
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1574755393849-623942496936?auto=format&fit=crop&w=800&q=80"
    ]
  },
  {
    "name": "Google Pixel 9",
    "description": "Premium laptops product with modern features",
    "price": 22874,
    "originalPrice": 26305,
    "discount": 15,
    "category": "Laptops",
    "image": "https://images.unsplash.com/photo-1567581935884-3349723552ca?auto=format&fit=crop&w=800&q=80",
    "rating": 0,
    "reviews": 0,
    "stock": 19,
    "images": [
      "https://images.unsplash.com/photo-1567581935884-3349723552ca?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1575695342320-d2d2d2f9b73f?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80"
    ]
  },
  {
    "name": "Redmi Note 14 Pro",
    "description": "Premium headphones product with modern features",
    "price": 25249,
    "originalPrice": 29036,
    "discount": 15,
    "category": "Headphones",
    "image": "https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=800&q=80",
    "rating": 0,
    "reviews": 0,
    "stock": 20,
    "images": [
      "https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1567581935884-3349723552ca?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?auto=format&fit=crop&w=800&q=80"
    ]
  },
  {
    "name": "Nothing Phone 2a",
    "description": "Premium smartwatches product with modern features",
    "price": 27624,
    "originalPrice": 31767,
    "discount": 15,
    "category": "Smartwatches",
    "image": "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=800&q=80",
    "rating": 4.5,
    "reviews": 0,
    "stock": 21,
    "images": [
      "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1575695342320-d2d2d2f9b73f?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1556656793-08538906a9f8?auto=format&fit=crop&w=800&q=80"
    ]
  },
  {
    "name": "HP Pavilion 15",
    "description": "Premium earbuds product with modern features",
    "price": 29999,
    "originalPrice": 34498,
    "discount": 15,
    "category": "Earbuds",
    "image": "https://images.unsplash.com/photo-1544731612-de292439cc67?auto=format&fit=crop&w=800&q=80",
    "rating": 0,
    "reviews": 0,
    "stock": 22,
    "images": [
      "https://images.unsplash.com/photo-1544731612-de292439cc67?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80"
    ]
  },
  {
    "name": "Lenovo IdeaPad Slim 3",
    "description": "Premium monitors product with modern features",
    "price": 32374,
    "originalPrice": 37230,
    "discount": 15,
    "category": "Monitors",
    "image": "https://images.unsplash.com/photo-1588702547919-26089e690ecc?auto=format&fit=crop&w=800&q=80",
    "rating": 0,
    "reviews": 0,
    "stock": 23,
    "images": [
      "https://images.unsplash.com/photo-1588702547919-26089e690ecc?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80"
    ]
  },
  {
    "name": "Acer Aspire 5",
    "description": "Premium accessories product with modern features",
    "price": 34749,
    "originalPrice": 39961,
    "discount": 15,
    "category": "Accessories",
    "image": "https://images.unsplash.com/photo-1522199755839-a2bacb67c546?auto=format&fit=crop&w=800&q=80",
    "rating": 0,
    "reviews": 0,
    "stock": 24,
    "images": [
      "https://images.unsplash.com/photo-1522199755839-a2bacb67c546?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1504707748692-419802cf939d?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80"
    ]
  },
  {
    "name": "Dell Inspiron 15",
    "description": "Premium gaming product with modern features",
    "price": 37124,
    "originalPrice": 42692,
    "discount": 15,
    "category": "Gaming",
    "image": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
    "rating": 0,
    "reviews": 0,
    "stock": 25,
    "images": [
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1544731612-de292439cc67?auto=format&fit=crop&w=800&q=80"
    ]
  },
  {
    "name": "Sony WH-1000XM5",
    "description": "Premium mobiles product with modern features",
    "price": 39499,
    "originalPrice": 45423,
    "discount": 15,
    "category": "Mobiles",
    "image": "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=800&q=80",
    "rating": 4.5,
    "reviews": 0,
    "stock": 26,
    "images": [
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1577174881658-0f30ed549adc?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80"
    ]
  },
  {
    "name": "boAt Rockerz 550",
    "description": "Premium laptops product with modern features",
    "price": 41874,
    "originalPrice": 48155,
    "discount": 15,
    "category": "Laptops",
    "image": "https://images.unsplash.com/photo-1545127398-14699f92334b?auto=format&fit=crop&w=800&q=80",
    "rating": 0,
    "reviews": 0,
    "stock": 27,
    "images": [
      "https://images.unsplash.com/photo-1545127398-14699f92334b?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1487215078519-e21cc028cb29?auto=format&fit=crop&w=800&q=80"
    ]
  },
  {
    "name": "Noise ColorFit Pro",
    "description": "Premium headphones product with modern features",
    "price": 44249,
    "originalPrice": 50886,
    "discount": 15,
    "category": "Headphones",
    "image": "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=800&q=80",
    "rating": 0,
    "reviews": 0,
    "stock": 28,
    "images": [
      "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80"
    ]
  },
  {
    "name": "Fire-Boltt Phoenix",
    "description": "Premium smartwatches product with modern features",
    "price": 46624,
    "originalPrice": 53617,
    "discount": 15,
    "category": "Smartwatches",
    "image": "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80",
    "rating": 4.5,
    "reviews": 0,
    "stock": 29,
    "images": [
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1509741102003-ca64bfe5f069?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80"
    ]
  },
  {
    "name": "Samsung Galaxy Buds FE",
    "description": "Premium earbuds product with modern features",
    "price": 48999,
    "originalPrice": 56348,
    "discount": 15,
    "category": "Earbuds",
    "image": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80",
    "rating": 0,
    "reviews": 0,
    "stock": 30,
    "images": [
      "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1608156639585-b3a032ef9689?auto=format&fit=crop&w=800&q=80"
    ]
  },
  {
    "name": "Realme Buds Air 6",
    "description": "Premium monitors product with modern features",
    "price": 51374,
    "originalPrice": 59080,
    "discount": 15,
    "category": "Monitors",
    "image": "https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?auto=format&fit=crop&w=800&q=80",
    "rating": 0,
    "reviews": 0,
    "stock": 31,
    "images": [
      "https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1608156639585-b3a032ef9689?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80"
    ]
  },
  {
    "name": "Acer 24-inch Monitor",
    "description": "Premium accessories product with modern features",
    "price": 53749,
    "originalPrice": 61811,
    "discount": 15,
    "category": "Accessories",
    "image": "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80",
    "rating": 0,
    "reviews": 0,
    "stock": 32,
    "images": [
      "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80"
    ]
  },
  {
    "name": "Samsung 27-inch Monitor",
    "description": "Premium gaming product with modern features",
    "price": 56124,
    "originalPrice": 64542,
    "discount": 15,
    "category": "Gaming",
    "image": "https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&w=800&q=80",
    "rating": 0,
    "reviews": 0,
    "stock": 33,
    "images": [
      "https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?auto=format&fit=crop&w=800&q=80"
    ]
  },
  {
    "name": "Logitech K380",
    "description": "Premium mobiles product with modern features",
    "price": 58499,
    "originalPrice": 67273,
    "discount": 15,
    "category": "Mobiles",
    "image": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80",
    "rating": 0,
    "reviews": 0,
    "stock": 34,
    "images": [
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80"
    ]
  },
  {
    "name": "Logitech M331 Mouse",
    "description": "Premium laptops product with modern features",
    "price": 60874,
    "originalPrice": 70005,
    "discount": 15,
    "category": "Laptops",
    "image": "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=800&q=80",
    "rating": 0,
    "reviews": 0,
    "stock": 35,
    "images": [
      "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1586953208448-b95a79798f07?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80"
    ]
  },
  {
    "name": "TP-Link WiFi Router",
    "description": "Premium headphones product with modern features",
    "price": 63249,
    "originalPrice": 72736,
    "discount": 15,
    "category": "Headphones",
    "image": "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80",
    "rating": 0,
    "reviews": 0,
    "stock": 36,
    "images": [
      "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1588702547919-26089e690ecc?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80"
    ]
  },
  {
    "name": "Mi Power Bank 20000",
    "description": "Premium smartwatches product with modern features",
    "price": 65624,
    "originalPrice": 75467,
    "discount": 15,
    "category": "Smartwatches",
    "image": "https://images.unsplash.com/photo-1609592424109-dd9892f1b177?auto=format&fit=crop&w=800&q=80",
    "rating": 0,
    "reviews": 0,
    "stock": 37,
    "images": [
      "https://images.unsplash.com/photo-1609592424109-dd9892f1b177?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=800&q=80"
    ]
  },
  {
    "name": "Zebronics Gaming Mouse",
    "description": "Premium earbuds product with modern features",
    "price": 67999,
    "originalPrice": 78198,
    "discount": 15,
    "category": "Earbuds",
    "image": "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80",
    "rating": 0,
    "reviews": 0,
    "stock": 38,
    "images": [
      "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1586953208448-b95a79798f07?auto=format&fit=crop&w=800&q=80"
    ]
  },
  {
    "name": "Cosmic Byte Keyboard",
    "description": "Premium monitors product with modern features",
    "price": 70374,
    "originalPrice": 80930,
    "discount": 15,
    "category": "Monitors",
    "image": "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=800&q=80",
    "rating": 4.5,
    "reviews": 0,
    "stock": 39,
    "images": [
      "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80"
    ]
  },
  {
    "name": "Redmi Buds 6",
    "description": "Premium accessories product with modern features",
    "price": 2749,
    "originalPrice": 3249,
    "discount": 15,
    "category": "Accessories",
    "image": "https://images.unsplash.com/photo-1608156639585-b3a032ef9689?auto=format&fit=crop&w=800&q=80",
    "rating": 3,
    "reviews": 1,
    "stock": 40,
    "images": [
      "https://images.unsplash.com/photo-1608156639585-b3a032ef9689?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80"
    ]
  },
  {
    "name": "Realme Watch 5",
    "description": "Premium gaming product with modern features",
    "price": 5124,
    "originalPrice": 5892,
    "discount": 15,
    "category": "Gaming",
    "image": "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80",
    "rating": 0,
    "reviews": 0,
    "stock": 41,
    "images": [
      "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=800&q=80"
    ]
  },
  {
    "name": "Motorola Edge 60",
    "description": "Premium mobiles product with modern features",
    "price": 7499,
    "originalPrice": 8623,
    "discount": 15,
    "category": "Mobiles",
    "image": "https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?auto=format&fit=crop&w=800&q=80",
    "rating": 4.5,
    "reviews": 0,
    "stock": 42,
    "images": [
      "https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1556656793-08538906a9f8?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=800&q=80"
    ]
  },
  {
    "name": "HP Victus Gaming",
    "description": "Premium laptops product with modern features",
    "price": 9874,
    "originalPrice": 11355,
    "discount": 15,
    "category": "Laptops",
    "image": "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=800&q=80",
    "rating": 4.5,
    "reviews": 0,
    "stock": 42,
    "images": [
      "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=800&q=80"
    ]
  },
  {
    "name": "Sony XB100 Speaker",
    "description": "Premium smartwatches product with modern features",
    "price": 14624,
    "originalPrice": 16817,
    "discount": 15,
    "category": "Smartwatches",
    "image": "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80",
    "rating": 0,
    "reviews": 0,
    "stock": 45,
    "images": [
      "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80"
    ]
  },
  {
    "name": "JBL Flip Speaker",
    "description": "Premium earbuds product with modern features",
    "price": 16999,
    "originalPrice": 19548,
    "discount": 15,
    "category": "Earbuds",
    "image": "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80",
    "rating": 0,
    "reviews": 0,
    "stock": 46,
    "images": [
      "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80"
    ]
  },
  {
    "name": "Samsung SSD 1TB",
    "description": "Premium monitors product with modern features",
    "price": 19374,
    "originalPrice": 22280,
    "discount": 15,
    "category": "Monitors",
    "image": "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=800&q=80",
    "rating": 0,
    "reviews": 0,
    "stock": 47,
    "images": [
      "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1625961332771-3f40b0e2bdcf?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1609592424109-dd9892f1b177?auto=format&fit=crop&w=800&q=80"
    ]
  },
  {
    "name": "WD External HDD",
    "description": "Premium accessories product with modern features",
    "price": 21749,
    "originalPrice": 25011,
    "discount": 15,
    "category": "Accessories",
    "image": "https://images.unsplash.com/photo-1625961332771-3f40b0e2bdcf?auto=format&fit=crop&w=800&q=80",
    "rating": 0,
    "reviews": 0,
    "stock": 48,
    "images": [
      "https://images.unsplash.com/photo-1625961332771-3f40b0e2bdcf?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1609592424109-dd9892f1b177?auto=format&fit=crop&w=800&q=80"
    ]
  },
  {
    "name": "Canon Printer",
    "description": "Premium gaming product with modern features",
    "price": 24124,
    "originalPrice": 27742,
    "discount": 15,
    "category": "Gaming",
    "image": "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=800&q=80",
    "rating": 0,
    "reviews": 0,
    "stock": 49,
    "images": [
      "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80"
    ]
  },
  {
    "name": "OnePlus 13 Plus",
    "description": "Powerful flagship smartphone",
    "price": 69499,
    "originalPrice": 79999,
    "discount": 12,
    "category": "Mobiles",
    "image": "https://images.unsplash.com/photo-1567581935884-3349723552ca?auto=format&fit=crop&w=800&q=80",
    "rating": 4.5,
    "reviews": 0,
    "stock": 20,
    "images": [
      "https://images.unsplash.com/photo-1567581935884-3349723552ca?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1575695342320-d2d2d2f9b73f?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1533228801458-3965902047db?auto=format&fit=crop&w=800&q=80"
    ]
  },
  {
    "name": "ASUS Vivobook 15 Plus",
    "description": "Intel Core i5 12th Gen | 8GB | 512GB SSD",
    "price": 44490,
    "originalPrice": 49990,
    "discount": 10,
    "category": "Laptops",
    "image": "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80",
    "rating": 0,
    "reviews": 0,
    "stock": 15,
    "images": [
      "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80"
    ]
  },
  {
    "name": "JBL Tune 720BT Plus",
    "description": "Wireless Over-Ear Headphones",
    "price": 4599,
    "originalPrice": 5999,
    "discount": 15,
    "category": "Headphones",
    "image": "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80",
    "rating": 0,
    "reviews": 0,
    "stock": 25,
    "images": [
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80"
    ]
  },
  {
    "name": "boAt Wave Call Plus",
    "description": "Bluetooth Calling Smartwatch",
    "price": 1499,
    "originalPrice": 2499,
    "discount": 20,
    "category": "Smartwatches",
    "image": "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80",
    "rating": 4.5,
    "reviews": 0,
    "stock": 30,
    "images": [
      "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80"
    ]
  },
  {
    "name": "Samsung Galaxy S24 Plus",
    "description": "8GB RAM | 256GB Storage",
    "price": 69499,
    "originalPrice": 75999,
    "discount": 8,
    "category": "Mobiles",
    "image": "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=800&q=80",
    "rating": 4.5,
    "reviews": 0,
    "stock": 18,
    "images": [
      "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1546054454-aa26e2b734c7?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1585060544812-6b45742d762f?auto=format&fit=crop&w=800&q=80"
    ]
  },
  {
    "name": "Apple AirPods Pro (2nd Gen) Plus",
    "description": "Active Noise Cancellation",
    "price": 24499,
    "originalPrice": 30500,
    "discount": 18,
    "category": "Earbuds",
    "image": "https://images.unsplash.com/photo-1588423771073-b8903fbb85b5?auto=format&fit=crop&w=800&q=80",
    "rating": 0,
    "reviews": 0,
    "stock": 22,
    "images": [
      "https://images.unsplash.com/photo-1588423771073-b8903fbb85b5?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=800&q=80"
    ]
  },
  {
    "name": "LG 24MP60G Plus",
    "description": "24-inch Full HD Monitor | 75Hz",
    "price": 10499,
    "originalPrice": 12999,
    "discount": 14,
    "category": "Monitors",
    "image": "https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?auto=format&fit=crop&w=800&q=80",
    "rating": 0,
    "reviews": 0,
    "stock": 12,
    "images": [
      "https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&w=800&q=80"
    ]
  },
  {
    "name": "Anker 20W Fast Charger Plus",
    "description": "Type-C PD Charger",
    "price": 999,
    "originalPrice": 1999,
    "discount": 25,
    "category": "Accessories",
    "image": "https://images.unsplash.com/photo-1622445268065-25a8942b7c63?auto=format&fit=crop&w=800&q=80",
    "rating": 0,
    "reviews": 0,
    "stock": 40,
    "images": [
      "https://images.unsplash.com/photo-1622445268065-25a8942b7c63?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80"
    ]
  },
  {
    "name": "iPhone 16 Plus",
    "description": "Premium mobiles product with modern features",
    "price": 19999,
    "originalPrice": 23573,
    "discount": 15,
    "category": "Mobiles",
    "image": "https://images.unsplash.com/photo-1591337676887-a217a6970a8a?auto=format&fit=crop&w=800&q=80",
    "rating": 0,
    "reviews": 0,
    "stock": 18,
    "images": [
      "https://images.unsplash.com/photo-1591337676887-a217a6970a8a?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1512054502232-10a0a035d672?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1530319067432-f2a729c03db5?auto=format&fit=crop&w=800&q=80"
    ]
  },
  {
    "name": "Google Pixel 9 Plus",
    "description": "Premium laptops product with modern features",
    "price": 22374,
    "originalPrice": 26305,
    "discount": 15,
    "category": "Laptops",
    "image": "https://images.unsplash.com/photo-1575695342320-d2d2d2f9b73f?auto=format&fit=crop&w=800&q=80",
    "rating": 0,
    "reviews": 0,
    "stock": 19,
    "images": [
      "https://images.unsplash.com/photo-1575695342320-d2d2d2f9b73f?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1567581935884-3349723552ca?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1533228801458-3965902047db?auto=format&fit=crop&w=800&q=80"
    ]
  },
  {
    "name": "iphone 17 pro max",
    "description": "Premium flagship smartphone with dynamic AMOLED 2X display, quad telephoto camera system, and ultra-durable titanium frame.",
    "price": 99999,
    "originalPrice": 119999,
    "discount": 17,
    "category": "Mobiles",
    "image": "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=80",
    "rating": 4.5,
    "reviews": 0,
    "stock": 14,
    "images": [
      "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80"
    ]
  }
];
(async()=>{try{await mongoose.connect(process.env.MONGO_URI);await Product.deleteMany({});await Product.insertMany(products);console.log(`Seeded ${products.length} products`);process.exit(0)}catch(e){console.error(e);process.exit(1)}})();
