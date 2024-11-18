import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/connectDB.js";
import user_router from "./routes/user_route.js";
import admin_router from "./routes/admin_route.js";
import { google_authentication } from "./controllers/google_controller.js";
import path from "path";

const app = express();

connectDB();

app.use(
  cors({
    origin: process.env.CORS_ALLOWED_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.use(express.static(path.join("public")));

app.use("/api/users", user_router);
app.use("/api/admin", admin_router);

app.post("/google-auth", google_authentication);

app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  if (err.status && err.status < 500) {
    res.status(err.status).send(err.message);
  } else {
    res.status(500).send("Internal Server Error");
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server is running on http://localhost:${PORT}`)
);
