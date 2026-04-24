const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "task-manager-attachments",
    resource_type: "auto", 
    allowed_formats: ["jpg", "png", "jpeg", "pdf", "docx"],
  },
});

module.exports = { cloudinary, storage };