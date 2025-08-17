import multer from "multer";

// Allowed file types
const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];

// Multer storage (store in memory or temp folder)
const storage = multer.memoryStorage(); // keeps file in memory buffer

// File filter for validation
const fileFilter = (req, file, cb) => {
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(
      new Error("Only .jpeg, .jpg, .png, .webp formats are allowed!"),
      false
    );
  }
  cb(null, true);
};

// Max file size = 2MB (adjust as needed)
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter,
});

// Helper to handle single file uploads
export const uploadSingleImage = fieldName => upload.single(fieldName);

// Helper to handle multiple image uploads
export const uploadMultipleImages = (fieldName, maxCount = 5) =>
  upload.array(fieldName, maxCount);
