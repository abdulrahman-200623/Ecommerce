import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Link } from "react-router-dom";
import {
  Search,
  ShoppingCart,
  UserRound,
  UserPlus,
  Heart,
  ChevronDown,
  Star,
  Truck,
  SlidersHorizontal,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  X,
  Package,
  LogOut,
  Zap,
  RotateCcw,
  ZoomIn,
  Maximize2
} from "lucide-react";
import axios from "axios";
import "./styles.css";
import "./reviews.css";
import "./checkout.css";
import "./account.css";
import "./flashSale.css";
import "./returns.css";
import AdminPanel from "./AdminPanel";
import AdminProtectedRoute from "./AdminProtectedRoute";
import SuperAdminApp from "./SuperAdminApp";
import WishlistPage from "./WishlistPage";
import ProductReviewsSection from "./ProductReviewsSection";
import CheckoutPage from "./CheckoutPage";
import OrderSuccessPage from "./OrderSuccessPage";
import HeroSlider from "./HeroSlider";
import FeaturedPromotionsCarousel from "./FeaturedPromotionsCarousel";
import TechZoneLogo from "./TechZoneLogo";
import AuthModal from "./AuthModal";
import MyAccountPage from "./MyAccountPage";
import OrderHistoryPage from "./OrderHistoryPage";
import OrderDetailsPage from "./OrderDetailsPage";
import FlashSaleSection from "./FlashSaleSection";
import FlashSalePage from "./FlashSalePage";
import MyReturnsPage from "./MyReturnsPage";
import ReturnDetailsPage from "./ReturnDetailsPage";
import CategoryDropdown from "./CategoryDropdown";
import ProductCard from "./ProductCard";
import ProductGallery from "./ProductGallery";
import RecommendedProducts from "./RecommendedProducts";
import RecentlyViewedSection from "./RecentlyViewedSection";
import { recordProductView, syncHistoryOnLogin } from "./recentlyViewedService";
import ShareProductButton from "./ShareProductButton";
import { ThemeProvider } from "./ThemeContext";
import ThemeDropdown from "./ThemeDropdown";
const demo=[
  {
    "_id": "6ac8b93156afe1acffb15617",
    "name": "OnePlus 13",
    "description": "Powerful flagship smartphone",
    "price": 69999,
    "originalPrice": 79999,
    "discount": 12,
    "category": "Mobiles",
    "image": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1585060544812-6b45742d762f?auto=format&fit=crop&w=800&q=80"
    ],
    "rating": 4.7,
    "reviews": 3,
    "stock": 20
  },
  {
    "_id": "6ac8b93156afe1acffb15618",
    "name": "ASUS Vivobook 15",
    "description": "Intel Core i5 12th Gen | 8GB | 512GB SSD",
    "price": 44990,
    "originalPrice": 49990,
    "discount": 10,
    "category": "Laptops",
    "image": "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80"
    ],
    "rating": 4.5,
    "reviews": 2,
    "stock": 13
  },
  {
    "_id": "6ac8b93156afe1acffb15619",
    "name": "JBL Tune 720BT",
    "description": "Wireless Over-Ear Headphones",
    "price": 5099,
    "originalPrice": 5999,
    "discount": 15,
    "category": "Headphones",
    "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80"
    ],
    "rating": 4,
    "reviews": 3,
    "stock": 25
  },
  {
    "_id": "6ac8b93156afe1acffb1561a",
    "name": "boAt Wave Call",
    "description": "Bluetooth Calling Smartwatch",
    "price": 1999,
    "originalPrice": 2499,
    "discount": 20,
    "category": "Smartwatches",
    "image": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80"
    ],
    "rating": 4,
    "reviews": 1,
    "stock": 30
  },
  {
    "_id": "6ac8b93156afe1acffb1561b",
    "name": "Samsung Galaxy S24",
    "description": "8GB RAM | 256GB Storage",
    "price": 69999,
    "originalPrice": 75999,
    "discount": 8,
    "category": "Mobiles",
    "image": "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=800&q=80"
    ],
    "rating": 4.5,
    "reviews": 2,
    "stock": 18
  },
  {
    "_id": "6ac8b93156afe1acffb1561c",
    "name": "Apple AirPods Pro (2nd Gen)",
    "description": "Active Noise Cancellation",
    "price": 24999,
    "originalPrice": 30500,
    "discount": 18,
    "category": "Earbuds",
    "image": "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1588423771073-b8903fbb85b5?auto=format&fit=crop&w=800&q=80"
    ],
    "rating": 5,
    "reviews": 2,
    "stock": 22
  },
  {
    "_id": "6ac8b93156afe1acffb1561d",
    "name": "LG 24MP60G",
    "description": "24-inch Full HD Monitor | 75Hz",
    "price": 10999,
    "originalPrice": 12999,
    "discount": 14,
    "category": "Monitors",
    "image": "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&w=800&q=80"
    ],
    "rating": 4.5,
    "reviews": 0,
    "stock": 12
  },
  {
    "_id": "6ac8b93156afe1acffb1561e",
    "name": "Anker 20W Fast Charger",
    "description": "Type-C PD Charger",
    "price": 1499,
    "originalPrice": 1999,
    "discount": 25,
    "category": "Accessories",
    "image": "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1622445268065-25a8942b7c63?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80"
    ],
    "rating": 4.5,
    "reviews": 0,
    "stock": 40
  },
  {
    "_id": "6ac8b93156afe1acffb1561f",
    "name": "iPhone 16",
    "description": "Premium mobiles product with modern features",
    "price": 20499,
    "originalPrice": 23573,
    "discount": 15,
    "category": "Mobiles",
    "image": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1574755393849-623942496936?auto=format&fit=crop&w=800&q=80"
    ],
    "rating": 4.5,
    "reviews": 0,
    "stock": 18
  },
  {
    "_id": "6ac8b93156afe1acffb15620",
    "name": "Google Pixel 9",
    "description": "Premium laptops product with modern features",
    "price": 22874,
    "originalPrice": 26305,
    "discount": 15,
    "category": "Laptops",
    "image": "https://images.unsplash.com/photo-1567581935884-3349723552ca?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1567581935884-3349723552ca?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1575695342320-d2d2d2f9b73f?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80"
    ],
    "rating": 4.5,
    "reviews": 0,
    "stock": 19
  },
  {
    "_id": "6ac8b93156afe1acffb15621",
    "name": "Redmi Note 14 Pro",
    "description": "Premium headphones product with modern features",
    "price": 25249,
    "originalPrice": 29036,
    "discount": 15,
    "category": "Headphones",
    "image": "https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1567581935884-3349723552ca?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?auto=format&fit=crop&w=800&q=80"
    ],
    "rating": 4.5,
    "reviews": 0,
    "stock": 20
  },
  {
    "_id": "6ac8b93156afe1acffb15622",
    "name": "Nothing Phone 2a",
    "description": "Premium smartwatches product with modern features",
    "price": 27624,
    "originalPrice": 31767,
    "discount": 15,
    "category": "Smartwatches",
    "image": "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1575695342320-d2d2d2f9b73f?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1556656793-08538906a9f8?auto=format&fit=crop&w=800&q=80"
    ],
    "rating": 4.5,
    "reviews": 0,
    "stock": 21
  },
  {
    "_id": "6ac8b93156afe1acffb15623",
    "name": "HP Pavilion 15",
    "description": "Premium earbuds product with modern features",
    "price": 29999,
    "originalPrice": 34498,
    "discount": 15,
    "category": "Earbuds",
    "image": "https://images.unsplash.com/photo-1544731612-de292439cc67?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1544731612-de292439cc67?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80"
    ],
    "rating": 4.5,
    "reviews": 0,
    "stock": 22
  },
  {
    "_id": "6ac8b93156afe1acffb15624",
    "name": "Lenovo IdeaPad Slim 3",
    "description": "Premium monitors product with modern features",
    "price": 32374,
    "originalPrice": 37230,
    "discount": 15,
    "category": "Monitors",
    "image": "https://images.unsplash.com/photo-1588702547919-26089e690ecc?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1588702547919-26089e690ecc?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80"
    ],
    "rating": 4.5,
    "reviews": 0,
    "stock": 23
  },
  {
    "_id": "6ac8b93156afe1acffb15625",
    "name": "Acer Aspire 5",
    "description": "Premium accessories product with modern features",
    "price": 34749,
    "originalPrice": 39961,
    "discount": 15,
    "category": "Accessories",
    "image": "https://images.unsplash.com/photo-1522199755839-a2bacb67c546?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1522199755839-a2bacb67c546?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1504707748692-419802cf939d?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80"
    ],
    "rating": 4.5,
    "reviews": 0,
    "stock": 24
  },
  {
    "_id": "6ac8b93156afe1acffb15626",
    "name": "Dell Inspiron 15",
    "description": "Premium gaming product with modern features",
    "price": 37124,
    "originalPrice": 42692,
    "discount": 15,
    "category": "Gaming",
    "image": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1544731612-de292439cc67?auto=format&fit=crop&w=800&q=80"
    ],
    "rating": 4.5,
    "reviews": 0,
    "stock": 25
  },
  {
    "_id": "6ac8b93156afe1acffb15627",
    "name": "Sony WH-1000XM5",
    "description": "Premium mobiles product with modern features",
    "price": 39499,
    "originalPrice": 45423,
    "discount": 15,
    "category": "Mobiles",
    "image": "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1577174881658-0f30ed549adc?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80"
    ],
    "rating": 4.5,
    "reviews": 0,
    "stock": 26
  },
  {
    "_id": "6ac8b93156afe1acffb15628",
    "name": "boAt Rockerz 550",
    "description": "Premium laptops product with modern features",
    "price": 41874,
    "originalPrice": 48155,
    "discount": 15,
    "category": "Laptops",
    "image": "https://images.unsplash.com/photo-1545127398-14699f92334b?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1545127398-14699f92334b?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1487215078519-e21cc028cb29?auto=format&fit=crop&w=800&q=80"
    ],
    "rating": 4.5,
    "reviews": 0,
    "stock": 27
  },
  {
    "_id": "6ac8b93156afe1acffb15629",
    "name": "Noise ColorFit Pro",
    "description": "Premium headphones product with modern features",
    "price": 44249,
    "originalPrice": 50886,
    "discount": 15,
    "category": "Headphones",
    "image": "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80"
    ],
    "rating": 4.5,
    "reviews": 0,
    "stock": 28
  },
  {
    "_id": "6ac8b93156afe1acffb1562a",
    "name": "Fire-Boltt Phoenix",
    "description": "Premium smartwatches product with modern features",
    "price": 46624,
    "originalPrice": 53617,
    "discount": 15,
    "category": "Smartwatches",
    "image": "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1509741102003-ca64bfe5f069?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80"
    ],
    "rating": 4.5,
    "reviews": 0,
    "stock": 29
  },
  {
    "_id": "6ac8b93156afe1acffb1562b",
    "name": "Samsung Galaxy Buds FE",
    "description": "Premium earbuds product with modern features",
    "price": 48999,
    "originalPrice": 56348,
    "discount": 15,
    "category": "Earbuds",
    "image": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1608156639585-b3a032ef9689?auto=format&fit=crop&w=800&q=80"
    ],
    "rating": 4.5,
    "reviews": 0,
    "stock": 30
  },
  {
    "_id": "6ac8b93156afe1acffb1562c",
    "name": "Realme Buds Air 6",
    "description": "Premium monitors product with modern features",
    "price": 51374,
    "originalPrice": 59080,
    "discount": 15,
    "category": "Monitors",
    "image": "https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1608156639585-b3a032ef9689?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80"
    ],
    "rating": 4.5,
    "reviews": 0,
    "stock": 31
  },
  {
    "_id": "6ac8b93156afe1acffb1562d",
    "name": "Acer 24-inch Monitor",
    "description": "Premium accessories product with modern features",
    "price": 53749,
    "originalPrice": 61811,
    "discount": 15,
    "category": "Accessories",
    "image": "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80"
    ],
    "rating": 4.5,
    "reviews": 0,
    "stock": 32
  },
  {
    "_id": "6ac8b93156afe1acffb1562e",
    "name": "Samsung 27-inch Monitor",
    "description": "Premium gaming product with modern features",
    "price": 56124,
    "originalPrice": 64542,
    "discount": 15,
    "category": "Gaming",
    "image": "https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?auto=format&fit=crop&w=800&q=80"
    ],
    "rating": 4.5,
    "reviews": 0,
    "stock": 33
  },
  {
    "_id": "6ac8b93156afe1acffb1562f",
    "name": "Logitech K380",
    "description": "Premium mobiles product with modern features",
    "price": 58499,
    "originalPrice": 67273,
    "discount": 15,
    "category": "Mobiles",
    "image": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80"
    ],
    "rating": 4.5,
    "reviews": 0,
    "stock": 34
  },
  {
    "_id": "6ac8b93156afe1acffb15630",
    "name": "Logitech M331 Mouse",
    "description": "Premium laptops product with modern features",
    "price": 60874,
    "originalPrice": 70005,
    "discount": 15,
    "category": "Laptops",
    "image": "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1586953208448-b95a79798f07?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80"
    ],
    "rating": 4.5,
    "reviews": 0,
    "stock": 35
  },
  {
    "_id": "6ac8b93156afe1acffb15631",
    "name": "TP-Link WiFi Router",
    "description": "Premium headphones product with modern features",
    "price": 63249,
    "originalPrice": 72736,
    "discount": 15,
    "category": "Headphones",
    "image": "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1588702547919-26089e690ecc?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80"
    ],
    "rating": 4.5,
    "reviews": 0,
    "stock": 36
  },
  {
    "_id": "6ac8b93156afe1acffb15632",
    "name": "Mi Power Bank 20000",
    "description": "Premium smartwatches product with modern features",
    "price": 65624,
    "originalPrice": 75467,
    "discount": 15,
    "category": "Smartwatches",
    "image": "https://images.unsplash.com/photo-1609592424109-dd9892f1b177?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1609592424109-dd9892f1b177?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=800&q=80"
    ],
    "rating": 4.5,
    "reviews": 0,
    "stock": 37
  },
  {
    "_id": "6ac8b93156afe1acffb15633",
    "name": "Zebronics Gaming Mouse",
    "description": "Premium earbuds product with modern features",
    "price": 67999,
    "originalPrice": 78198,
    "discount": 15,
    "category": "Earbuds",
    "image": "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1586953208448-b95a79798f07?auto=format&fit=crop&w=800&q=80"
    ],
    "rating": 4.5,
    "reviews": 0,
    "stock": 38
  },
  {
    "_id": "6ac8b93156afe1acffb15634",
    "name": "Cosmic Byte Keyboard",
    "description": "Premium monitors product with modern features",
    "price": 70374,
    "originalPrice": 80930,
    "discount": 15,
    "category": "Monitors",
    "image": "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80"
    ],
    "rating": 4.5,
    "reviews": 0,
    "stock": 39
  },
  {
    "_id": "6ac8b93156afe1acffb15635",
    "name": "Redmi Buds 6",
    "description": "Premium accessories product with modern features",
    "price": 2749,
    "originalPrice": 3249,
    "discount": 15,
    "category": "Accessories",
    "image": "https://images.unsplash.com/photo-1608156639585-b3a032ef9689?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1608156639585-b3a032ef9689?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80"
    ],
    "rating": 3,
    "reviews": 1,
    "stock": 40
  },
  {
    "_id": "6ac8b93156afe1acffb15636",
    "name": "Realme Watch 5",
    "description": "Premium gaming product with modern features",
    "price": 5124,
    "originalPrice": 5892,
    "discount": 15,
    "category": "Gaming",
    "image": "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=800&q=80"
    ],
    "rating": 4.5,
    "reviews": 0,
    "stock": 41
  },
  {
    "_id": "6ac8b93156afe1acffb15637",
    "name": "Motorola Edge 60",
    "description": "Premium mobiles product with modern features",
    "price": 7499,
    "originalPrice": 8623,
    "discount": 15,
    "category": "Mobiles",
    "image": "https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1556656793-08538906a9f8?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=800&q=80"
    ],
    "rating": 4.5,
    "reviews": 0,
    "stock": 42
  },
  {
    "_id": "6ac8b93156afe1acffb15638",
    "name": "HP Victus Gaming",
    "description": "Premium laptops product with modern features",
    "price": 9874,
    "originalPrice": 11355,
    "discount": 15,
    "category": "Laptops",
    "image": "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=800&q=80"
    ],
    "rating": 4.5,
    "reviews": 0,
    "stock": 42
  },
  {
    "_id": "6ac8b93156afe1acffb1563a",
    "name": "Sony XB100 Speaker",
    "description": "Premium smartwatches product with modern features",
    "price": 14624,
    "originalPrice": 16817,
    "discount": 15,
    "category": "Smartwatches",
    "image": "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80"
    ],
    "rating": 4.5,
    "reviews": 0,
    "stock": 45
  },
  {
    "_id": "6ac8b93156afe1acffb1563b",
    "name": "JBL Flip Speaker",
    "description": "Premium earbuds product with modern features",
    "price": 16999,
    "originalPrice": 19548,
    "discount": 15,
    "category": "Earbuds",
    "image": "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80"
    ],
    "rating": 4.5,
    "reviews": 0,
    "stock": 46
  },
  {
    "_id": "6ac8b93156afe1acffb1563c",
    "name": "Samsung SSD 1TB",
    "description": "Premium monitors product with modern features",
    "price": 19374,
    "originalPrice": 22280,
    "discount": 15,
    "category": "Monitors",
    "image": "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1625961332771-3f40b0e2bdcf?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1609592424109-dd9892f1b177?auto=format&fit=crop&w=800&q=80"
    ],
    "rating": 4.5,
    "reviews": 0,
    "stock": 47
  },
  {
    "_id": "6ac8b93156afe1acffb1563d",
    "name": "WD External HDD",
    "description": "Premium accessories product with modern features",
    "price": 21749,
    "originalPrice": 25011,
    "discount": 15,
    "category": "Accessories",
    "image": "https://images.unsplash.com/photo-1625961332771-3f40b0e2bdcf?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1625961332771-3f40b0e2bdcf?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1609592424109-dd9892f1b177?auto=format&fit=crop&w=800&q=80"
    ],
    "rating": 4.5,
    "reviews": 0,
    "stock": 48
  },
  {
    "_id": "6ac8b93156afe1acffb1563e",
    "name": "Canon Printer",
    "description": "Premium gaming product with modern features",
    "price": 24124,
    "originalPrice": 27742,
    "discount": 15,
    "category": "Gaming",
    "image": "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80"
    ],
    "rating": 4.5,
    "reviews": 0,
    "stock": 49
  },
  {
    "_id": "6ac8b93156afe1acffb1563f",
    "name": "OnePlus 13 Plus",
    "description": "Powerful flagship smartphone",
    "price": 69499,
    "originalPrice": 79999,
    "discount": 12,
    "category": "Mobiles",
    "image": "https://images.unsplash.com/photo-1567581935884-3349723552ca?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1567581935884-3349723552ca?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1575695342320-d2d2d2f9b73f?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1533228801458-3965902047db?auto=format&fit=crop&w=800&q=80"
    ],
    "rating": 4.5,
    "reviews": 0,
    "stock": 20
  },
  {
    "_id": "6ac8b93156afe1acffb15640",
    "name": "ASUS Vivobook 15 Plus",
    "description": "Intel Core i5 12th Gen | 8GB | 512GB SSD",
    "price": 44490,
    "originalPrice": 49990,
    "discount": 10,
    "category": "Laptops",
    "image": "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80"
    ],
    "rating": 4.5,
    "reviews": 0,
    "stock": 15
  },
  {
    "_id": "6ac8b93156afe1acffb15641",
    "name": "JBL Tune 720BT Plus",
    "description": "Wireless Over-Ear Headphones",
    "price": 4599,
    "originalPrice": 5999,
    "discount": 15,
    "category": "Headphones",
    "image": "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80"
    ],
    "rating": 4.5,
    "reviews": 0,
    "stock": 25
  },
  {
    "_id": "6ac8b93156afe1acffb15642",
    "name": "boAt Wave Call Plus",
    "description": "Bluetooth Calling Smartwatch",
    "price": 1499,
    "originalPrice": 2499,
    "discount": 20,
    "category": "Smartwatches",
    "image": "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80"
    ],
    "rating": 4.5,
    "reviews": 0,
    "stock": 30
  },
  {
    "_id": "6ac8b93156afe1acffb15643",
    "name": "Samsung Galaxy S24 Plus",
    "description": "8GB RAM | 256GB Storage",
    "price": 69499,
    "originalPrice": 75999,
    "discount": 8,
    "category": "Mobiles",
    "image": "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1546054454-aa26e2b734c7?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1585060544812-6b45742d762f?auto=format&fit=crop&w=800&q=80"
    ],
    "rating": 4.5,
    "reviews": 0,
    "stock": 18
  },
  {
    "_id": "6ac8b93156afe1acffb15644",
    "name": "Apple AirPods Pro (2nd Gen) Plus",
    "description": "Active Noise Cancellation",
    "price": 24499,
    "originalPrice": 30500,
    "discount": 18,
    "category": "Earbuds",
    "image": "https://images.unsplash.com/photo-1588423771073-b8903fbb85b5?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1588423771073-b8903fbb85b5?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=800&q=80"
    ],
    "rating": 4.5,
    "reviews": 0,
    "stock": 22
  },
  {
    "_id": "6ac8b93156afe1acffb15645",
    "name": "LG 24MP60G Plus",
    "description": "24-inch Full HD Monitor | 75Hz",
    "price": 10499,
    "originalPrice": 12999,
    "discount": 14,
    "category": "Monitors",
    "image": "https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&w=800&q=80"
    ],
    "rating": 4.5,
    "reviews": 0,
    "stock": 12
  },
  {
    "_id": "6ac8b93156afe1acffb15646",
    "name": "Anker 20W Fast Charger Plus",
    "description": "Type-C PD Charger",
    "price": 999,
    "originalPrice": 1999,
    "discount": 25,
    "category": "Accessories",
    "image": "https://images.unsplash.com/photo-1622445268065-25a8942b7c63?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1622445268065-25a8942b7c63?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80"
    ],
    "rating": 4.5,
    "reviews": 0,
    "stock": 40
  },
  {
    "_id": "6ac8b93156afe1acffb15647",
    "name": "iPhone 16 Plus",
    "description": "Premium mobiles product with modern features",
    "price": 19999,
    "originalPrice": 23573,
    "discount": 15,
    "category": "Mobiles",
    "image": "https://images.unsplash.com/photo-1591337676887-a217a6970a8a?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1591337676887-a217a6970a8a?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1512054502232-10a0a035d672?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1530319067432-f2a729c03db5?auto=format&fit=crop&w=800&q=80"
    ],
    "rating": 4.5,
    "reviews": 0,
    "stock": 18
  },
  {
    "_id": "6ac8b93156afe1acffb15648",
    "name": "Google Pixel 9 Plus",
    "description": "Premium laptops product with modern features",
    "price": 22374,
    "originalPrice": 26305,
    "discount": 15,
    "category": "Laptops",
    "image": "https://images.unsplash.com/photo-1575695342320-d2d2d2f9b73f?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1575695342320-d2d2d2f9b73f?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1567581935884-3349723552ca?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1533228801458-3965902047db?auto=format&fit=crop&w=800&q=80"
    ],
    "rating": 4.5,
    "reviews": 0,
    "stock": 19
  },
  {
    "_id": "6ac8bc03a64adc9ec18c5706",
    "name": "iphone 17 pro max",
    "description": "Premium flagship smartphone with dynamic AMOLED 2X display, quad telephoto camera system, and ultra-durable titanium frame.",
    "price": 99999,
    "originalPrice": 119999,
    "discount": 17,
    "category": "Mobiles",
    "image": "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80"
    ],
    "rating": 4.5,
    "reviews": 0,
    "stock": 14
  }
];

