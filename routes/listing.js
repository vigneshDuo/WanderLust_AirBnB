const express = require("express");
const router = express.Router();
const Listing = require("../models/listing");
const wrapAsync = require("../utils/wrapAsync.js");
const expressError = require("../utils/expressError.js");
const { isLoggedIn, serverValidate } = require("../middleware/isLoggedIn.js");
const listingController = require("../controller/listingController.js");

router
  .route("/")
  .get(wrapAsync(listingController.index))
  .post(isLoggedIn, serverValidate, wrapAsync(listingController.createListing));

router.get("/show/:id", wrapAsync(listingController.renderListing));

router
  .route("/edit/:id")
  .get(isLoggedIn, wrapAsync(listingController.fetchListing))
  .put(isLoggedIn, wrapAsync(listingController.updateListing));

router.get("/new", isLoggedIn, listingController.renderNewForm);

router.delete(
  "/delete/:id",
  isLoggedIn,
  wrapAsync(listingController.deleteListing)
);

module.exports = router;
