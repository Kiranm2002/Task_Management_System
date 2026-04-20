const express = require("express");
const router = express.Router();
const aiController = require("../controllers/ai.controller");

router.post("/generate-desc", aiController.generateDescription);

router.post("/search-parse", aiController.searchParse);

router.post("/recommend", aiController.recommendUser);

module.exports = router;