function goPath(path){window.history.pushState({},"",path);window.dispatchEvent(new PopStateEvent("popstate"))}
function pathKey(){
  const p=window.location.pathname; 
  if(p.startsWith('/superadmin')) return 'superadmin';
  if(p.startsWith('/admin')) return 'admin';
  if(p.startsWith('/products/')) return 'product-detail'; 
  if(p==='/flash-sale') return 'flash-sale';
  if(p==='/products') return 'products'; 
  if(p==='/wishlist') return 'wishlist'; 
  if(p==='/recently-viewed') return 'recently-viewed'; 
  if(p==='/my-account') return 'my-account';
  if(p.startsWith('/my-orders/')) return 'order-detail';
  if(p==='/my-orders') return 'my-orders';
  if(p.startsWith('/my-returns/')) return 'return-detail';
  if(p==='/my-returns') return 'my-returns';
  if(p==='/features') return 'features'; 
  if(p==='/enterprise') return 'enterprise'; 
  if(p==='/support') return 'support'; 
  if(p==='/pricing') return 'pricing'; 
  if(p==='/cart') return 'cart'; 
  if(p==='/checkout') return 'checkout'; 
  if(p.startsWith('/order-success/')) return 'order-success'; 
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

function Header({count, wishlistCount = 0, currentRoute, user, onLogout, onOpenAuthModal}){
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchVal, setSearchVal] = useState(() => {
    try {
      return new URLSearchParams(window.location.search).get('search') || "";
    } catch(e) { return ""; }
  });
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const nav=(key)=>goPath(key==='home'?'/':'/'+key);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchVal.trim()) {
      goPath('/products?search=' + encodeURIComponent(searchVal.trim()));
    } else {
      goPath('/products');
    }
  };

  return (
    <header className="site-header">
      {/* Top Utility Announcement Bar */}
      <div className="top-utility-bar">
        <div className="utility-bar-container">
          <div className="utility-bar-left">
            <span>Free Express Delivery on orders over ₹999</span>
            <span className="utility-separator">•</span>
            <span>100% Genuine Electronics Guaranteed</span>
            <span className="utility-separator">•</span>
            <span>7-Day Easy Returns</span>
          </div>
          <div className="utility-bar-right">
            <button type="button" onClick={()=>goPath('/support')}>Customer Support</button>
            <span className="utility-separator">•</span>
            <button type="button" onClick={()=>goPath('/my-orders')}>Track Order</button>
          </div>
        </div>
      </div>

      {/* Main Topbar Row */}
      <div className="topbar">
        <TechZoneLogo onClick={()=>nav('home')} />

        {/* Real Store Functional Search Bar */}
        <form className="header-search-form" onSubmit={handleSearchSubmit}>
          <Search size={17} className="search-icon" />
          <input
            type="search"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Search phones, laptops, headphones, smartwatches..."
            aria-label="Search electronics products"
            id="navbar-search-input"
          />
          <button type="submit" className="search-submit-btn" id="navbar-search-submit-btn">
            Search
          </button>
        </form>

        {/* Right Controls: Theme, Wishlist, Cart, Profile */}
        <div className="header-actions">
          <ThemeDropdown />

          <button
            className={`wishlistIcon ${currentRoute==='wishlist'?'active':''}`}
            onClick={()=>nav('wishlist')}
            aria-label="Open wishlist"
            title="Wishlist"
            id="navbar-wishlist-btn"
          >
            <Heart size={18} fill={wishlistCount > 0 ? "#EF4444" : "none"} color={wishlistCount > 0 ? "#EF4444" : "currentColor"}/>
            <span>Saved</span>
            {wishlistCount > 0 && <span className="wishlistBadge" id="navbar-wishlist-count">{wishlistCount}</span>}
          </button>

          <button className="cartIcon" onClick={()=>nav('cart')} aria-label="Open cart" title="Cart" id="navbar-cart-btn">
            <ShoppingCart size={18}/>
            <span>Cart</span>
            {count > 0 && <span className="cartBadge">{count}</span>}
          </button>

          {/* User Account Dropdown / Sign In Button */}
          {user ? (
            <div className="user-menu-wrapper" ref={dropdownRef}>
              <button
                className="user-topbar-btn"
                onClick={()=>setDropdownOpen(!dropdownOpen)}
                id="navbar-user-dropdown-btn"
                aria-expanded={dropdownOpen}
                title="User Account"
              >
                <div className="user-topbar-avatar">
                  {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <span>{user.name ? user.name.split(" ")[0] : "Account"}</span>
                <ChevronDown size={14} />
              </button>

              {dropdownOpen && (
                <div className="user-dropdown-menu">
                  <div className="dropdown-user-info">
                    <div className="dropdown-user-name">{user.name}</div>
                    <div className="dropdown-user-email">{user.email}</div>
                  </div>
                  <button
                    className="dropdown-item-btn"
                    onClick={()=>{ setDropdownOpen(false); nav('my-account'); }}
                    id="dropdown-my-account-btn"
                  >
                    <UserRound size={15} /> My Account
                  </button>
                  <button
                    className="dropdown-item-btn"
                    onClick={()=>{ setDropdownOpen(false); nav('my-orders'); }}
                    id="dropdown-my-orders-btn"
                  >
                    <Package size={15} /> My Orders
                  </button>
                  <button
                    className="dropdown-item-btn"
                    onClick={()=>{ setDropdownOpen(false); goPath('/my-returns'); }}
                    id="dropdown-my-returns-btn"
                  >
                    <RotateCcw size={15} /> Returns & Refunds
                  </button>
                  <button
                    className="dropdown-item-btn"
                    onClick={()=>{ setDropdownOpen(false); nav('wishlist'); }}
                  >
                    <Heart size={15} /> My Wishlist
                  </button>
                  <button
                    className="dropdown-item-btn logout"
                    onClick={()=>{ setDropdownOpen(false); onLogout(); }}
                    id="dropdown-logout-btn"
                  >
                    <LogOut size={15} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              className="user-signin-btn"
              onClick={onOpenAuthModal}
              id="navbar-sign-in-btn"
              title="Sign in or register"
            >
              <UserRound size={16} /> Sign In
            </button>
          )}
        </div>
      </div>

      {/* Secondary Navigation Bar: Store Links */}
      <nav className="category-subnav">
        <div className="subnav-container">
          <div className="subnav-links">
            <button className={currentRoute==='home'?'nav-active':''} onClick={()=>nav('home')}>Home</button>
            <button className={currentRoute==='products'?'nav-active':''} onClick={()=>nav('products')}>Product</button>
            <button className={`flash-link ${currentRoute==='flash-sale'?'nav-active':''}`} onClick={()=>goPath('/flash-sale')} id="navbar-flash-sale-link">⚡ Flash Sale</button>
            <button className={currentRoute==='wishlist'?'nav-active':''} onClick={()=>nav('wishlist')}>Wishlist</button>
            <button className={currentRoute==='my-orders'?'nav-active':''} onClick={()=>nav('my-orders')}>My Orders</button>
            <button className={currentRoute==='features'?'nav-active':''} onClick={()=>nav('features')}>Features</button>
            <button className={currentRoute==='enterprise'?'nav-active':''} onClick={()=>nav('enterprise')}>Enterprise</button>
            <button className={currentRoute==='support'?'nav-active':''} onClick={()=>nav('support')}>Support</button>
            <button className={currentRoute==='pricing'?'nav-active':''} onClick={()=>nav('pricing')}>Pricing</button>
          </div>
        </div>
      </nav>
    </header>
  );
}

function Card(props){
  return <ProductCard {...props} />;
}

function ProductDetail({productId, product: initialProduct, products = [], add, isWishlisted, onToggleWishlist, checkIsWishlisted, userId, showToast, onProductRatingUpdate, token}){
  // Resolve product identifier from props or URL
  const targetId = String(
    productId ||
    (initialProduct ? (initialProduct._id || initialProduct.productId) : "") ||
    decodeURIComponent(window.location.pathname.replace(/^\/products\//, '').split('/')[0] || '')
  );

  const foundInList = useMemo(() => {
    if (!products || !products.length || !targetId) return null;
    return products.find(p => String(p._id) === targetId || String(p.productId) === targetId) || null;
  }, [products, targetId]);

  const [product, setProduct] = useState(() => initialProduct || foundInList || null);
  const [loading, setLoading] = useState(() => !(initialProduct || foundInList));
  const [error, setError] = useState(false);

  // Smooth scroll to top whenever product route changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [targetId]);

  // Record product view whenever loaded
  useEffect(() => {
    if (product && (product._id || product.productId)) {
      recordProductView(product, token);
    }
  }, [product?._id, product?.productId, token]);

  useEffect(() => {
    if (initialProduct && (String(initialProduct._id) === targetId || String(initialProduct.productId) === targetId)) {
      setProduct(initialProduct);
      setLoading(false);
      setError(false);
      return;
    }

    if (foundInList) {
      setProduct(foundInList);
      setLoading(false);
      setError(false);
      return;
    }

    if (targetId) {
      setLoading(true);
      setError(false);
      axios.get(`http://localhost:5000/api/products/${encodeURIComponent(targetId)}`)
        .then(res => {
          if (res.data && (res.data._id || res.data.name)) {
            setProduct(res.data);
            setError(false);
          } else {
            setError(true);
          }
        })
        .catch(() => {
          setError(true);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
      setError(true);
    }
  }, [targetId, initialProduct, foundInList]);

  const [currentRating, setCurrentRating] = useState(product?.rating ?? 4.5);
  const [currentReviewsCount, setCurrentReviewsCount] = useState(product?.reviews ?? 0);

  useEffect(() => {
    if (product) {
      setCurrentRating(product.rating ?? 4.5);
      setCurrentReviewsCount(product.reviews ?? 0);
    }
  }, [product?._id, product?.productId]);

  const onProductRatingUpdateRef = useRef(onProductRatingUpdate);
  useEffect(() => {
    onProductRatingUpdateRef.current = onProductRatingUpdate;
  }, [onProductRatingUpdate]);

  const handleRatingUpdate = useCallback((newStats) => {
    if (newStats) {
      setCurrentRating(newStats.averageRating);
      setCurrentReviewsCount(newStats.totalReviews);
      if (onProductRatingUpdateRef.current && product) {
        onProductRatingUpdateRef.current(product._id || product.productId, newStats.averageRating, newStats.totalReviews);
      }
    }
  }, [product?._id, product?.productId]);

  if (loading) {
    return (
      <section className="page">
        <div style={{ textAlign: "center", padding: "80px 20px", color: "#94a3b8" }}>
          <div style={{ fontSize: "2rem", marginBottom: "16px" }}>⏳</div>
          <h2>Loading product details...</h2>
        </div>
      </section>
    );
  }

  if (error || !product) {
    return (
      <section className="page">
        <div className="emptyPage">
          <h1>Product not found</h1>
          <p style={{ color: "#94a3b8", marginBottom: "20px" }}>The requested product could not be found.</p>
          <button className="primaryBtn" onClick={() => goPath('/products')}>Back to Products</button>
        </div>
      </section>
    );
  }

  const currentProdId = String(product._id || product.productId);
  const activeIsWishlisted = checkIsWishlisted ? checkIsWishlisted(currentProdId) : !!isWishlisted;

  const handleOpenRelated = (p) => {
    recordProductView(p, token);
    const nextId = p._id || p.productId;
    goPath('/products/' + encodeURIComponent(nextId));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return <main className="page productPage">
    <button className="backBtn" onClick={()=>goPath('/products')}>← Back to Products</button>
    <section className="productDetail fullDetail">
      <ProductGallery product={product} title={product.name} />
      <div className="detailInfo"><span className="detailCat">{product.category}</span><h1>{product.name}</h1>
        <div className="detailRating">
          <Star size={16} fill={currentReviewsCount > 0 ? "#f4a300" : "none"} color={currentReviewsCount > 0 ? "#f4a300" : "#64748b"}/>
          <strong style={{ marginLeft: "5px", color: "#f8fafc" }}>{currentReviewsCount > 0 ? Number(currentRating).toFixed(1) : "0.0"}</strong>
          <span style={{ color: "#94a3b8", marginLeft: "4px" }}>({currentReviewsCount} {currentReviewsCount === 1 ? 'review' : 'reviews'})</span>
          <a
            href="#reviews-section"
            className="jumpToReviews"
            onClick={(e)=>{
              e.preventDefault();
              document.getElementById("reviews-section")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            {currentReviewsCount > 0 ? "Read Customer Reviews ↓" : "Write First Review ↓"}
          </a>
        </div>
        <p>{product.description}</p>
        <div className="detailPrice">₹{product.price.toLocaleString("en-IN")} <del>₹{product.originalPrice.toLocaleString("en-IN")}</del> <b>{product.discount}% OFF</b></div>
        <div className="detailStock">✓ In Stock &nbsp; • &nbsp; Free Delivery &nbsp; • &nbsp; 7 Days Return</div>
        <div className="detailActions">
          <button className="detailAdd" onClick={()=>add(product)} id="detail-add-cart-btn"><ShoppingCart size={18}/> Add to Cart</button>
          <button
            className={`detailWishlistBtn ${activeIsWishlisted ? 'active' : ''}`}
            onClick={()=>onToggleWishlist && onToggleWishlist(product)}
            title={activeIsWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
            aria-label={activeIsWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
            id="detail-wishlist-toggle-btn"
          >
            <Heart size={18} fill={activeIsWishlisted ? "#ef4444" : "none"} color={activeIsWishlisted ? "#ef4444" : "currentColor"}/>
            {activeIsWishlisted ? "In Wishlist" : "Add to Wishlist"}
          </button>
          <ShareProductButton product={product} showToast={showToast} />
          <button className="buyBtn" onClick={()=>{add(product);goPath('/cart')}} id="detail-buy-now-btn">Buy Now <ArrowRight size={17}/></button>
        </div>
      </div>
    </section>
    <section className="detailDescription"><span>PRODUCT DETAILS</span><h2>About this product</h2><p>{product.description}. Designed for everyday performance with reliable quality, modern features and a great user experience.</p></section>

    {/* Complete TechZone Reviews & Ratings System */}
    <ProductReviewsSection
      productId={currentProdId}
      productName={product.name}
      userId={userId}
      onRatingUpdate={handleRatingUpdate}
      showToast={showToast}
    />

    {/* Dynamic "You May Also Like" Recommendation Section */}
    <RecommendedProducts
      currentProduct={product}
      allProducts={products}
      add={add}
      onOpen={handleOpenRelated}
      checkIsWishlisted={checkIsWishlisted}
      onToggleWishlist={onToggleWishlist}
      title="You May Also Like"
    />

    {/* Dynamic Recently Viewed Products Section */}
    <RecentlyViewedSection
      currentProductId={currentProdId}
      add={add}
      onOpen={handleOpenRelated}
      checkIsWishlisted={checkIsWishlisted}
      onToggleWishlist={onToggleWishlist}
      token={token}
      showToast={showToast}
      onNavigate={goPath}
    />
  </main>
}

const REQUIRED_CATEGORIES = [
  "All",
  "Mobiles",
  "Accessories",
  "Laptops",
  "Smartwatches",
  "Earbuds",
  "Monitors",
  "Gaming",
  "Headphones"
];

function Products({add,initialCategory='All',products,setProducts,checkIsWishlisted,onToggleWishlist,token}){
  const [q, setQ] = useState(() => {
    try {
      return new URLSearchParams(window.location.search).get('search') || "";
    } catch(e) { return ""; }
  });
  const [cat, setCat] = useState(initialCategory);
  const [sort, setSort] = useState("Featured");
  const [page, setPage] = useState(1);
  const perPage=50;

  useEffect(()=>setCat(initialCategory),[initialCategory]);

  useEffect(() => {
    const handlePopState = () => {
      const searchCat = new URLSearchParams(window.location.search).get('category') || 'All';
      const searchQ = new URLSearchParams(window.location.search).get('search') || '';
      setCat(searchCat);
      setQ(searchQ);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleCategoryChange = (newCat) => {
    setCat(newCat);
    const params = new URLSearchParams(window.location.search);
    if (newCat === "All") {
      params.delete("category");
    } else {
      params.set("category", newCat);
    }
    const newQuery = params.toString() ? `?${params.toString()}` : "";
    window.history.replaceState({}, "", `${window.location.pathname}${newQuery}`);
  };

  const cats=useMemo(()=>{
    const productCats=Array.from(new Set(products.map(p=>p.category).filter(Boolean)));
    const merged=[...REQUIRED_CATEGORIES];
    for(const c of productCats){
      if(!merged.some(m=>m.toLowerCase()===c.toLowerCase())){
        merged.push(c);
      }
    }
    return merged;
  },[products]);

  const list=useMemo(()=>{
    let x=products.filter(p=>(cat==="All"||p.category?.toLowerCase()===cat.toLowerCase()||p.category===cat)&&`${p.name} ${p.description}`.toLowerCase().includes(q.toLowerCase()));
    if(sort==="Price: Low to High")x.sort((a,b)=>a.price-b.price);
    if(sort==="Price: High to Low")x.sort((a,b)=>b.price-a.price);
    if(sort==="Rating")x.sort((a,b)=>b.rating-a.rating);
    return x;
  },[products,q,cat,sort]);

  useEffect(()=>setPage(1),[q,cat,sort]);
  const total=Math.max(1,Math.ceil(list.length/perPage));
  const visible=list.slice((page-1)*perPage,page*perPage);
  const openProduct = (p) => {
    recordProductView(p, token);
    goPath('/products/' + encodeURIComponent(p._id || p.productId));
  };

  return <main className="page" id="products">
    <div className="title"><h1>{cat==='All'?'All Products':cat}</h1><p>Discover the best deals on latest electronics</p></div>
    <div className="filters">
      <div className="filter">
        <Search size={18}/>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search products..."/>
      </div>
      <CategoryDropdown
        value={cat}
        onChange={handleCategoryChange}
        categories={cats}
      />
      <div className="sort">
        <SlidersHorizontal size={16}/>Sort by:
        <select value={sort} onChange={e=>setSort(e.target.value)}>
          <option>Featured</option>
          <option>Price: Low to High</option>
          <option>Price: High to Low</option>
          <option>Rating</option>
        </select>
      </div>
    </div>
    <div className="resultCount">Showing {list.length?(page-1)*perPage+1:0}-{Math.min(page*perPage,list.length)} of {list.length} products</div>
    <div className="grid">{visible.map(p=><Card key={p._id || p.productId} p={p} add={add} onOpen={openProduct} isWishlisted={checkIsWishlisted ? checkIsWishlisted(p._id || p.productId) : false} onToggleWishlist={onToggleWishlist}/>)}</div>
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

  return <main className="page cartPage"><div className="title"><h1>Shopping Cart</h1><p>Review your products and continue to checkout.</p></div>{items.length===0?<div className="emptyPage"><ShoppingCart size={55}/><h2>Your cart is empty</h2><button className="primaryBtn" onClick={()=>goPath('/products')}>Continue Shopping</button></div>:<div className="cartLayout"><div className="cartList">{items.map(x=><div className="cartRow" key={x._id}><img src={x.image} alt={x.name}/><div><h3>{x.name}</h3><p>{x.description}</p><strong>₹{x.price.toLocaleString('en-IN')}</strong><div className="qty"><button onClick={()=>onRemove(x._id)}>−</button><span>{x.qty}</span><button onClick={()=>onAdd(x)}>+</button></div></div></div>)}</div><aside className="summary"><h2>Price Details</h2><div><span>Items</span><span>{items.reduce((s,x)=>s+x.qty,0)}</span></div><div><span>Total</span><strong>₹{total.toLocaleString('en-IN')}</strong></div><button className="checkoutBtn" id="cart-proceed-checkout-btn" onClick={()=>goPath('/checkout')}>Proceed to Checkout →</button></aside></div>}

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

function Toast({ toast, onClose }){
  if (!toast) return null;
  return (
    <aside className={`toastBanner ${toast.type || 'wishlist-add'}`} role="status">
      <div className="toastContent">
        <span className="toastIcon">{toast.icon || "❤️"}</span>
        <div>
          <div className="toastTitle">{toast.title}</div>
          {toast.message && <div className="toastMsg">{toast.message}</div>}
        </div>
      </div>
      <button className="toastClose" onClick={onClose} aria-label="Dismiss notification"><X size={16} /></button>
    </aside>
  );
}

const HOME_CATEGORIES = [
  { name: "Mobiles", image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=300&q=80" },
  { name: "Laptops", image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=300&q=80" },
  { name: "Headphones", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=300&q=80" },
  { name: "Smartwatches", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=300&q=80" },
  { name: "Earbuds", image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=300&q=80" },
  { name: "Accessories", image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=300&q=80" },
  { name: "Gaming", image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=300&q=80" },
  { name: "Monitors", image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=300&q=80" }
];

function Home({add, products = [], checkIsWishlisted, onToggleWishlist, token, showToast}){
  const [bestsellerTab, setBestsellerTab] = useState("All");

  const allProducts = useMemo(() => products.length ? products : demo, [products]);

  const openProduct = (p) => {
    recordProductView(p, token);
    goPath('/products/' + encodeURIComponent(p._id || p.productId));
  };

  // Best Sellers (sorted by rating and reviews)
  const bestSellers = useMemo(() => {
    let list = [...allProducts].sort((a, b) => (b.rating || 0) - (a.rating || 0) || (b.reviews || 0) - (a.reviews || 0));
    if (bestsellerTab === "Mobiles") list = list.filter(p => p.category?.toLowerCase() === "mobiles");
    else if (bestsellerTab === "Laptops") list = list.filter(p => p.category?.toLowerCase() === "laptops");
    else if (bestsellerTab === "Audio") list = list.filter(p => ["headphones", "earbuds"].includes(p.category?.toLowerCase()));
    else if (bestsellerTab === "Wearables") list = list.filter(p => p.category?.toLowerCase() === "smartwatches");
    return list.slice(0, 8);
  }, [allProducts, bestsellerTab]);

  // Recently Added (new releases)
  const recentlyAdded = useMemo(() => {
    return allProducts.slice(0, 4);
  }, [allProducts]);

  // Recommended for You (curated mix across diverse categories)
  const recommendedForYou = useMemo(() => {
    const cats = ['Mobiles', 'Laptops', 'Headphones', 'Smartwatches'];
    const picks = [];
    cats.forEach(c => {
      const match = allProducts.find(p => p.category?.toLowerCase() === c.toLowerCase() && !picks.includes(p));
      if (match) picks.push(match);
    });
    return picks.length >= 4 ? picks : allProducts.slice(4, 8);
  }, [allProducts]);

  return (
    <>
      {/* 1. Main Hero Banner */}
      <HeroSlider onNavigate={goPath} />

      {/* 2. Exclusive Deals & Featured Picks Carousel Section */}
      <FeaturedPromotionsCarousel onNavigate={goPath} />

      {/* 2. Well-Designed Category Navigation Section with Real Images */}
      <section className="home-category-section" aria-label="Shop by category">
        <div className="category-nav-header">
          <div>
            <h2>Shop by Category</h2>
            <p>Explore genuine electronics backed by official brand warranty</p>
          </div>
          <button className="section-view-all-link" onClick={() => goPath('/products')}>
            View All Categories →
          </button>
        </div>

        <div className="category-nav-grid">
          {HOME_CATEGORIES.map((cat) => {
            const count = allProducts.filter(p => p.category?.toLowerCase() === cat.name.toLowerCase()).length;
            return (
              <div
                key={cat.name}
                className="category-nav-card"
                onClick={() => goPath('/products?category=' + encodeURIComponent(cat.name))}
                id={`home-cat-card-${cat.name.toLowerCase()}`}
              >
                <div className="cat-card-img">
                  <img src={cat.image} alt={cat.name} loading="lazy" />
                </div>
                <div className="cat-card-name">{cat.name}</div>
                <div className="cat-card-count">{count > 0 ? `${count} Products` : "Explore"}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Best Sellers Section (Customers start shopping immediately) */}
      <section className="page" style={{ margin: '48px auto 0' }}>
        <div className="section-header-row">
          <div className="section-header-title-wrap">
            <h2>Best Sellers in Tech</h2>
            <p>Customer favorites with verified 4.0+ star ratings and manufacturer warranty</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {['All', 'Mobiles', 'Laptops', 'Audio', 'Wearables'].map(tab => (
              <button
                key={tab}
                type="button"
                className={`section-tab-pill ${bestsellerTab === tab ? 'active' : ''}`}
                onClick={() => setBestsellerTab(tab)}
              >
                {tab}
              </button>
            ))}
            <button className="section-view-all-link" onClick={() => goPath('/products')}>
              View All ({allProducts.length}) →
            </button>
          </div>
        </div>

        <div className="grid">
          {bestSellers.map(p => (
            <Card
              key={p._id || p.productId}
              p={p}
              add={add}
              onOpen={openProduct}
              isWishlisted={checkIsWishlisted ? checkIsWishlisted(p._id || p.productId) : false}
              onToggleWishlist={onToggleWishlist}
            />
          ))}
        </div>
      </section>

      {/* 4. Live Flash Sale Section with Countdown Timer and Deals Carousel */}
      <FlashSaleSection
        onNavigate={goPath}
        add={add}
        checkIsWishlisted={checkIsWishlisted}
        onToggleWishlist={onToggleWishlist}
      />

      {/* 5. Recently Added / New Releases Section */}
      <section className="page" style={{ margin: '40px auto 0' }}>
        <div className="section-header-row">
          <div className="section-header-title-wrap">
            <h2>New Releases & Recent Additions</h2>
            <p>Fresh inventory and upgraded models straight from official suppliers</p>
          </div>
          <button className="section-view-all-link" onClick={() => goPath('/products')}>
            Browse Full Catalog →
          </button>
        </div>
        <div className="grid">
          {recentlyAdded.map(p => (
            <Card
              key={p._id || p.productId}
              p={p}
              add={add}
              onOpen={openProduct}
              isWishlisted={checkIsWishlisted ? checkIsWishlisted(p._id || p.productId) : false}
              onToggleWishlist={onToggleWishlist}
            />
          ))}
        </div>
      </section>

      {/* 6. Recommended for You Section */}
      <section className="page" style={{ margin: '40px auto 0' }}>
        <div className="section-header-row">
          <div className="section-header-title-wrap">
            <h2>Recommended for You</h2>
            <p>Handpicked electronics tailored for everyday productivity and entertainment</p>
          </div>
          <button className="section-view-all-link" onClick={() => goPath('/products')}>
            See More Recommendations →
          </button>
        </div>
        <div className="grid">
          {recommendedForYou.map(p => (
            <Card
              key={p._id || p.productId}
              p={p}
              add={add}
              onOpen={openProduct}
              isWishlisted={checkIsWishlisted ? checkIsWishlisted(p._id || p.productId) : false}
              onToggleWishlist={onToggleWishlist}
            />
          ))}
        </div>
      </section>

      {/* 7. Interactive Recently Viewed Products Section */}
      <section className="page" style={{ margin: '30px auto 0' }}>
        <RecentlyViewedSection
          isHomePage={true}
          add={add}
          onOpen={openProduct}
          checkIsWishlisted={checkIsWishlisted}
          onToggleWishlist={onToggleWishlist}
          token={token}
          showToast={showToast}
          onNavigate={goPath}
        />
      </section>

      {/* 8. Retail Trust & Customer Guarantees Strip */}
      <section className="retail-guarantee-strip">
        <div className="guarantee-item">
          <div className="guarantee-icon-box">
            <ShieldCheck size={22} />
          </div>
          <div className="guarantee-content">
            <h3>100% Genuine Products</h3>
            <p>Direct from authorized manufacturers with genuine brand guarantees.</p>
          </div>
        </div>
        <div className="guarantee-item">
          <div className="guarantee-icon-box">
            <Truck size={22} />
          </div>
          <div className="guarantee-content">
            <h3>Free Express Delivery</h3>
            <p>Complimentary priority shipping across India on orders over ₹999.</p>
          </div>
        </div>
        <div className="guarantee-item">
          <div className="guarantee-icon-box">
            <RotateCcw size={22} />
          </div>
          <div className="guarantee-content">
            <h3>7-Day Easy Returns</h3>
            <p>Hassle-free doorstep pickup with instant replacement or full refund.</p>
          </div>
        </div>
        <div className="guarantee-item">
          <div className="guarantee-icon-box">
            <Zap size={22} />
          </div>
          <div className="guarantee-content">
            <h3>Official Brand Warranty</h3>
            <p>Comprehensive service coverage with nationwide service center support.</p>
          </div>
        </div>
      </section>
    </>
  );
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
        <button onClick={()=>goPath('/recently-viewed')}>Recently Viewed</button>
        <button onClick={()=>goPath('/flash-sale')} style={{ color: '#f87171', fontWeight: 'bold' }}>⚡ Flash Sale Deals</button>
        <button onClick={()=>goPath('/my-account')}>My Account</button>
        <button onClick={()=>goPath('/my-orders')}>Order History</button>
        <button onClick={()=>goPath('/my-returns')} style={{ color: '#fbbf24', fontWeight: '500' }}>Returns & Refunds</button>
        <button onClick={()=>goPath('/wishlist')}>My Wishlist</button>
        <button onClick={()=>goPath('/cart')}>Shopping Cart</button>
      </div>
      <div>
        <h4>Explore TechZone</h4>
        <button onClick={()=>goPath('/features')}>Platform Features</button>
        <button onClick={()=>goPath('/enterprise')}>Enterprise Solutions</button>
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
  const[cart,setCart]=useState(()=>{
    try {
      const s = localStorage.getItem("techzone_cart");
      return s ? JSON.parse(s) : [];
    } catch(e) { return []; }
  });
  const[route,setRoute]=useState(pathKey());
  const[currentPath,setCurrentPath]=useState(window.location.pathname);

  // Synchronize customer theme vs. Admin/SuperAdmin console isolation
  useEffect(() => {
    if (route === 'admin' || route === 'superadmin' || currentPath.startsWith('/admin') || currentPath.startsWith('/superadmin')) {
      document.documentElement.removeAttribute("data-theme");
      document.body.classList.remove("tz-dark-mode", "tz-light-mode");
    } else {
      const saved = localStorage.getItem("techzone_theme") || "light";
      document.documentElement.setAttribute("data-theme", saved);
      if (saved === "dark") {
        document.body.classList.add("tz-dark-mode");
        document.body.classList.remove("tz-light-mode");
      } else {
        document.body.classList.add("tz-light-mode");
        document.body.classList.remove("tz-dark-mode");
      }
    }
  }, [route, currentPath]);
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

  // Persistent User / Guest ID
  const [userId] = useState(()=>{
    try {
      let uid = localStorage.getItem("techzone_user_id");
      if (!uid) {
        uid = "guest_" + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
        localStorage.setItem("techzone_user_id", uid);
      }
      return uid;
    } catch(e) {
      return "guest_user";
    }
  });

  // Wishlist state initialized from localStorage
  const [wishlist, setWishlist] = useState(()=>{
    try {
      const stored = localStorage.getItem("techzone_wishlist");
      return stored ? JSON.parse(stored) : [];
    } catch(e) {
      return [];
    }
  });

  // Toast notification state
  const [toast, setToast] = useState(null);
  const showToast = (title, message, type = "wishlist-add", icon = "❤️") => {
    setToast({ title, message, type, icon });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Authenticated User & Token state
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem("techzone_token") || null;
    } catch (e) {
      return null;
    }
  });

  const [user, setUser] = useState(() => {
    try {
      const u = localStorage.getItem("techzone_user");
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Sync / validate user profile on mount if token exists
  useEffect(() => {
    if (!token) return;
    axios
      .get("http://localhost:5000/api/users/profile", {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((res) => {
        if (res.data?.success && res.data.user) {
          setUser(res.data.user);
          localStorage.setItem("techzone_user", JSON.stringify(res.data.user));
        }
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          setUser(null);
          setToken(null);
          localStorage.removeItem("techzone_token");
          localStorage.removeItem("techzone_user");
        }
      });
  }, [token]);

  const handleAuthSuccess = (authenticatedUser, authToken) => {
    setUser(authenticatedUser);
    setToken(authToken);
    showToast("Welcome to TechZone", `Signed in as ${authenticatedUser.name}`, "cart-add", "👤");
    syncHistoryOnLogin(authToken);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    try {
      localStorage.removeItem("techzone_token");
      localStorage.removeItem("techzone_user");
    } catch (e) {}
    showToast("Signed Out", "You have been logged out of TechZone.", "wishlist-remove", "🚪");
    if (route === "my-account" || route === "my-orders" || route === "order-detail" || route === "my-returns" || route === "return-detail") {
      goPath("/");
    }
  };

  useEffect(()=>{
    const onPop=()=>{
      setRoute(pathKey());
      setCurrentPath(window.location.pathname);
    };
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

    // Sync wishlist from backend MongoDB
    axios.get(`http://localhost:5000/api/wishlist/${userId}`).then(r => {
      if(r.data?.success && Array.isArray(r.data.items)){
        setWishlist(r.data.items);
        localStorage.setItem("techzone_wishlist", JSON.stringify(r.data.items));
      }
    }).catch(()=>{});

    return()=>window.removeEventListener('popstate',onPop);
  },[userId]);

  const add=p=>{
    setCart(c=>{
      const next = c.some(x=>x._id===p._id)?c.map(x=>x._id===p._id?{...x,qty:x.qty+1}:x):[...c,{...p,qty:1}];
      try { localStorage.setItem("techzone_cart", JSON.stringify(next)); } catch(e){}
      return next;
    });
    showToast("Added to Cart", p.name, "cart-add", "🛒");
  };
  const remove=id=>setCart(c=>{
    const next = c.map(x=>x._id===id?{...x,qty:x.qty-1}:x).filter(x=>x.qty>0);
    try { localStorage.setItem("techzone_cart", JSON.stringify(next)); } catch(e){}
    return next;
  });

  const checkIsWishlisted = (productId) => {
    return wishlist.some(item => String(item.productId || item._id) === String(productId));
  };

  const toggleWishlist = (product) => {
    const pId = String(product._id || product.productId);
    const isSaved = wishlist.some(item => String(item.productId || item._id) === pId);

    if (isSaved) {
      const updated = wishlist.filter(item => String(item.productId || item._id) !== pId);
      setWishlist(updated);
      localStorage.setItem("techzone_wishlist", JSON.stringify(updated));
      showToast("Removed from Wishlist", product.name, "wishlist-remove", "🤍");

      axios.delete(`http://localhost:5000/api/wishlist/${pId}?userId=${userId}`).catch(()=>{});
    } else {
      const itemToSave = {
        productId: pId,
        name: product.name,
        description: product.description || "",
        price: product.price,
        originalPrice: product.originalPrice || product.price,
        discount: product.discount || 0,
        category: product.category || "Electronics",
        image: product.image,
        rating: product.rating || 4.5,
        reviews: product.reviews || 0,
        stock: product.stock || 10
      };
      const updated = [itemToSave, ...wishlist];
      setWishlist(updated);
      localStorage.setItem("techzone_wishlist", JSON.stringify(updated));
      showToast("Added to Wishlist", product.name, "wishlist-add", "❤️");

      axios.post("http://localhost:5000/api/wishlist", {
        userId,
        productId: pId,
        product: itemToSave
      }).catch(()=>{});
    }
  };

  const removeFromWishlist = (productId) => {
    const pId = String(productId);
    const removedItem = wishlist.find(item => String(item.productId || item._id) === pId);
    const updated = wishlist.filter(item => String(item.productId || item._id) !== pId);
    setWishlist(updated);
    localStorage.setItem("techzone_wishlist", JSON.stringify(updated));
    showToast("Removed from Wishlist", removedItem?.name || "Product", "wishlist-remove", "🤍");

    axios.delete(`http://localhost:5000/api/wishlist/${pId}?userId=${userId}`).catch(()=>{});
  };

  const clearWishlist = () => {
    setWishlist([]);
    localStorage.setItem("techzone_wishlist", JSON.stringify([]));
    showToast("Wishlist Cleared", "All products removed from wishlist", "wishlist-remove", "🗑️");

    axios.delete(`http://localhost:5000/api/wishlist/clear/${userId}`).catch(()=>{});
  };

  const addWishlistItemToCart = (product) => {
    add(product);
  };

  const addAllWishlistToCart = () => {
    if (wishlist.length === 0) return;
    wishlist.forEach(item => {
      setCart(c=>c.some(x=>x._id===(item.productId || item._id))?c.map(x=>x._id===(item.productId || item._id)?{...x,qty:x.qty+1}:x):[...c,{...item, _id: item.productId || item._id, qty:1}]);
    });
    showToast("Added All to Cart", `${wishlist.length} products added to your cart!`, "cart-add", "🛍️");
  };

  const handleCheckout=(newOrder)=>{
    const updated=[newOrder,...orders];
    setOrders(updated);
    localStorage.setItem("techzone_orders",JSON.stringify(updated));
    setCart([]);
    axios.post('http://localhost:5000/api/orders',newOrder).catch(()=>{});
  };

  const handleProductRatingUpdate = useCallback((pId, avgRating, totalReviews) => {
    setProducts((prev) => {
      const existing = prev.find((p) => String(p._id) === String(pId));
      if (
        existing &&
        Number(existing.rating) === Number(avgRating) &&
        Number(existing.reviews) === Number(totalReviews)
      ) {
        return prev;
      }
      const updated = prev.map((p) =>
        String(p._id) === String(pId) ? { ...p, rating: avgRating, reviews: totalReviews } : p
      );
      try {
        localStorage.setItem("techzone_products", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, []);

  if(route==='superadmin'){
    return (
      <SuperAdminApp
        currentPath={currentPath}
        onNavigate={goPath}
        onBackToStore={()=>goPath('/')}
      />
    );
  }

  if(route==='admin'){
    return (
      <AdminProtectedRoute
        onBackToStore={()=>goPath('/')}
        currentPath={currentPath}
      >
        {({ adminUser, adminToken, onAdminLogout }) => (
          <AdminPanel
            products={products}
            setProducts={setProducts}
            orders={orders}
            setOrders={setOrders}
            user={user}
            token={token}
            adminUser={adminUser}
            adminToken={adminToken}
            onAdminLogout={onAdminLogout}
            onLogout={onAdminLogout}
            onBackToStore={()=>goPath('/')}
            onViewProduct={p=>goPath('/products/'+encodeURIComponent(p._id || p.productId))}
          />
        )}
      </AdminProtectedRoute>
    );
  }

  const currentId = decodeURIComponent(
    window.location.pathname.startsWith('/products/')
      ? window.location.pathname.replace(/^\/products\//, '').split('/')[0]
      : (window.location.pathname.split('/').pop() || '')
  );
  const selected = products.find(p => String(p._id) === String(currentId) || String(p.productId) === String(currentId));
  let content;
  if(route==='home')content=<Home add={add} products={products} checkIsWishlisted={checkIsWishlisted} onToggleWishlist={toggleWishlist} token={token} showToast={showToast}/>;
  else if(route==='flash-sale')content=<FlashSalePage onNavigate={goPath} add={add} checkIsWishlisted={checkIsWishlisted} onToggleWishlist={toggleWishlist} showToast={showToast}/>;
  else if(route==='products')content=<Products add={add} products={products} setProducts={setProducts} initialCategory={new URLSearchParams(window.location.search).get('category')||'All'} checkIsWishlisted={checkIsWishlisted} onToggleWishlist={toggleWishlist} token={token}/>;
  else if(route==='recently-viewed')content=(
    <main className="page" style={{ minHeight: '650px', margin: '30px auto' }}>
      <RecentlyViewedSection
        add={add}
        onOpen={p=>{
          recordProductView(p, token);
          goPath('/products/'+encodeURIComponent(p._id || p.productId));
        }}
        checkIsWishlisted={checkIsWishlisted}
        onToggleWishlist={toggleWishlist}
        token={token}
        showToast={showToast}
        onNavigate={goPath}
      />
    </main>
  );
  else if(route==='product-detail')content=(
    <ProductDetail
      key={currentId || selected?._id || 'product-detail'}
      productId={currentId}
      product={selected}
      products={products}
      add={add}
      isWishlisted={selected ? checkIsWishlisted(selected._id || selected.productId) : false}
      onToggleWishlist={toggleWishlist}
      checkIsWishlisted={checkIsWishlisted}
      userId={userId}
      token={token}
      showToast={showToast}
      onProductRatingUpdate={handleProductRatingUpdate}
    />
  );
  else if(route==='wishlist')content=<WishlistPage wishlist={wishlist} onRemove={removeFromWishlist} onAddToCart={addWishlistItemToCart} onClearWishlist={clearWishlist} onAddAllToCart={addAllWishlistToCart} onOpenProduct={p=>goPath('/products/'+encodeURIComponent(p.productId || p._id))} onNavigate={goPath}/>;
  else if(route==='cart')content=<CartPage items={cart} onRemove={remove} onAdd={add} onCheckout={handleCheckout}/>;
  else if(route==='checkout')content=<CheckoutPage cartItems={cart} onClearCart={()=>{setCart([]);try{localStorage.setItem("techzone_cart",JSON.stringify([]));}catch(e){}}} onNavigate={goPath} showToast={showToast} userId={userId}/>;
  else if(route==='order-success'){
    const orderId=decodeURIComponent(window.location.pathname.replace('/order-success/',''));
    content=<OrderSuccessPage orderId={orderId} onNavigate={goPath} showToast={showToast}/>;
  }
  else if(route==='my-account'){
    content=<MyAccountPage user={user} token={token} onUpdateUser={setUser} onLogout={handleLogout} onNavigate={goPath} onOpenAuthModal={()=>setIsAuthModalOpen(true)} showToast={showToast}/>;
  }
  else if(route==='my-orders'){
    content=<OrderHistoryPage user={user} token={token} onNavigate={goPath} onOpenAuthModal={()=>setIsAuthModalOpen(true)} showToast={showToast}/>;
  }
  else if(route==='order-detail'){
    const orderId=decodeURIComponent(window.location.pathname.replace('/my-orders/',''));
    content=<OrderDetailsPage orderId={orderId} user={user} token={token} onNavigate={goPath} onOpenAuthModal={()=>setIsAuthModalOpen(true)} showToast={showToast}/>;
  }
  else if(route==='my-returns'){
    content=<MyReturnsPage user={user} token={token} onNavigate={goPath} onOpenAuthModal={()=>setIsAuthModalOpen(true)} showToast={showToast}/>;
  }
  else if(route==='return-detail'){
    const returnId=decodeURIComponent(window.location.pathname.replace('/my-returns/',''));
    content=<ReturnDetailsPage returnId={returnId} user={user} token={token} onNavigate={goPath} onOpenAuthModal={()=>setIsAuthModalOpen(true)} showToast={showToast}/>;
  }
  else content=<InfoPage type={route}/>;

  return <>
    <Header
      count={cart.reduce((s,x)=>s+x.qty,0)}
      wishlistCount={wishlist.length}
      currentRoute={route}
      user={user}
      onLogout={handleLogout}
      onOpenAuthModal={()=>setIsAuthModalOpen(true)}
    />
    {content}
    <Footer/>
    <Toast toast={toast} onClose={()=>setToast(null)}/>
    <AuthModal
      isOpen={isAuthModalOpen}
      onClose={()=>setIsAuthModalOpen(false)}
      onAuthSuccess={handleAuthSuccess}
    />
  </>
}
createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </BrowserRouter>
);

