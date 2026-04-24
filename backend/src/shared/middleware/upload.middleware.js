const multer = require("multer");
const { storage } = require("../../config/cloudinary");

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB Limit
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.startsWith("image/") || 
      file.mimetype === "application/pdf" ||
      file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type. Only Images, PDFs, and Docs are allowed."), false);
    }
  },
});

module.exports = upload;