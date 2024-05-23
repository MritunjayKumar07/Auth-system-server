import { Router } from "express";
import {
  registerUser,
  loginUser,
  forgotPasswordUser,
  createPasswordUser,
  logOutUser,
} from "../controllers/user.controllers.js";
import verifyUserJWT from "../middleware/auth.middleware.js";

const router = Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/forgot-password").post(forgotPasswordUser);
router.route("/create-password").post(createPasswordUser);
// router.route("/validate-access-token").get(verifyUserJWT, async (_, res) => {
//   return res.status(200).json({ message: "User validation successfully!" });
// });
router.route("/logout").post(verifyUserJWT, logOutUser);

export default router;
