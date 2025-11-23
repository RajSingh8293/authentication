import mongoose from "mongoose";

const dbConnect = async () => {
  try {
    const dbConnection = await mongoose.connect(process.env.MONGODB_URL);
    console.log(
      `\nDatabse connected !!  DB HOST : ${dbConnection.connection.host}`
    );
  } catch (error) {
    console.log("MONGODB connection FAILED", error);
    process.exit(1);
  }
};

export default dbConnect;
