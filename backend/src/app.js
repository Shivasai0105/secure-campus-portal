const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const csurf = require("csurf");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");
const facultyRoutes = require("./routes/facultyRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

// Security Headers
app.use(helmet());

// CORS Configuration
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:8080",
      "http://127.0.0.1:5500",
      "http://localhost:3000",
      "http://192.168.137.132:3000",  // New Network IP
      "http://192.168.137.83:3000",   // Old Network IP (keeping just in case)
      "http://10.225.47.113:8080"
    ],
    credentials: true,
  })
);

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later."
});
app.use(limiter);

app.set("trust proxy", 1);

app.use(express.json({ limit: '1mb' })); // Limit JSON payload to 1MB
app.use(express.urlencoded({ extended: false, limit: '1mb' })); // Limit URL-encoded to 1MB
app.use(cookieParser());
app.use(hpp()); // Prevent HTTP Parameter Pollution

// Serve static files from uploads directory
const path = require("path");
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

/* ---------- SESSION ---------- */
app.use(
  session({
    name: "scpsid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",
      ttl: 60 * 60 * 4
    }),
    cookie: {
      httpOnly: true,
      sameSite: "lax", // 'lax' prevents CSRF for some methods, but csurf handles it fully
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 4
    }
  })
);

/* ---------- CSRF PROTECTION ---------- */
// Enable CSRF mechanism
// NOTE: Must be used AFTER session middleware
// Skip CSRF for public auth endpoints (registration, login)
app.use((req, res, next) => {
  const publicPaths = [
    '/api/auth/register-student',
    '/api/auth/register-faculty',
    '/api/auth/register-admin',
    '/api/auth/login'
  ];

  // Paths that use session-based auth (exempt from CSRF for now)
  const sessionAuthPaths = [
    '/api/auth/logout',
    '/api/auth/me',
    '/api/faculty',
    '/api/student',
    '/api/admin'
  ];

  // Check if path matches public paths or session auth paths
  if (publicPaths.includes(req.path)) {
    return next();
  }

  // Check if path starts with any session auth path
  if (sessionAuthPaths.some(path => req.path.startsWith(path))) {
    return next();
  }

  // Apply CSRF protection for all other routes
  csurf({
    value: (req) => {
      // Check multiple sources for CSRF token
      return req.headers['_csrf'] ||
        req.body._csrf ||
        req.query._csrf ||
        req.headers['csrf-token'] ||
        req.headers['xsrf-token'] ||
        req.headers['x-csrf-token'] ||
        req.headers['x-xsrf-token'];
    }
  })(req, res, next);
});

// CSRF Token Endpoint
app.get("/api/csrf-token", (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

/* ---------- ROUTES ---------- */
app.get("/", (req, res) => {
  res.send("Secure Campus Backend Running");
});

app.use("/api/auth", authRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/faculty", facultyRoutes);
app.use("/api/admin", adminRoutes);

/* ---------- ERRORS ---------- */
// CSRF Error Handler
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({ message: "Invalid or missing CSRF token" });
  }
  next(err);
});

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

module.exports = app;
