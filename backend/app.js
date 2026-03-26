const path = require("path");

const express = require("express");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/auth");
const studentRoutes = require("./routes/students");
const { ensureDatabaseReady } = require("./utils/initDb");

const app = express();
const publicDirectory = path.resolve(__dirname, "../public");

app.use(async (req, res, next) => {
  try {
    await ensureDatabaseReady();
    next();
  } catch (error) {
    next(error);
  }
});

app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use(express.static(publicDirectory));

app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(publicDirectory, "index.html"));
});

app.use((err, req, res, next) => {
  console.error(err);

  if (res.headersSent) {
    return next(err);
  }

  return res.status(500).json({
    message: "Something went wrong on the server."
  });
});

module.exports = app;
