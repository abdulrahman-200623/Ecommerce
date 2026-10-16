/**
 * Comprehensive Automated Verification Suite for TechZone Flash Sale Feature
 */
const mongoose = require("mongoose");

const BASE = "http://localhost:5000/api";
const ADMIN_HEADERS = {
  "Content-Type": "application/json",
  "x-admin-key": "techzone-admin-secret"
};
const UNAUTH_HEADERS = {
  "Content-Type": "application/json"
};

async function runTests() {
  console.log("=== STARTING TECHZONE FLASH SALE TEST SUITE ===\n");
  let passed = 0;
  let failed = 0;

  function assert(condition, description) {
    if (condition) {
      console.log(`[PASS] ${description}`);
      passed++;
    } else {
      console.error(`[FAIL] ${description}`);
      failed++;
    }
  }

  try {
    // 1. Fetch products from DB to get a valid product for testing
    const prodsRes = await fetch(`${BASE}/products`);
    const products = await prodsRes.json();
    assert(products.length > 0, "Products exist in database");
    const testProduct = products[0];
    const testProduct2 = products[1];
    console.log(`Using test product: "${testProduct.name}" (ID: ${testProduct._id}, Price: ₹${testProduct.price})`);

    // 2. Test Unauthorized Access to Flash Sale Management APIs
    console.log("\n--- Testing Authorization Guards ---");
    const unauthGet = await fetch(`${BASE}/flash-sales/all`, { headers: UNAUTH_HEADERS });
    assert(unauthGet.status === 401 || unauthGet.status === 403, "GET /api/flash-sales/all rejects unauthorized requests (HTTP 401/403)");

    const unauthPost = await fetch(`${BASE}/flash-sales`, {
      method: "POST",
      headers: UNAUTH_HEADERS,
      body: JSON.stringify({ productId: testProduct._id, salePrice: 100 })
    });
    assert(unauthPost.status === 401 || unauthPost.status === 403, "POST /api/flash-sales rejects unauthorized creation");

    // 3. Test Invalid Prices and Date Ranges Rejection
    console.log("\n--- Testing Server-Side Validation Rules ---");
    const now = Date.now();

    // 3a. Sale price >= regular price
    const invalidPriceRes = await fetch(`${BASE}/flash-sales`, {
      method: "POST",
      headers: ADMIN_HEADERS,
      body: JSON.stringify({
        productId: testProduct._id,
        salePrice: testProduct.price + 500, // higher than original
        startTime: new Date(now).toISOString(),
        endTime: new Date(now + 3600000).toISOString()
      })
    });
    const invalidPriceData = await invalidPriceRes.json();
    assert(invalidPriceRes.status === 400 && invalidPriceData.success === false, "Rejects sale price >= regular price");

    // 3b. End date <= start date
    const invalidDateRes = await fetch(`${BASE}/flash-sales`, {
      method: "POST",
      headers: ADMIN_HEADERS,
      body: JSON.stringify({
        productId: testProduct._id,
        salePrice: Math.round(testProduct.price * 0.7),
        startTime: new Date(now + 3600000).toISOString(),
        endTime: new Date(now).toISOString() // end is before start
      })
    });
    const invalidDateData = await invalidDateRes.json();
    assert(invalidDateRes.status === 400 && invalidDateData.success === false, "Rejects end date earlier than start date");

    // 4. Admin Creates Valid Flash Sale
    console.log("\n--- Testing Admin Flash Sale Creation ---");
    const validSaleRes = await fetch(`${BASE}/flash-sales`, {
      method: "POST",
      headers: ADMIN_HEADERS,
      body: JSON.stringify({
        productId: testProduct._id,
        discountPercentage: 35, // 35% discount
        startTime: new Date(now - 1000 * 60).toISOString(), // started 1 min ago -> Active
        endTime: new Date(now + 3600000 * 12).toISOString(), // ends in 12 hours
        saleQuantity: 25,
        isActive: true
      })
    });
    const validSaleData = await validSaleRes.json();
    assert(validSaleRes.status === 201 && validSaleData.success === true, "Admin successfully creates active flash sale");
    const createdSaleId = validSaleData.flashSale?._id;
    console.log(`Created Flash Sale ID: ${createdSaleId}, Sale Price: ₹${validSaleData.flashSale?.salePrice}`);

    // 5. Test Active Deals Endpoint returns the new deal
    console.log("\n--- Testing Active Deals Public Endpoint ---");
    const activeRes = await fetch(`${BASE}/flash-sales/active`);
    const activeData = await activeRes.json();
    assert(activeRes.status === 200 && activeData.success === true, "GET /api/flash-sales/active responds 200");
    const foundActive = activeData.activeDeals.find(d => String(d.productId) === String(testProduct._id));
    assert(!!foundActive, "Newly created deal appears in activeDeals list");
    assert(foundActive?.status === "Active", "Deal status correctly computed as 'Active'");
    assert(foundActive?.salePrice < foundActive?.originalPrice, "Sale price correctly calculated and lower than original");

    // 6. Test Upcoming Deals logic
    console.log("\n--- Testing Upcoming Flash Sale ---");
    const upcomingSaleRes = await fetch(`${BASE}/flash-sales`, {
      method: "POST",
      headers: ADMIN_HEADERS,
      body: JSON.stringify({
        productId: testProduct2._id,
        discountPercentage: 40,
        startTime: new Date(now + 3600000 * 4).toISOString(), // starts in 4 hours -> Upcoming
        endTime: new Date(now + 3600000 * 28).toISOString(),
        saleQuantity: 15,
        isActive: true
      })
    });
    const upcomingSaleData = await upcomingSaleRes.json();
    const upcomingSaleId = upcomingSaleData.flashSale?._id;

    const activeWithUpcomingRes = await fetch(`${BASE}/flash-sales/active`);
    const activeWithUpcomingData = await activeWithUpcomingRes.json();
    const foundUpcoming = activeWithUpcomingData.upcomingDeals.find(d => String(d.productId) === String(testProduct2._id));
    assert(!!foundUpcoming, "Upcoming deal appears in upcomingDeals list");
    assert(foundUpcoming?.status === "Scheduled", "Upcoming deal status is 'Scheduled'");

    // 7. Test Disabling and Expiring Deals (Excluded from Public)
    console.log("\n--- Testing Disable and Expire Handling ---");
    // Toggle active off
    const toggleRes = await fetch(`${BASE}/flash-sales/${createdSaleId}/toggle`, {
      method: "PATCH",
      headers: ADMIN_HEADERS
    });
    const toggleData = await toggleRes.json();
    assert(toggleData.success === true && toggleData.flashSale.isActive === false, "Admin can toggle flash sale status to Disabled");

    // Check that disabled sale is excluded from active public listing
    const checkDisabledRes = await fetch(`${BASE}/flash-sales/active`);
    const checkDisabledData = await checkDisabledRes.json();
    const disabledInActive = checkDisabledData.activeDeals.some(d => String(d._id) === String(createdSaleId));
    assert(!disabledInActive, "Disabled deal is strictly excluded from active deals public list");

    // Toggle it back on
    await fetch(`${BASE}/flash-sales/${createdSaleId}/toggle`, { method: "PATCH", headers: ADMIN_HEADERS });

    // 8. Test Pricing, Cart, and Checkout Integration
    console.log("\n--- Testing Order Checkout Price Revalidation ---");
    const activeDeal = foundActive;
    const checkoutCalcRes = await fetch(`${BASE}/orders/calculate-summary`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [
          {
            productId: activeDeal.productId,
            name: activeDeal.name,
            price: 1, // Attacker tries to send ₹1 in body
            qty: 2
          }
        ]
      })
    });
    const checkoutCalcData = await checkoutCalcRes.json();
    assert(checkoutCalcData.success === true, "POST /orders/calculate-summary succeeds");
    // Verified item unit price must match activeDeal.salePrice, NOT ₹1!
    const verifiedItem = checkoutCalcData.items[0];
    assert(verifiedItem.price === activeDeal.salePrice, `Server revalidated and applied correct flash sale price (₹${activeDeal.salePrice}), rejected attacker's price`);
    assert(checkoutCalcData.subtotal === activeDeal.salePrice * 2, "Subtotal accurately calculated from server-verified flash sale price");

    // 9. Clean up test deals
    console.log("\n--- Cleaning Up Test Data ---");
    if (createdSaleId) {
      const del1 = await fetch(`${BASE}/flash-sales/${createdSaleId}`, { method: "DELETE", headers: ADMIN_HEADERS });
      assert(del1.status === 200, "Admin can delete flash sale deal");
    }
    if (upcomingSaleId) {
      await fetch(`${BASE}/flash-sales/${upcomingSaleId}`, { method: "DELETE", headers: ADMIN_HEADERS });
    }

    // 10. Verify Existing Core Features Intact
    console.log("\n--- Verifying Existing Core TechZone Endpoints ---");
    const pRes = await fetch(`${BASE}/products`);
    const oRes = await fetch(`${BASE}/orders`);
    const statsRes = await fetch(`${BASE}/orders/stats`);
    assert(pRes.status === 200, "Products API operational");
    assert(oRes.status === 200, "Orders API operational");
    assert(statsRes.status === 200, "Order stats API operational");

    console.log(`\n=== TEST SUITE COMPLETED: ${passed} PASSED, ${failed} FAILED ===`);
  } catch (err) {
    console.error("Test execution encountered unexpected error:", err);
  }
}

runTests();
