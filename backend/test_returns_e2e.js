const axios = require("axios");

const BASE_URL = "http://localhost:5000/api";
const ADMIN_HEADERS = { "x-admin-key": "techzone-admin-secret" };

async function runTests() {
  console.log("==================================================");
  console.log("TECHZONE RETURN & REFUND MANAGEMENT SYSTEM E2E TESTS");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Policy Endpoint
    console.log("\n--- TEST 1: Public Policy Configuration ---");
    const policyRes = await axios.get(`${BASE_URL}/returns/policy`);
    assert(policyRes.data.success === true, "Policy endpoint responds with success");
    assert(policyRes.data.policy.returnWindowDays >= 1, `Default return window is ${policyRes.data.policy.returnWindowDays} days`);

    // 2. Eligibility for Delivered Order (TZ-869409)
    console.log("\n--- TEST 2: Order Return Eligibility ---");
    const eligRes = await axios.get(`${BASE_URL}/returns/order-eligibility/TZ-869409`);
    assert(eligRes.data.success === true, "Eligibility endpoint responds with success");
    assert(eligRes.data.isEligible === true, "Delivered order TZ-869409 is eligible for return");
    assert(eligRes.data.windowDays > 0, `Window days returned: ${eligRes.data.windowDays}`);
    assert(eligRes.data.deadlineDate != null, `Deadline date calculated: ${eligRes.data.deadlineDate}`);
    assert(Array.isArray(eligRes.data.items) && eligRes.data.items.length > 0, "Item-level returnable quantities provided");

    // 3. Customer Return Request Creation
    console.log("\n--- TEST 3: Submit Return Request ---");
    const testItem = eligRes.data.items[0];
    const returnPayload = {
      orderId: "TZ-869409",
      items: [
        {
          productId: testItem.productId,
          qty: 1
        }
      ],
      reason: "Product damaged",
      reasonDetails: "Outer package was dented and headphone left cup not working",
      photos: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=700&q=80"],
      resolution: "Refund to Original Payment Method",
      refundDetails: {
        upiId: "rahul@okaxis"
      }
    };

    const submitRes = await axios.post(`${BASE_URL}/returns/request`, returnPayload);
    assert(submitRes.data.success === true, "Return request created successfully");
    const createdReturn = submitRes.data.returnRequest;
    assert(createdReturn.returnNumber.startsWith("RET-"), `Return number generated: ${createdReturn.returnNumber}`);
    assert(createdReturn.status === "Requested", "Initial status is 'Requested'");
    assert(createdReturn.totalRefundAmount > 0, `Total refund amount calculated: ₹${createdReturn.totalRefundAmount}`);
    assert(createdReturn.nextExpectedStep != null, `Next expected step guidance: "${createdReturn.nextExpectedStep}"`);

    // 4. Over-Return Prevention Guard
    console.log("\n--- TEST 4: Quantity & Duplicate Return Protection ---");
    try {
      // Trying to return more than purchased or remaining
      await axios.post(`${BASE_URL}/returns/request`, {
        orderId: "TZ-869409",
        items: [{ productId: testItem.productId, qty: 999 }],
        reason: "Defective",
        resolution: "Refund"
      });
      assert(false, "Should reject over-quantity return request");
    } catch (err) {
      assert(err.response?.status === 400, "Successfully rejected over-quantity return with 400 Bad Request");
    }

    // 5. Customer Tracking Endpoints
    console.log("\n--- TEST 5: Customer Tracking (/my-returns) ---");
    const myReturnsRes = await axios.get(`${BASE_URL}/returns/my-returns?email=rahul.sharma@techzone.io`);
    assert(myReturnsRes.data.success === true, "Customer returns list fetched successfully");
    assert(myReturnsRes.data.returns.some(r => r.returnNumber === createdReturn.returnNumber), "Created return appears in customer list");

    const singleRes = await axios.get(`${BASE_URL}/returns/my-returns/${createdReturn.returnNumber}`);
    assert(singleRes.data.success === true, `Single return retrieved by returnNumber: ${singleRes.data.returnRequest.returnNumber}`);

    // 6. Admin Panel Return Management Endpoints
    console.log("\n--- TEST 6: Admin Management & Status Lifecycle ---");
    const adminAllRes = await axios.get(`${BASE_URL}/returns/admin/all`, { headers: ADMIN_HEADERS });
    assert(adminAllRes.data.success === true, "Admin list returns successfully");
    assert(adminAllRes.data.metrics.total >= 1, `Total metric: ${adminAllRes.data.metrics.total}`);
    assert(adminAllRes.data.metrics.pending >= 1, `Pending metric: ${adminAllRes.data.metrics.pending}`);

    // Test rejection guard: Rejection requires a reason
    try {
      await axios.patch(
        `${BASE_URL}/returns/admin/${createdReturn.returnNumber}/status`,
        { status: "Rejected", rejectionReason: "" },
        { headers: ADMIN_HEADERS }
      );
      assert(false, "Rejection without reason should be blocked");
    } catch (err) {
      assert(err.response?.status === 400, "Rejection without reason correctly blocked with 400");
    }

    // Advance status: Approve
    const approveRes = await axios.patch(
      `${BASE_URL}/returns/admin/${createdReturn.returnNumber}/status`,
      { status: "Approved", note: "Inspection documents verified, approved for courier collection" },
      { headers: ADMIN_HEADERS }
    );
    assert(approveRes.data.returnRequest.status === "Approved", "Status advanced to 'Approved'");

    // Advance status: Pickup Scheduled
    const pickupRes = await axios.patch(
      `${BASE_URL}/returns/admin/${createdReturn.returnNumber}/status`,
      { status: "Pickup Scheduled", note: "Courier agent scheduled for tomorrow" },
      { headers: ADMIN_HEADERS }
    );
    assert(pickupRes.data.returnRequest.status === "Pickup Scheduled", "Status advanced to 'Pickup Scheduled'");

    // Advance status: Item Received
    const receivedRes = await axios.patch(
      `${BASE_URL}/returns/admin/${createdReturn.returnNumber}/status`,
      { status: "Item Received", note: "Package arrived at Mumbai return warehouse" },
      { headers: ADMIN_HEADERS }
    );
    assert(receivedRes.data.returnRequest.status === "Item Received", "Status advanced to 'Item Received'");

    // Advance status: Refund Processing
    const processingRes = await axios.patch(
      `${BASE_URL}/returns/admin/${createdReturn.returnNumber}/status`,
      { status: "Refund Processing", note: "Item checked by QA technician. All accessories intact." },
      { headers: ADMIN_HEADERS }
    );
    assert(processingRes.data.returnRequest.status === "Refund Processing", "Status advanced to 'Refund Processing'");

    // Test Refund Completed guard: Requires transactionReference
    try {
      await axios.patch(
        `${BASE_URL}/returns/admin/${createdReturn.returnNumber}/status`,
        { status: "Refund Completed", transactionReference: "" },
        { headers: ADMIN_HEADERS }
      );
      assert(false, "Refund completion without transaction reference should be blocked");
    } catch (err) {
      assert(err.response?.status === 400, "Refund completion without transaction reference correctly blocked with 400");
    }

    // Complete Refund with valid Transaction Reference
    const completedRes = await axios.patch(
      `${BASE_URL}/returns/admin/${createdReturn.returnNumber}/status`,
      {
        status: "Refund Completed",
        transactionReference: "TXN-UPI-981249129841",
        note: "Refund of full amount sent to customer UPI account"
      },
      { headers: ADMIN_HEADERS }
    );
    assert(completedRes.data.returnRequest.status === "Refund Completed", "Status marked 'Refund Completed'");
    assert(
      completedRes.data.returnRequest.refundDetails.transactionReference === "TXN-UPI-981249129841",
      "Transaction reference correctly persisted to MongoDB"
    );

    // 7. Admin Return Policy Configuration Management
    console.log("\n--- TEST 7: Admin Return Policy Configuration ---");
    const updatePolicyRes = await axios.put(
      `${BASE_URL}/returns/admin/config`,
      {
        returnWindowDays: 10,
        allowReplacement: true,
        allowPartialReturns: true,
        policyDescription: "Items can be returned within 10 days of delivery."
      },
      { headers: ADMIN_HEADERS }
    );
    assert(updatePolicyRes.data.success === true, "Admin updated return policy successfully");
    assert(updatePolicyRes.data.config.returnWindowDays === 10, "Policy window successfully changed to 10 days");

    // Reset back to 7 days
    await axios.put(
      `${BASE_URL}/returns/admin/config`,
      { returnWindowDays: 7 },
      { headers: ADMIN_HEADERS }
    );
    console.log("Policy window reset to standard 7 days.");

    // 8. Customer Cancellation Flow Test
    console.log("\n--- TEST 8: Customer Cancellation Flow ---");
    // Create another return to test cancellation
    const return2Res = await axios.post(`${BASE_URL}/returns/request`, {
      orderId: "TZ-869409",
      items: [{ productId: eligRes.data.items[1]?.productId || testItem.productId, qty: 1 }],
      reason: "Other reason",
      reasonDetails: "Accidental purchase test",
      resolution: "Replacement"
    });
    const ret2 = return2Res.data.returnRequest;
    assert(ret2.status === "Requested", "Second test return created in 'Requested' status");

    const cancelRes = await axios.patch(`${BASE_URL}/returns/my-returns/${ret2.returnNumber}/cancel`);
    assert(cancelRes.data.success === true, "Customer cancelled return request successfully");
    assert(cancelRes.data.returnRequest.status === "Cancelled", "Return status transitioned to 'Cancelled'");

    console.log("\n==================================================");
    console.log(`ALL TESTS COMPLETED: ${passed} PASSED, ${failed} FAILED`);
    console.log("==================================================");

  } catch (err) {
    console.error("Test execution error:", err.response?.data || err.message);
  }
}

runTests();
