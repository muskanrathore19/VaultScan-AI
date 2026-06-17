import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { errorHandler } from "./middleware/errorMiddleware.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import scanRoutes from "./routes/scanRoute.js";
import dsahboaredRoutes from "./routes/dashboardRoute.js";
import cleanRecordRoutes from "./routes/cleanRecordRoutes.js";
import getFindingsRepoRoute from "./routes/getFindingsRepoRoute.js"; 
import getLastScanResults from "./routes/getLastScanReportRoute.js";

dotenv.config();
connectDB();

const app = express();

app.use(express.json());
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

app.use(cookieParser());
// ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/dashboard", dsahboaredRoutes);
app.use("/api", scanRoutes);
app.use("/api/clean-records", cleanRecordRoutes);
app.use("/api/findings", getFindingsRepoRoute);
app.use("/api/", getLastScanResults)
app.use("/admin", adminRoutes);

// HOME ROUTE
app.get("/", (req, res) => {
  res.send("API Running...");
});

// ERROR HANDLER
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on ${PORT}`));