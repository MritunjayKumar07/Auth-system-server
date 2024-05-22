import { User } from "../models/user.models.js";
import { sendVarificationCodeOnMail } from "../utils/sendMail.js";

//Generate varification code
const generateVerificationCode = () => {
  const min = 100000;
  const max = 999999;
  return Math.floor(Math.random() * (max - min + 1) + min);
};

const registerUser = async (req, res) => {
  const { email, name } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }
  if (!email.includes("@") || !email.includes(".")) {
    return res.status(400).json({ error: "Enter valid email." });
  }

  if (!name || !(name.length >= 3)) {
    return res.status(400).json({ error: "Enter valid name." });
  }

  const existUser = await User.findOne({ email: email });

  if (existUser)
    return res.status(403).json({ message: "User alwarady exist!" });

  const code = generateVerificationCode();
  const emailSend = await sendVarificationCodeOnMail({ code, email });
  if (!emailSend)
    return res
      .status(500)
      .json({ message: "Server error while sending email!" });

  const user = await User.create({
    email: email,
    name: name,
    verificationCode: code,
  });

  const createdUser = await User.findById(user._id).select("-refreshToken");

  if (!createdUser)
    return res
      .status(500)
      .json({ message: "Server error while creating the user!." });

  return res.status(200).json({ message: "Cheak your mail box!" });
};

const createPasswordUser = async (req, res) => {
  const { email, code, password } = req.body;
  // console.log("Register", req.body);

  if (!email || !code) {
    return res.status(400).json({ error: "Invalid User!" });
  }
  if (!password) {
    return res.status(400).json({ error: "Password is required!" });
  }

  try {
    const user = await User.findOne({ email: email });
    if (!user) return res.status(400).json({ error: "User not available!" });
    const date = new Date(user.verificationCodeExpiresAt);
    const now = new Date();
    const diffMilliseconds = now - date;
    const diffMinutes = diffMilliseconds / 1000 / 60; // Convert milliseconds to minutes
    if (diffMinutes > 8) {
      return res.status(400).json({ error: "Time expired!" });
    }
    if (user.verificationCode != code) {
      return res.status(400).json({ error: "Invalid User!" });
    }
    user.emailVerify = true;
    user.password = password;
    await user.save();

    return res
      .status(200)
      .json({ message: "Password createded successfully!" });
  } catch (error) {
    console.error("Error during verification process:", error);
    return res
      .status(500)
      .json({ error: "An internal server error occurred." });
  }
};

const forgotPasswordUser = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }

  const existUser = await User.findOne({ email: email });

  if (!existUser) return res.status(403).json({ message: "User not exist!" });

  const code = generateVerificationCode();
  const emailSend = await sendVarificationCodeOnMail({ code, email });
  if (!emailSend)
    return res
      .status(500)
      .json({ message: "Server error while sending email!" });

  existUser.verificationCode = code;
  await existUser.save();

  return res.status(200).json({ message: "Cheak your mail box!" });
};

const loginUser = async (req, res) => {
  const { email, name, password } = req.body;
  // console.log("Register", req.body);

  if ((!email || !name) && !password)
    return res
      .status(400)
      .json({ error: "Email or Name and password are required." });

  try {
    const user = await User.findOne({ $or: [{ email }, { name }] });

    if (!user) return res.status(403).json({ message: "User not exist!" });

    const isPasswordVaild = await user.isPasswordCorrect(password);

    if (!isPasswordVaild)
      return res.status(403).json({ message: "Password is incorrect!" });

    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    const logInUser = await User.findById(user._id).select(
      "-password -refreshToken -verificationCodeExpiresAt -verificationCode"
    );

    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
    };
    res
      .status(200)
      .cookie("refreshToken", refreshToken, cookieOptions)
      .cookie("accessToken", accessToken, cookieOptions)
      .json({
        user: logInUser,
        accessToken,
        refreshToken,
        message: "User validate !",
      });
  } catch (error) {
    console.log("Error in login", error);
    return res.status(500).json({ message: "Server error while login!" });
  }
};

const logOutUser = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $set: { refreshToken: undefined },
    });

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json({ message: "User logged Out successfully!" });
  } catch (error) {}
};

export {
  registerUser,
  loginUser,
  forgotPasswordUser,
  createPasswordUser,
  logOutUser,
};
