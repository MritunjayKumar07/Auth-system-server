import { User } from "../models/user.models.js";
import jwt from "jsonwebtoken";

const verifyUserJWT = async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer", "");

    if (!token)
      return res.status(401).json({ message: "Unautorized request!" });

    const decodeToken = jwt.verify(token, process.env.SECRET_ACCESS_TOKEN);

    const user = await User.findById(decodeToken._id).select(
      "-password -refreshToken -verificationCodeExpiresAt -verificationCode"
    );

    if (!user) {
      return res.status(401).json({ message: "Unautorized request!" });
    }
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(404, error?.message || "Invalid access token !");
  }
};

export default verifyUserJWT;
