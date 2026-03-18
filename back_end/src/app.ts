import express from "express";
import cookieParser from "cookie-parser";
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './configs/swagger.config';
import apiRoutes from "./app/routes/index";

const app = express();

// CORS — cho phép cookie gửi kèm (credentials: include)
const allowedOrigins = [
  'http://localhost',
  'http://localhost:5173',
  'http://localhost:80',
  'http://103.82.24.142',
];
app.use((req, res, next) => {
  const origin = req.headers.origin || '';
  if (allowedOrigins.includes(origin) || !origin) {
    res.header("Access-Control-Allow-Origin", origin || '*');
    res.header("Access-Control-Allow-Credentials", "true");
  }
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());

// Root Route to verify server is running from Browser
app.get("/", (req, res) => {
  res.send("🚀 Backend API (Modular Architecture) is running happily! Visit /api-docs for Swagger GUI.");
});

// Swagger UI Route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api", apiRoutes);

export default app;

