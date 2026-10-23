const { setServers } = require("node:dns");
setServers(["1.1.1.1", "8.8.8.8"]);

const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./db");
const authRouter = require("./routers/auth")
const questionsRouter = require("./routers/questions")
const dailyRouter = require("./routers/daily")
const scoringRouter = require("./routers/scoring")
const session = require("express-session");
const { MongoStore } = require("connect-mongo");
const app = express();
const { createServer } = require('node:http');
const { attachMultiplayer } = require('./multiplayer/handlers');
const httpServer = createServer(app);
attachMultiplayer(httpServer);
cors({ origin: "http://localhost:5173", credentials: true })

app.use(cors());
app.use(express.json());

app.get("/api", (req, res) => {
  res.json({
    message: "backend is running",
  });
});

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 1000*60* 60*24*7,//7DNI
  },
}));


function logger(req,res,next){
  console.log(req.method, req.url, "user:", req.session?.student_id);
  next();
}
app.use(logger);
app.use("/api/auth", authRouter);
app.use("/api/questions", questionsRouter);
app.use("/api/daily", dailyRouter)
app.use("/api/scoring",scoringRouter)
const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  });

