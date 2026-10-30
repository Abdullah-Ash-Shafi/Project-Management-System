import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

/* ---------- CORS ---------- */
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}));

/* ---------- Body Parsers ---------- */
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({
    extended: true,
    limit: "16kb"
}));

/* ---------- Static Files (VERY IMPORTANT for multer) ---------- */
app.use(express.static("public"));

/* ---------- Cookies ---------- */
app.use(cookieParser());

/* ---------- Routes ---------- */
import router from "./routes/user.routes.js";
app.use("/api/v1/users", router);

export default app;