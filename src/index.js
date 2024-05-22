import dotenv from "dotenv";
import app from "./app.js";
import connectDb from "./db/connect.js";

dotenv.config({
  path: "./env",
});

connectDb()
  .then(() => {
    app.listen(8000, () => console.log("Server running on 8000"));
  })
  .catch((err) => {
    console.log("DataBase Connection error...", err);
  });
