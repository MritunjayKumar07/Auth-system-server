import mongoose from "mongoose";

const connectDb = async () => {
  try {
    await mongoose.connect(`${process.env.DB_URL}`);
    console.log("Database Connection successfully!");
  } catch (error) {
    console.log(`Database Connection ${error}`);
    process.exit(1);
  }
};

export default connectDb;
