import express from "express";
import "express-async-errors";
import cookieParser from "cookie-parser";
import cors from "cors";
import { errorHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import appRoutes from "./routes/apps.js";
import meRoutes from "./routes/me.js";
import financeRoutes from "./routes/finance.js";
import crmRoutes from "./routes/crm.js";

export const app = express();

app.use(cors({
  origin: (origin, callback) => {
    const allowed = process.env.CLIENT_URL || "http://localhost:5173";
    // Allow requests with no origin (curl, mobile) or matching origin pattern
    if (!origin || origin.startsWith("http://localhost:")) {
      callback(null, true);
    } else if (origin === allowed) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/apps", appRoutes);
app.use("/api/me", meRoutes);
app.use("/api/apps/finance", financeRoutes);
app.use("/api/apps/crm", crmRoutes);

app.use(errorHandler);
