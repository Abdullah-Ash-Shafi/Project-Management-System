import test from "node:test";
import assert from "node:assert/strict";

// Set these before importing the User model because JWT methods
// read these environment variables when they are called.
process.env.ACCESS_TOKEN_SECRET = "test-access-secret-for-local-tests";
process.env.ACCESS_TOKEN_EXPIRY = "15m";
process.env.REFRESH_TOKEN_SECRET = "test-refresh-secret-for-local-tests";
process.env.REFRESH_TOKEN_EXPIRY = "7d";

// Import project modules
const { default: ApiError } = await import("../utils/ApiError.js");
const { default: ApiResponse } = await import("../utils/ApiResponse.js");
const { default: asyncHandler } = await import("../utils/asyncHandler.js");
const { User } = await import("../models/user.model.js");

// --------------------------------------------------
// TEST 1: ApiError
// --------------------------------------------------
test("ApiError stores the expected error information", () => {
  const error = new ApiError(400, "Invalid input", [
    "email is required",
  ]);

  assert.equal(error.statuscode, 400);
  assert.equal(error.message, "Invalid input");
  assert.equal(error.success, false);
  assert.equal(error.data, null);
  assert.deepEqual(error.errors, ["email is required"]);
  assert.ok(error instanceof Error);
});

// --------------------------------------------------
// TEST 2: ApiResponse success
// --------------------------------------------------
test("ApiResponse marks a successful response correctly", () => {
  const response = new ApiResponse(200, { id: "123" }, "OK");

  assert.equal(response.statuscode, 200);
  assert.deepEqual(response.data, { id: "123" });
  assert.equal(response.message, "OK");
  assert.equal(response.success, true);
});

// --------------------------------------------------
// TEST 3: ApiResponse failure
// --------------------------------------------------
test("ApiResponse marks an error response as unsuccessful", () => {
  const response = new ApiResponse(400, null, "Bad request");

  assert.equal(response.success, false);
});

// --------------------------------------------------
// TEST 4: asyncHandler forwards errors to next()
// --------------------------------------------------
test("asyncHandler forwards a rejected handler error to next()", async () => {
  const expectedError = new Error("Test failure");
  let forwardedError;

  const handler = asyncHandler(async () => {
    throw expectedError;
  });

  const req = {};
  const res = {};
  const next = (error) => {
    forwardedError = error;
  };

  handler(req, res, next);

  // Allow the Promise rejection callback to run.
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(forwardedError, expectedError);
});

// --------------------------------------------------
// TEST 5: User model required fields
// --------------------------------------------------
test("User model requires core registration fields", () => {
  const user = new User({});

  const error = user.validateSync();

  assert.ok(error, "Expected validation to fail for an empty user");

  assert.ok(error.errors.username);
  assert.ok(error.errors.email);
  assert.ok(error.errors.fullName);
  assert.ok(error.errors.avatar);
  assert.ok(error.errors.password);
});

// --------------------------------------------------
// TEST 6: Username and email normalization
// --------------------------------------------------
test("User model normalizes username and email", () => {
  const user = new User({
    username: "  Shafi  ",
    email: "  SHAFI@EXAMPLE.COM  ",
    fullName: "Shafi",
    avatar: "https://example.com/avatar.png",
    password: "example-password",
  });

  assert.equal(user.username, "shafi");
  assert.equal(user.email, "shafi@example.com");
});

// --------------------------------------------------
// TEST 7: Access token generation
// --------------------------------------------------
test("User model generates a verifiable access token", async () => {
  const user = new User({
    _id: "507f1f77bcf86cd799439011",
    username: "shafi",
    email: "shafi@example.com",
    fullName: "Shafi",
    avatar: "https://example.com/avatar.png",
    password: "example-password",
  });

  const token = user.generateAccessToken();

  const jwt = await import("jsonwebtoken");
  const decoded = jwt.default.verify(
    token,
    process.env.ACCESS_TOKEN_SECRET
  );

  assert.equal(decoded._id, "507f1f77bcf86cd799439011");
  assert.equal(decoded.username, "shafi");
  assert.equal(decoded.email, "shafi@example.com");
});

// --------------------------------------------------
// TEST 8: Refresh token generation
// --------------------------------------------------
test("User model generates a verifiable refresh token", async () => {
  const user = new User({
    _id: "507f1f77bcf86cd799439012",
    username: "shafi",
    email: "shafi@example.com",
    fullName: "Shafi",
    avatar: "https://example.com/avatar.png",
    password: "example-password",
  });

  const token = user.generateRefreshToken();

  const jwt = await import("jsonwebtoken");
  const decoded = jwt.default.verify(
    token,
    process.env.REFRESH_TOKEN_SECRET
  );

  assert.equal(decoded._id, "507f1f77bcf86cd799439012");
});
