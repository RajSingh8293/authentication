import express from "express";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import cors from "cors";
import "dotenv/config";
import dbConnect from "./dbConnect/dbConnect.js";
import userRouter from "./routes/user.routes.js";
const app = express();
const port = process.env.PORT || 3800;

const corsOptions = {
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ["GET", "POST", "PUT"],
};
// middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/api/users", userRouter);

dbConnect();
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
