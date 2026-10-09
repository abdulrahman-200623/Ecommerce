import React,{useEffect,useMemo,useState}from"react";import{createRoot}from"react-dom/client";import{BrowserRouter,Link}from"react-router-dom";import{Search,ShoppingCart,UserRound,UserPlus,Heart,ChevronDown,Star,Truck,SlidersHorizontal,Globe2,ArrowRight,ShieldCheck,CheckCircle2,X}from"lucide-react";import axios from"axios";import"./styles.css";import AdminPanel from"./AdminPanel";
const demo=[
  {
    "_id": "1",
    "name": "OnePlus 13",
    "description": "Powerful flagship smartphone",
    "price": 69999,
    "originalPrice": 79999,
    "discount": 12,
    "category": "Mobiles",
    "image": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=700&q=80",
    "rating": 4.5,
    "reviews": 120,
    "stock": 20
  },
  {
    "_id": "2",
    "name": "ASUS Vivobook 15",
    "description": "Intel Core i5 12th Gen | 8GB | 512GB SSD",
    "price": 44990,
    "originalPrice": 49990,
    "discount": 10,
    "category": "Laptops",
    "image": "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=700&q=80",
    "rating": 4.3,
    "reviews": 85,
    "stock": 15
  },
  {
    "_id": "3",
    "name": "JBL Tune 720BT",
    "description": "Wireless Over-Ear Headphones",
    "price": 5099,
    "originalPrice": 5999,
    "discount": 15,
    "category": "Headphones",
    "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=700&q=80",
    "rating": 4.6,
    "reviews": 200,
    "stock": 25
  },
  {
    "_id": "4",
    "name": "boAt Wave Call",
    "description": "Bluetooth Calling Smartwatch",
    "price": 1999,
    "originalPrice": 2499,
    "discount": 20,
    "category": "Smartwatches",
    "image": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=700&q=80",
    "rating": 4.4,
    "reviews": 150,
    "stock": 30
  },
  {
    "_id": "5",
    "name": "Samsung Galaxy S24",
    "description": "8GB RAM | 256GB Storage",
    "price": 69999,
    "originalPrice": 75999,
    "discount": 8,
    "category": "Mobiles",
    "image": "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=700&q=80",
    "rating": 4.5,
    "reviews": 95,
    "stock": 18
  },
  {
    "_id": "6",
    "name": "Apple AirPods Pro (2nd Gen)",
    "description": "Active Noise Cancellation",
    "price": 24999,
    "originalPrice": 30500,
    "discount": 18,
    "category": "Earbuds",
    "image": "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=700&q=80",
    "rating": 4.7,
    "reviews": 180,
    "stock": 22
  },
  {
    "_id": "7",
    "name": "LG 24MP60G",
    "description": "24-inch Full HD Monitor | 75Hz",
    "price": 10999,
    "originalPrice": 12999,
    "discount": 14,
    "category": "Monitors",
    "image": "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=700&q=80",
    "rating": 4.4,
    "reviews": 110,
    "stock": 12
  },
  {
    "_id": "8",
    "name": "Anker 20W Fast Charger",
    "description": "Type-C PD Charger",
    "price": 1499,
    "originalPrice": 1999,
    "discount": 25,
    "category": "Accessories",
    "image": "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=700&q=80",
    "rating": 4.6,
    "reviews": 140,
    "stock": 40
  },
  {
    "_id": "9",
    "name": "iPhone 16",
    "description": "Premium mobiles product with modern features",
    "price": 20499,
    "originalPrice": 23573,
    "discount": 15,
    "category": "Mobiles",
    "image": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=700&q=80",
    "rating": 4.4,
    "reviews": 102,
    "stock": 18
  },
  {
    "_id": "10",
    "name": "Google Pixel 9",
    "description": "Premium laptops product with modern features",
    "price": 22874,
    "originalPrice": 26305,
    "discount": 15,
    "category": "Laptops",
    "image": "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=700&q=80",
    "rating": 4.5,
    "reviews": 106,
    "stock": 19
  },
  {
    "_id": "11",
    "name": "Redmi Note 14 Pro",
    "description": "Premium headphones product with modern features",
    "price": 25249,
    "originalPrice": 29036,
    "discount": 15,
    "category": "Headphones",
    "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=700&q=80",
    "rating": 4.6,
    "reviews": 110,
    "stock": 20
  },
  {
    "_id": "12",
    "name": "Nothing Phone 2a",
    "description": "Premium smartwatches product with modern features",
    "price": 27624,
    "originalPrice": 31767,
    "discount": 15,
    "category": "Smartwatches",
    "image": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=700&q=80",
    "rating": 4.7,
    "reviews": 114,
    "stock": 21
  },
  {
    "_id": "13",
    "name": "HP Pavilion 15",
    "description": "Premium earbuds product with modern features",
    "price": 29999,
    "originalPrice": 34498,
    "discount": 15,
    "category": "Earbuds",
    "image": "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=700&q=80",
    "rating": 4.2,
    "reviews": 118,
    "stock": 22
  },
  {
    "_id": "14",
    "name": "Lenovo IdeaPad Slim 3",
    "description": "Premium monitors product with modern features",
    "price": 32374,
    "originalPrice": 37230,
    "discount": 15,
    "category": "Monitors",
    "image": "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=700&q=80",
    "rating": 4.3,
    "reviews": 122,
    "stock": 23
  },
  {
    "_id": "15",
    "name": "Acer Aspire 5",
    "description": "Premium accessories product with modern features",
    "price": 34749,
    "originalPrice": 39961,
    "discount": 15,
    "category": "Accessories",
    "image": "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=700&q=80",
    "rating": 4.4,
    "reviews": 126,
    "stock": 24
  },
  {
    "_id": "16",
    "name": "Dell Inspiron 15",
    "description": "Premium gaming product with modern features",
    "price": 37124,
    "originalPrice": 42692,
    "discount": 15,
    "category": "Gaming",
    "image": "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=700&q=80",
    "rating": 4.5,
    "reviews": 130,
    "stock": 25
  },
  {
    "_id": "17",
    "name": "Sony WH-1000XM5",
    "description": "Premium mobiles product with modern features",
    "price": 39499,
    "originalPrice": 45423,
    "discount": 15,
    "category": "Mobiles",
    "image": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=700&q=80",
    "rating": 4.6,
    "reviews": 134,
    "stock": 26
  },
  {
    "_id": "18",
    "name": "boAt Rockerz 550",
    "description": "Premium laptops product with modern features",
    "price": 41874,
    "originalPrice": 48155,
    "discount": 15,
    "category": "Laptops",
    "image": "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=700&q=80",
    "rating": 4.7,
    "reviews": 138,
    "stock": 27
  },
  {
    "_id": "19",
    "name": "Noise ColorFit Pro",
    "description": "Premium headphones product with modern features",
    "price": 44249,
    "originalPrice": 50886,
    "discount": 15,
    "category": "Headphones",
    "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=700&q=80",
    "rating": 4.2,
    "reviews": 142,
    "stock": 28
  },
  {
    "_id": "20",
    "name": "Fire-Boltt Phoenix",
    "description": "Premium smartwatches product with modern features",
    "price": 46624,
    "originalPrice": 53617,
    "discount": 15,
    "category": "Smartwatches",
    "image": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=700&q=80",
    "rating": 4.3,
    "reviews": 146,
    "stock": 29
  },
  {
    "_id": "21",
    "name": "Samsung Galaxy Buds FE",
    "description": "Premium earbuds product with modern features",
    "price": 48999,
    "originalPrice": 56348,
    "discount": 15,
    "category": "Earbuds",
    "image": "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=700&q=80",
    "rating": 4.4,
    "reviews": 150,
    "stock": 30
  },
  {
    "_id": "22",
    "name": "Realme Buds Air 6",
    "description": "Premium monitors product with modern features",
    "price": 51374,
    "originalPrice": 59080,
    "discount": 15,
    "category": "Monitors",
    "image": "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=700&q=80",
    "rating": 4.5,
    "reviews": 154,
    "stock": 31
  },
  {
    "_id": "23",
    "name": "Acer 24-inch Monitor",
    "description": "Premium accessories product with modern features",
    "price": 53749,
    "originalPrice": 61811,
    "discount": 15,
    "category": "Accessories",
    "image": "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=700&q=80",
    "rating": 4.6,
    "reviews": 158,
    "stock": 32
  },
  {
    "_id": "24",
    "name": "Samsung 27-inch Monitor",
    "description": "Premium gaming product with modern features",
    "price": 56124,
    "originalPrice": 64542,
    "discount": 15,
    "category": "Gaming",
    "image": "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=700&q=80",
    "rating": 4.7,
    "reviews": 162,
    "stock": 33
  },
  {
    "_id": "25",
    "name": "Logitech K380",
    "description": "Premium mobiles product with modern features",
    "price": 58499,
    "originalPrice": 67273,
    "discount": 15,
    "category": "Mobiles",
    "image": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=700&q=80",
    "rating": 4.2,
    "reviews": 166,
    "stock": 34
  },
  {
    "_id": "26",
    "name": "Logitech M331 Mouse",
    "description": "Premium laptops product with modern features",
    "price": 60874,
    "originalPrice": 70005,
    "discount": 15,
    "category": "Laptops",
    "image": "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=700&q=80",
    "rating": 4.3,
    "reviews": 170,
    "stock": 35
  },
  {
    "_id": "27",
    "name": "TP-Link WiFi Router",
    "description": "Premium headphones product with modern features",
    "price": 63249,
    "originalPrice": 72736,
    "discount": 15,
    "category": "Headphones",
    "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=700&q=80",
    "rating": 4.4,
    "reviews": 174,
    "stock": 36
  },
  {
    "_id": "28",
    "name": "Mi Power Bank 20000",
    "description": "Premium smartwatches product with modern features",
    "price": 65624,
    "originalPrice": 75467,
    "discount": 15,
    "category": "Smartwatches",
    "image": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=700&q=80",
    "rating": 4.5,
    "reviews": 178,
    "stock": 37
  },
  {
    "_id": "29",
    "name": "Zebronics Gaming Mouse",
    "description": "Premium earbuds product with modern features",
    "price": 67999,
    "originalPrice": 78198,
    "discount": 15,
    "category": "Earbuds",
    "image": "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=700&q=80",
    "rating": 4.6,
    "reviews": 182,
    "stock": 38
  },
  {
    "_id": "30",
    "name": "Cosmic Byte Keyboard",
    "description": "Premium monitors product with modern features",
    "price": 70374,
    "originalPrice": 80930,
    "discount": 15,
    "category": "Monitors",
    "image": "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=700&q=80",
    "rating": 4.7,
    "reviews": 186,
    "stock": 39
  },
  {
    "_id": "31",
    "name": "Redmi Buds 6",
    "description": "Premium accessories product with modern features",
    "price": 2749,
    "originalPrice": 3249,
    "discount": 15,
    "category": "Accessories",
    "image": "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=700&q=80",
    "rating": 4.2,
    "reviews": 190,
    "stock": 40
  },
  {
    "_id": "32",
    "name": "Realme Watch 5",
    "description": "Premium gaming product with modern features",
    "price": 5124,
    "originalPrice": 5892,
    "discount": 15,
    "category": "Gaming",
    "image": "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=700&q=80",
    "rating": 4.3,
    "reviews": 194,
    "stock": 41
  },
  {
    "_id": "33",
    "name": "Motorola Edge 60",
    "description": "Premium mobiles product with modern features",
    "price": 7499,
    "originalPrice": 8623,
    "discount": 15,
    "category": "Mobiles",
    "image": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=700&q=80",
    "rating": 4.4,
    "reviews": 198,
    "stock": 42
  },
  {
    "_id": "34",
    "name": "HP Victus Gaming",
    "description": "Premium laptops product with modern features",
    "price": 9874,
    "originalPrice": 11355,
    "discount": 15,
    "category": "Laptops",
    "image": "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=700&q=80",
    "rating": 4.5,
    "reviews": 202,
    "stock": 43
  },
  {
    "_id": "35",
    "name": "Lenovo LOQ Gaming",
    "description": "Premium headphones product with modern features",
    "price": 12249,
    "originalPrice": 14086,
    "discount": 15,
    "category": "Headphones",
    "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=700&q=80",
    "rating": 4.6,
    "reviews": 206,
    "stock": 44
  },
  {
    "_id": "36",
    "name": "Sony XB100 Speaker",
    "description": "Premium smartwatches product with modern features",
    "price": 14624,
    "originalPrice": 16817,
    "discount": 15,
    "category": "Smartwatches",
    "image": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=700&q=80",
    "rating": 4.7,
    "reviews": 210,
    "stock": 45
  },
  {
    "_id": "37",
    "name": "JBL Flip Speaker",
    "description": "Premium earbuds product with modern features",
    "price": 16999,
    "originalPrice": 19548,
    "discount": 15,
    "category": "Earbuds",
    "image": "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=700&q=80",
    "rating": 4.2,
    "reviews": 214,
    "stock": 46
  },
  {
    "_id": "38",
    "name": "Samsung SSD 1TB",
    "description": "Premium monitors product with modern features",
    "price": 19374,
    "originalPrice": 22280,
    "discount": 15,
    "category": "Monitors",
    "image": "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=700&q=80",
    "rating": 4.3,
    "reviews": 218,
    "stock": 47
  },
  {
    "_id": "39",
    "name": "WD External HDD",
    "description": "Premium accessories product with modern features",
    "price": 21749,
    "originalPrice": 25011,
    "discount": 15,
    "category": "Accessories",
    "image": "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=700&q=80",
    "rating": 4.4,
    "reviews": 222,
    "stock": 48
  },
  {
    "_id": "40",
    "name": "Canon Printer",
    "description": "Premium gaming product with modern features",
    "price": 24124,
    "originalPrice": 27742,
    "discount": 15,
    "category": "Gaming",
    "image": "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=700&q=80",
    "rating": 4.5,
    "reviews": 226,
    "stock": 49
  },
  {
    "_id": "41",
    "name": "OnePlus 13 Plus",
    "description": "Powerful flagship smartphone",
    "price": 69499,
    "originalPrice": 79999,
    "discount": 12,
    "category": "Mobiles",
    "image": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=700&q=80",
    "rating": 4.5,
    "reviews": 130,
    "stock": 20
  },
  {
    "_id": "42",
    "name": "ASUS Vivobook 15 Plus",
    "description": "Intel Core i5 12th Gen | 8GB | 512GB SSD",
    "price": 44490,
    "originalPrice": 49990,
    "discount": 10,
    "category": "Laptops",
    "image": "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=700&q=80",
    "rating": 4.3,
    "reviews": 95,
    "stock": 15
  },
  {
    "_id": "43",
    "name": "JBL Tune 720BT Plus",
    "description": "Wireless Over-Ear Headphones",
    "price": 4599,
    "originalPrice": 5999,
    "discount": 15,
    "category": "Headphones",
    "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=700&q=80",
    "rating": 4.6,
    "reviews": 210,
    "stock": 25
  },
  {
    "_id": "44",
    "name": "boAt Wave Call Plus",
    "description": "Bluetooth Calling Smartwatch",
    "price": 1499,
    "originalPrice": 2499,
    "discount": 20,
    "category": "Smartwatches",
    "image": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=700&q=80",
    "rating": 4.4,
    "reviews": 160,
    "stock": 30
  },
  {
    "_id": "45",
    "name": "Samsung Galaxy S24 Plus",
    "description": "8GB RAM | 256GB Storage",
    "price": 69499,
    "originalPrice": 75999,
    "discount": 8,
    "category": "Mobiles",
    "image": "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=700&q=80",
    "rating": 4.5,
    "reviews": 105,
    "stock": 18
  },
  {
    "_id": "46",
    "name": "Apple AirPods Pro (2nd Gen) Plus",
    "description": "Active Noise Cancellation",
    "price": 24499,
    "originalPrice": 30500,
    "discount": 18,
    "category": "Earbuds",
    "image": "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=700&q=80",
    "rating": 4.7,
    "reviews": 190,
    "stock": 22
  },
  {
    "_id": "47",
    "name": "LG 24MP60G Plus",
    "description": "24-inch Full HD Monitor | 75Hz",
    "price": 10499,
    "originalPrice": 12999,
    "discount": 14,
    "category": "Monitors",
    "image": "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=700&q=80",
    "rating": 4.4,
    "reviews": 120,
    "stock": 12
  },
  {
    "_id": "48",
    "name": "Anker 20W Fast Charger Plus",
    "description": "Type-C PD Charger",
    "price": 999,
    "originalPrice": 1999,
    "discount": 25,
    "category": "Accessories",
    "image": "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=700&q=80",
    "rating": 4.6,
    "reviews": 150,
    "stock": 40
  },
  {
    "_id": "49",
    "name": "iPhone 16 Plus",
    "description": "Premium mobiles product with modern features",
    "price": 19999,
    "originalPrice": 23573,
    "discount": 15,
    "category": "Mobiles",
    "image": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=700&q=80",
    "rating": 4.4,
    "reviews": 112,
    "stock": 18
  },
  {
    "_id": "50",
    "name": "Google Pixel 9 Plus",
    "description": "Premium laptops product with modern features",
    "price": 22374,
    "originalPrice": 26305,
    "discount": 15,
    "category": "Laptops",
    "image": "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=700&q=80",
    "rating": 4.5,
    "reviews": 116,
    "stock": 19
  }
];
function goPath(path){window.history.pushState({},"",path);window.dispatchEvent(new PopStateEvent("popstate"))}
function pathKey(){
  const p=window.location.pathname; 
  if(p.startsWith('/admin')) return 'admin';
  if(p.startsWith('/products/')) return 'product-detail'; 
  if(p==='/products') return 'products'; 
  if(p==='/features') return 'features'; 
  if(p==='/enterprise') return 'enterprise'; 
  if(p==='/support') return 'support'; 
  if(p==='/pricing') return 'pricing'; 
  if(p==='/cart') return 'cart'; 
  return 'home';
}

