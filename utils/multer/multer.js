import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ensureDirectoryExists = (directory) => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "..", "..", "public", "brands");
    ensureDirectoryExists(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const sanitizedOriginalName = file.originalname.replace(
      /[^a-zA-Z0-9.]/g,
      "_"
    );
    cb(null, `${file.fieldname}_${Date.now()}_${sanitizedOriginalName}`);
  },
});

export const upload = multer({ storage: storage }).single("logo");

// ---------------------------------------------------------------------------------

const product_storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "..", "..", "public", "products");
    ensureDirectoryExists(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const sanitizedOriginalName = file.originalname.replace(
      /[^a-zA-Z0-9.]/g,
      "_"
    );
    cb(null, `${file.fieldname}_${Date.now()}_${sanitizedOriginalName}`);
  },
});

export const upload_prodcuct = multer({
  storage: product_storage,
}).any();
