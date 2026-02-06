require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");
const User = require("./models/User");
const bcrypt = require("bcryptjs");

const PORT = process.env.PORT || 5000;

const validateEnv = () => {
  if (!process.env.MONGO_URI) {
    console.error("Missing MONGO_URI in environment");
    process.exit(1);
  }
  if (!process.env.SESSION_SECRET) {
    console.error("Missing SESSION_SECRET in environment");
    process.exit(1);
  }
};

const seedAdminIfNeeded = async () => {
  const { SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, SEED_ADMIN_NAME } = process.env;
  if (!SEED_ADMIN_EMAIL || !SEED_ADMIN_PASSWORD) {
    return;
  }

  const existingAdmin = await User.findOne({ role: "admin" });
  if (existingAdmin) {
    return;
  }

  const passwordHash = await bcrypt.hash(SEED_ADMIN_PASSWORD, 12);
  await User.create({
    name: SEED_ADMIN_NAME || "System Admin",
    email: SEED_ADMIN_EMAIL.toLowerCase(),
    password: passwordHash,
    role: "admin"
  });

  console.log("Seeded initial admin user");
};

const startServer = async () => {
  validateEnv();
  await connectDB();
  await seedAdminIfNeeded();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