const initialSampleOrders = [
  {
    _id: "ord_101",
    orderNumber: "TZ-91042",
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    customer: {
      name: "Rahul Sharma",
      email: "rahul.s@techzone.io",
      phone: "+91 98765 43210",
      address: "Flat 402, Skyline Towers, Powai",
      city: "Mumbai",
      pincode: "400076"
    },
    items: [
      { productId: "1", name: "OnePlus 13", price: 69999, qty: 1, image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=700&q=80" },
      { productId: "8", name: "Anker 20W Fast Charger", price: 1499, qty: 2, image: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=700&q=80" }
    ],
    totalAmount: 72997,
    status: "Processing",
    paymentMethod: "UPI / Net Banking"
  },
  {
    _id: "ord_102",
    orderNumber: "TZ-91043",
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    customer: {
      name: "Priya Patel",
      email: "priya.p@gmail.com",
      phone: "+91 98221 11234",
      address: "12, Green Glen Layout, Bellandur",
      city: "Bengaluru",
      pincode: "560103"
    },
    items: [
      { productId: "6", name: "Apple AirPods Pro (2nd Gen)", price: 24999, qty: 1, image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=700&q=80" }
    ],
    totalAmount: 24999,
    status: "Delivered",
    paymentMethod: "Credit Card"
  },
  {
    _id: "ord_103",
    orderNumber: "TZ-91044",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    customer: {
      name: "Arjun Verma",
      email: "arjun.v@yahoo.com",
      phone: "+91 91234 56789",
      address: "B-24, Vasant Kunj",
      city: "New Delhi",
      pincode: "110070"
    },
    items: [
      { productId: "3", name: "JBL Tune 720BT", price: 5099, qty: 1, image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=700&q=80" },
      { productId: "4", name: "boAt Wave Call", price: 1999, qty: 1, image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=700&q=80" }
    ],
    totalAmount: 7098,
    status: "Pending",
    paymentMethod: "Cash on Delivery"
  },
  {
    _id: "ord_104",
    orderNumber: "TZ-91045",
    createdAt: new Date(Date.now() - 3600000 * 32).toISOString(),
    customer: {
      name: "Sneha Reddy",
      email: "sneha.reddy@corp.com",
      phone: "+91 99887 76655",
      address: "Plot 88, Jubilee Hills",
      city: "Hyderabad",
      pincode: "500033"
    },
    items: [
      { productId: "2", name: "ASUS Vivobook 15", price: 44990, qty: 1, image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=700&q=80" },
      { productId: "7", name: "LG 24MP60G", price: 10999, qty: 1, image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=700&q=80" }
    ],
    totalAmount: 55989,
    status: "Shipped",
    paymentMethod: "EMI / Credit Card"
  }
];

function Header({count}){
  const nav=(key)=>goPath(key==='home'?'/':'/'+key);
  return <header className="topbar">
    <button className="mark" onClick={()=>nav('home')} aria-label="TechZone home"><Globe2 size={27}/></button>
    <nav className="mainnav">
      <button onClick={()=>nav('home')}>Home</button>
      <button onClick={()=>nav('products')}>Product</button>
      <button onClick={()=>nav('features')}>Features</button>
      <button onClick={()=>nav('enterprise')}>Enterprise</button>
      <button onClick={()=>nav('support')}>Support</button>
      <button onClick={()=>nav('pricing')}>Pricing</button>
    </nav>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <button className="cartIcon" onClick={()=>nav('cart')} aria-label="Open cart"><ShoppingCart size={27}/><span>{count}</span></button>
      <button className="adminPillBtn" onClick={()=>goPath('/admin')} aria-label="Open Admin Console"><ShieldCheck size={16}/> Admin</button>
    </div>
  </header>
}

function Card({p,add,onOpen}){
  return <article className="card" onClick={()=>onOpen(p)}>
    <b className="discount">{p.discount}% OFF</b>
    <button className="heart" onClick={e=>e.stopPropagation()}><Heart size={19}/></button>
    <div className="pic"><img src={p.image} alt={p.name}/></div>
    <div className="rating"><Star size={13} fill="#f4a300"/> {p.rating} <span>({p.reviews})</span></div>
    <h3>{p.name}</h3><p>{p.description}</p>
    <div className="price"><strong>₹{p.price.toLocaleString("en-IN")}</strong><del>₹{p.originalPrice.toLocaleString("en-IN")}</del><b>{p.discount}% off</b></div>
    <div className="delivery"><Truck size={14}/> Free Delivery <span>In Stock</span></div>
    <button className="add" onClick={e=>{e.stopPropagation();add(p)}}><ShoppingCart size={16}/>Add to Cart</button>
    <div className="viewHint">Click to view details</div>
  </article>
}

function ProductDetail({product,products,add}){
  if(!product) return <section className="page"><div className="emptyPage"><h1>Product not found</h1><button className="primaryBtn" onClick={()=>goPath('/products')}>Back to Products</button></div></section>;
  const related=products.filter(p=>p.category===product.category&&p._id!==product._id).slice(0,5);
  return <main className="page productPage">
    <button className="backBtn" onClick={()=>goPath('/products')}>← Back to Products</button>
    <section className="productDetail fullDetail">
      <div className="detailImage"><img src={product.image} alt={product.name}/></div>
      <div className="detailInfo"><span className="detailCat">{product.category}</span><h1>{product.name}</h1>
        <div className="detailRating"><Star size={16} fill="#f4a300"/> {product.rating} ({product.reviews} reviews)</div>
        <p>{product.description}</p>
        <div className="detailPrice">₹{product.price.toLocaleString("en-IN")} <del>₹{product.originalPrice.toLocaleString("en-IN")}</del> <b>{product.discount}% OFF</b></div>
        <div className="detailStock">✓ In Stock &nbsp; • &nbsp; Free Delivery &nbsp; • &nbsp; 7 Days Return</div>
        <div className="detailActions"><button className="detailAdd" onClick={()=>add(product)}><ShoppingCart size={18}/> Add to Cart</button><button className="buyBtn" onClick={()=>{add(product);goPath('/cart')}}>Buy Now <ArrowRight size={17}/></button></div>
      </div>
    </section>
    <section className="detailDescription"><span>PRODUCT DETAILS</span><h2>About this product</h2><p>{product.description}. Designed for everyday performance with reliable quality, modern features and a great user experience.</p></section>
    {related.length>0&&<section className="related"><h2>Related Products</h2><div className="grid">{related.map(p=><Card key={p._id} p={p} add={add} onOpen={x=>goPath('/products/'+encodeURIComponent(x._id))}/>)}</div></section>}
  </main>
}

function Products({add,initialCategory='All',products,setProducts}){
  const[q,setQ]=useState(""),[cat,setCat]=useState(initialCategory),[sort,setSort]=useState("Featured"),[page,setPage]=useState(1);
  const perPage=50;
  useEffect(()=>setCat(initialCategory),[initialCategory]);
  const cats=useMemo(()=>["All",...new Set(products.map(p=>p.category))],[products]);
  const list=useMemo(()=>{let x=products.filter(p=>(cat==="All"||p.category===cat)&&`${p.name} ${p.description}`.toLowerCase().includes(q.toLowerCase()));if(sort==="Price: Low to High")x.sort((a,b)=>a.price-b.price);if(sort==="Price: High to Low")x.sort((a,b)=>b.price-a.price);if(sort==="Rating")x.sort((a,b)=>b.rating-a.rating);return x},[products,q,cat,sort]);
  useEffect(()=>setPage(1),[q,cat,sort]);
  const total=Math.max(1,Math.ceil(list.length/perPage));
  const visible=list.slice((page-1)*perPage,page*perPage);
  const openProduct=p=>goPath('/products/'+encodeURIComponent(p._id));
  return <main className="page" id="products">
    <div className="title"><h1>{cat==='All'?'All Products':cat}</h1><p>Discover the best deals on latest electronics</p></div>
    <div className="filters"><div className="filter"><Search size={18}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search products..."/></div><div className="select"><select value={cat} onChange={e=>setCat(e.target.value)}>{cats.map(c=><option key={c}>{c}</option>)}</select><ChevronDown size={16}/></div><div className="sort"><SlidersHorizontal size={16}/>Sort by:<select value={sort} onChange={e=>setSort(e.target.value)}><option>Featured</option><option>Price: Low to High</option><option>Price: High to Low</option><option>Rating</option></select></div></div>
    <div className="resultCount">Showing {list.length?(page-1)*perPage+1:0}-{Math.min(page*perPage,list.length)} of {list.length} products</div>
    <div className="grid">{visible.map(p=><Card key={p._id} p={p} add={add} onOpen={openProduct}/>)}</div>
    <div className="pages"><button disabled={page===1} onClick={()=>{setPage(page-1);window.scrollTo({top:0,behavior:'smooth'})}}>‹</button>{Array.from({length:total},(_,i)=>i+1).map(n=><button key={n} className={page===n?'on':''} onClick={()=>{setPage(n);window.scrollTo({top:0,behavior:'smooth'})}}>{n}</button>)}<button disabled={page===total} onClick={()=>{setPage(page+1);window.scrollTo({top:0,behavior:'smooth'})}}>›</button></div>
  </main>
}

function CartPage({items,onRemove,onAdd,onCheckout}){
  const [showCheckout, setShowCheckout] = useState(false);
  const [cust, setCust] = useState({ name: "", email: "", phone: "", address: "", city: "", paymentMethod: "Card / UPI" });
  const [orderDone, setOrderDone] = useState(null);
  const total=items.reduce((s,x)=>s+x.price*x.qty,0);

  const handlePlaceOrder = (e) => {
    e.preventDefault();
    if (!cust.name.trim() || !cust.address.trim()) return;
    const newOrder = {
      _id: "ord_" + Date.now(),
      orderNumber: "TZ-" + Math.floor(100000 + Math.random() * 900000),
      createdAt: new Date().toISOString(),
      customer: { ...cust },
      items: items.map(x => ({ productId: x._id, name: x.name, price: x.price, qty: x.qty, image: x.image })),
      totalAmount: total,
      status: "Pending",
      paymentMethod: cust.paymentMethod
    };
    onCheckout(newOrder);
    setOrderDone(newOrder);
    setShowCheckout(false);
  };

  if (orderDone) {
    return (
      <main className="page cartPage">
        <div className="emptyPage" style={{ border: "1px solid #10b981", background: "rgba(16, 185, 129, 0.08)", padding: "50px 20px" }}>
          <CheckCircle2 size={55} color="#10b981" style={{ margin: "auto" }} />
          <h2 style={{ color: "#fff", marginTop: "14px" }}>Order Placed Successfully!</h2>
          <p style={{ color: "#94a3b8", fontSize: "16px" }}>
            Order ID: <strong style={{ color: "#38bdf8" }}>{orderDone.orderNumber}</strong> • Total: <strong style={{ color: "#34d399" }}>₹{orderDone.totalAmount.toLocaleString("en-IN")}</strong>
          </p>
          <p style={{ color: "#a1abb4", maxWidth: "450px", margin: "10px auto 24px" }}>
            Thank you, {orderDone.customer?.name}! Your order has been placed into the TechZone system. You can view and manage it right now in the Admin Console.
          </p>
          <div style={{ display: "flex", gap: "14px", justifyContent: "center" }}>
            <button className="primaryBtn" onClick={() => goPath('/admin')}>
              <ShieldCheck size={16} /> Open Admin Console
            </button>
            <button className="backBtn" style={{ margin: 0 }} onClick={() => { setOrderDone(null); goPath('/products'); }}>
              Continue Shopping
            </button>
          </div>
        </div>
      </main>
    );
  }

  return <main className="page cartPage"><div className="title"><h1>Shopping Cart</h1><p>Review your products and continue to checkout.</p></div>{items.length===0?<div className="emptyPage"><ShoppingCart size={55}/><h2>Your cart is empty</h2><button className="primaryBtn" onClick={()=>goPath('/products')}>Continue Shopping</button></div>:<div className="cartLayout"><div className="cartList">{items.map(x=><div className="cartRow" key={x._id}><img src={x.image} alt={x.name}/><div><h3>{x.name}</h3><p>{x.description}</p><strong>₹{x.price.toLocaleString('en-IN')}</strong><div className="qty"><button onClick={()=>onRemove(x._id)}>−</button><span>{x.qty}</span><button onClick={()=>onAdd(x)}>+</button></div></div></div>)}</div><aside className="summary"><h2>Price Details</h2><div><span>Items</span><span>{items.reduce((s,x)=>s+x.qty,0)}</span></div><div><span>Total</span><strong>₹{total.toLocaleString('en-IN')}</strong></div><button className="checkoutBtn" onClick={()=>setShowCheckout(true)}>Proceed to Checkout</button></aside></div>}

    {showCheckout && (
      <div className="admin-modal-backdrop" onClick={()=>setShowCheckout(false)}>
        <div className="admin-modal checkout-modal-card" onClick={e=>e.stopPropagation()}>
          <div className="admin-modal-header">
            <h3>Complete Checkout (₹{total.toLocaleString('en-IN')})</h3>
            <button className="admin-modal-close" onClick={()=>setShowCheckout(false)}><X size={20}/></button>
          </div>
          <form onSubmit={handlePlaceOrder}>
            <div className="admin-modal-body">
              <div className="admin-form-group">
                <label>Full Name *</label>
                <input className="admin-input" required placeholder="e.g. Rahul Sharma" value={cust.name} onChange={e=>setCust({...cust, name: e.target.value})}/>
              </div>
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>Email *</label>
                  <input type="email" className="admin-input" required placeholder="rahul@example.com" value={cust.email} onChange={e=>setCust({...cust, email: e.target.value})}/>
                </div>
                <div className="admin-form-group">
                  <label>Phone Number *</label>
                  <input className="admin-input" required placeholder="+91 98765 43210" value={cust.phone} onChange={e=>setCust({...cust, phone: e.target.value})}/>
                </div>
              </div>
              <div className="admin-form-group">
                <label>Shipping Address *</label>
                <input className="admin-input" required placeholder="Flat, Street, Area" value={cust.address} onChange={e=>setCust({...cust, address: e.target.value})}/>
              </div>
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>City *</label>
                  <input className="admin-input" required placeholder="e.g. Mumbai" value={cust.city} onChange={e=>setCust({...cust, city: e.target.value})}/>
                </div>
                <div className="admin-form-group">
                  <label>Payment Method</label>
                  <select className="admin-select" value={cust.paymentMethod} onChange={e=>setCust({...cust, paymentMethod: e.target.value})}>
                    <option value="UPI / Online">UPI / Instant Pay</option>
                    <option value="Credit / Debit Card">Credit / Debit Card</option>
                    <option value="Cash on Delivery">Cash on Delivery</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button type="button" className="admin-btn-secondary" onClick={()=>setShowCheckout(false)}>Cancel</button>
              <button type="submit" className="admin-action-btn-primary">Place Order Now →</button>
            </div>
          </form>
        </div>
      </div>
    )}
  </main>
}

function InfoPage({type}){
 const data={features:['Features','Smart shopping features for your complete tech journey.',['Search & Filters','5 product pages','Related products','Fast cart experience']],enterprise:['Enterprise','TechZone solutions for teams, businesses and growing digital stores.',['Bulk product management','Business-ready catalog','Reliable checkout flow','Scalable MERN architecture']],support:['Support','Need help? TechZone keeps support simple and accessible.',['Secure checkout','Delivery assistance','Easy returns','Product support']],pricing:['Pricing','Simple shopping with competitive prices and offers across every category.',['Daily deals','Member offers','Transparent pricing','No hidden charges']]}[type];
 return <main className="page infoPage"><div className="infoHero"><span>TECHZONE</span><h1>{data[0]}</h1><p>{data[1]}</p><button className="primaryBtn" onClick={()=>goPath('/products')}>Explore Products <ArrowRight size={17}/></button></div><div className="infoCards">{data[2].map((x,i)=><div key={x}><b>0{i+1}</b><h2>{x}</h2><p>Built into the TechZone shopping experience.</p></div>)}</div></main>
}

function Home({add}){
 return <>
  <section className="hero" id="home">
   <div className="heroProduct phoneHero"><img src={demo[0].image} alt="TechZone mobile"/></div>
   <div className="heroContent"><span className="heroEyebrow">LATEST TECH · BEST PRICES</span><h1>Upgrade Your<br/><span>Tech Life</span></h1><p>Discover the latest mobiles, headphones, laptops and accessories from top brands.</p><div className="heroLinks"><button className="shopBtn" onClick={()=>goPath('/products')}>Shop Now <ArrowRight size={18}/></button><button onClick={()=>goPath('/features')}>Explore categories <ArrowRight size={17}/></button></div></div>
   <div className="heroProduct headphoneHero"><img src={demo[2].image} alt="TechZone headphones"/></div><div className="heroMini earbudsHero"><img src={demo[5].image} alt="TechZone earbuds"/></div><div className="heroMini watchHero"><img src={demo[3].image} alt="TechZone smartwatch"/></div>
  </section>
  <section className="featureStrip"><div><span>01</span><h2>Mobiles</h2><p>Latest smartphones with powerful performance.</p><button onClick={()=>goPath('/products?category=Mobiles')}>Shop Now →</button><img src={demo[4].image} alt="Mobiles"/></div><div><span>02</span><h2>Headphones</h2><p>Feel the sound like never before.</p><button onClick={()=>goPath('/products?category=Headphones')}>Shop Now →</button><img src={demo[2].image} alt="Headphones"/></div><div><span>03</span><h2>Laptops</h2><p>Power for your big ideas.</p><button onClick={()=>goPath('/products?category=Laptops')}>Shop Now →</button><img src={demo[1].image} alt="Laptop"/></div><div><span>04</span><h2>Accessories</h2><p>Smart add-ons. Big difference.</p><button onClick={()=>goPath('/products?category=Accessories')}>Shop Now →</button><img src={demo[3].image} alt="Accessories"/></div></section>
  <section className="homeIntro"><span>TECHZONE FOR EVERYONE</span><h2>Everything you need for your digital life.</h2><p>Shop trusted electronics, compare products, add to cart and move from browsing to checkout without leaving the experience.</p><button className="primaryBtn" onClick={()=>goPath('/products')}>Explore Products <ArrowRight size={17}/></button></section>
 </>
}

function Footer(){
  return <footer className="footer">
    <div className="footerGrid">
      <div>
        <h3>Tech<span>Zone</span></h3>
        <p>Your trusted destination for mobiles, laptops, audio, accessories and more.</p>
      </div>
      <div>
        <h4>Shop</h4>
        <button onClick={()=>goPath('/products')}>All Products</button>
        <button onClick={()=>goPath('/cart')}>Shopping Cart</button>
      </div>
      <div>
        <h4>Admin & Explore</h4>
        <button onClick={()=>goPath('/admin')} style={{ color: '#38bdf8', fontWeight: 'bold' }}>⚡ Admin Console</button>
        <button onClick={()=>goPath('/features')}>Features</button>
        <button onClick={()=>goPath('/enterprise')}>Enterprise</button>
      </div>
      <div>
        <h4>Support</h4>
        <button onClick={()=>goPath('/support')}>Customer Support</button>
        <button onClick={()=>goPath('/pricing')}>Pricing</button>
      </div>
    </div>
    <div className="footerBottom">© 2026 TechZone • Full MERN E-Commerce • React + Node.js + Express + MongoDB</div>
  </footer>
}

function App(){
  const[cart,setCart]=useState([]);
  const[route,setRoute]=useState(pathKey());
  const[products,setProducts]=useState(()=>{
    try{
      const s=localStorage.getItem("techzone_products");
      return s?JSON.parse(s):demo;
    }catch(e){return demo}
  });
  const[orders,setOrders]=useState(()=>{
    try{
      const s=localStorage.getItem("techzone_orders");
      return s?JSON.parse(s):initialSampleOrders;
    }catch(e){return initialSampleOrders}
  });

  useEffect(()=>{
    const onPop=()=>setRoute(pathKey());
    window.addEventListener('popstate',onPop);
    axios.get('http://localhost:5000/api/products').then(r=>{
      if(r.data?.length){
        setProducts(r.data);
        localStorage.setItem("techzone_products",JSON.stringify(r.data));
      }
    }).catch(()=>{});
    axios.get('http://localhost:5000/api/orders').then(r=>{
      if(r.data?.length){
        setOrders(r.data);
        localStorage.setItem("techzone_orders",JSON.stringify(r.data));
      }
    }).catch(()=>{});
    return()=>window.removeEventListener('popstate',onPop);
  },[]);

  const add=p=>setCart(c=>c.some(x=>x._id===p._id)?c.map(x=>x._id===p._id?{...x,qty:x.qty+1}:x):[...c,{...p,qty:1}]);
  const remove=id=>setCart(c=>c.map(x=>x._id===id?{...x,qty:x.qty-1}:x).filter(x=>x.qty>0));

  const handleCheckout=(newOrder)=>{
    const updated=[newOrder,...orders];
    setOrders(updated);
    localStorage.setItem("techzone_orders",JSON.stringify(updated));
    setCart([]);
    axios.post('http://localhost:5000/api/orders',newOrder).catch(()=>{});
  };

  if(route==='admin'){
    return <AdminPanel
      products={products}
      setProducts={setProducts}
      orders={orders}
      setOrders={setOrders}
      onBackToStore={()=>goPath('/')}
      onViewProduct={p=>goPath('/products/'+encodeURIComponent(p._id))}
    />;
  }

  const currentId=decodeURIComponent(window.location.pathname.split('/').pop()||'');
  const selected=products.find(p=>String(p._id)===currentId);
  let content;
  if(route==='home')content=<Home add={add}/>;
  else if(route==='products')content=<Products add={add} products={products} setProducts={setProducts} initialCategory={new URLSearchParams(window.location.search).get('category')||'All'}/>;
  else if(route==='product-detail')content=<ProductDetail product={selected} products={products} add={add}/>;
  else if(route==='cart')content=<CartPage items={cart} onRemove={remove} onAdd={add} onCheckout={handleCheckout}/>;
  else content=<InfoPage type={route}/>;
  return <><Header count={cart.reduce((s,x)=>s+x.qty,0)}/>{content}<Footer/></>
}
createRoot(document.getElementById("root")).render(<BrowserRouter><App/></BrowserRouter>);

