import express from "express";
import "express-async-errors";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { errorHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import appRoutes from "./routes/apps.js";
import meRoutes from "./routes/me.js";
import financeRoutes from "./routes/finance.js";
import crmRoutes from "./routes/crm.js";
import needsRegistryRoutes from "./routes/needsRegistry.js";
import taskBoardRoutes from "./routes/taskBoard.js";
import peopleDirectoryRoutes from "./routes/peopleDirectory.js";
import studentTrackerRoutes from "./routes/studentTracker.js";
import attendanceRoutes from "./routes/attendance.js";
import ideationRoutes from "./routes/ideation.js";
import contentCalendarRoutes from "./routes/contentCalendar.js";
import eventManagerRoutes from "./routes/eventManager.js";
import workshopTrackerRoutes from "./routes/workshopTracker.js";
import donorMgmtRoutes from "./routes/donorMgmt.js";
import departmentRoutes from "./routes/departments.js";
import seedRoutes from "./routes/seed.js";

export const app = express();

app.use(cors({
  origin: (origin, callback) => {
    const allowed = (process.env.CLIENT_URL || "http://localhost:5173").split(",");
    // Allow requests with no origin (curl, mobile), localhost, or configured origins
    if (!origin || origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1")) {
      callback(null, true);
    } else if (origin.endsWith(".koshishfamily.org") || origin.endsWith(".ngrok-free.app") || origin.endsWith(".ngrok.io") || origin.endsWith(".up.railway.app")) {
      callback(null, true);
    } else if (allowed.some(url => origin === url.trim())) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: "5mb" }));
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/apps", appRoutes);
app.use("/api/me", meRoutes);
app.use("/api/apps/finance", financeRoutes);
app.use("/api/apps/crm", crmRoutes);
app.use("/api/apps/needs-registry", needsRegistryRoutes);
app.use("/api/apps/task-board", taskBoardRoutes);
app.use("/api/apps/people-directory", peopleDirectoryRoutes);
app.use("/api/apps/student-tracker", studentTrackerRoutes);
app.use("/api/apps/attendance", attendanceRoutes);
app.use("/api/apps/ideation", ideationRoutes);
app.use("/api/apps/content-calendar", contentCalendarRoutes);
app.use("/api/apps/event-manager", eventManagerRoutes);
app.use("/api/apps/workshop-tracker", workshopTrackerRoutes);
app.use("/api/apps/donor-mgmt", donorMgmtRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/seed", seedRoutes);

// In production, serve the React client
if (process.env.NODE_ENV === "production") {
  const clientDist = path.join(__dirname, "../../client/dist");
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.use(errorHandler);
