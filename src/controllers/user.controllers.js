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
    return res.status(400).json({ code: 400, error: "Email is required." });
  }
  if (!email.includes("@") || !email.includes(".")) {
    return res.status(400).json({ code: 400, error: "Enter valid email." });
  }

  if (!name || !(name.length >= 3)) {
    return res.status(400).json({ code: 400, error: "Enter valid name." });
  }

  const existUser = await User.findOne({ email: email });

  if (existUser)
    return res.status(403).json({ code: 403, message: "User alwarady exist!" });

  const code = generateVerificationCode();
  const emailSend = await sendVarificationCodeOnMail({ code, email });
  if (!emailSend)
    return res
      .status(500)
      .json({ code: 500, message: "Server error while sending email!" });

  const user = await User.create({
    email: email,
    name: name,
    verificationCode: code,
  });

  const createdUser = await User.findById(user._id).select("-refreshToken");

  if (!createdUser)
    return res
      .status(500)
      .json({ code: 500, message: "Server error while creating the user!." });

  return res.status(200).json({ code: 200, message: "Cheak your mail box!" });
};

const createPasswordUser = async (req, res) => {
  const { email, code, password } = req.body;
  // console.log("Register", req.body);

  if (!email || !code) {
    return res.status(400).json({ code: 400, error: "Invalid User!" });
  }
  if (!password) {
    return res.status(400).json({ code: 400, error: "Password is required!" });
  }

  try {
    const user = await User.findOne({ email: email });
    if (!user)
      return res.status(400).json({ code: 400, error: "User not available!" });
    const dbDate = user.verificationCodeExpiresAt;
    const now = new Date();
    const diffMilliseconds = now - dbDate;
    const diffMinutes = diffMilliseconds / 1000 / 60;
    if (diffMinutes > 8) {
      return res.status(400).json({ code: 400, error: "Time expired!" });
    }
    if (user.verificationCode != code) {
      return res.status(400).json({ code: 400, error: "Invalid User!" });
    }

    user.emailVerify = true;
    user.password = password;
    await user.save();

    return res
      .status(200)
      .json({ code: 200, message: "Password createded successfully!" });
  } catch (error) {
    console.error("Error during verification process:", error);
    return res
      .status(500)
      .json({ code: 500, error: "An internal server error occurred." });
  }
};

const forgotPasswordUser = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ code: 400, error: "Email is required." });
  }

  const existUser = await User.findOne({ email: email });

  if (!existUser)
    return res.status(403).json({ code: 403, message: "User not exist!" });

  const code = generateVerificationCode();
  const emailSend = await sendVarificationCodeOnMail({ code, email });
  if (!emailSend)
    return res
      .status(500)
      .json({ code: 500, message: "Server error while sending email!" });

  existUser.verificationCode = code;
  await existUser.save();

  return res.status(200).json({ code: 200, message: "Cheak your mail box!" });
};

const loginUser = async (req, res) => {
  const { email, name, password } = req.body;
  // console.log("Register", req.body);

  if ((!email || !name) && !password)
    return res
      .status(400)
      .json({ code: 400, error: "Email or Name and password are required." });

  try {
    const user = await User.findOne({ $or: [{ email }, { name }] });

    if (!user)
      return res.status(403).json({ code: 403, message: "User not exist!" });

    const isPasswordVaild = await user.isPasswordCorrect(password);

    if (!isPasswordVaild)
      return res
        .status(403)
        .json({ code: 403, message: "Password is incorrect!" });

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
        code: 200,
        user: logInUser,
        accessToken,
        refreshToken,
        message: "User validate !",
      });
  } catch (error) {
    console.log("Error in login", error);
    return res
      .status(500)
      .json({ code: 500, message: "Server error while login!" });
  }
};

const logOutUser = async (req, res) => {
  console.log(req.user._id);
  try {
    const user = await User.findById(req.user._id);
    user.refreshToken = undefined;
    await user.save();

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json({ code: 200, message: "User logged Out successfully!" });
  } catch (error) {}
};

export {
  registerUser,
  loginUser,
  forgotPasswordUser,
  createPasswordUser,
  logOutUser,
};
