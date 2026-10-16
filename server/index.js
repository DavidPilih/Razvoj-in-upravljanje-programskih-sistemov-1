const { setServers } = require("node:dns");
setServers(["1.1.1.1", "8.8.8.8"]);

const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./db");
const authRouter = require("./routers/auth")

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api", (req, res) => {
  res.json({
    message: "backend is running",
  });
});

app.use("/api/auth", authRouter);


const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  });

