import nodemailer from "nodemailer";
import dns from "dns";

const isNetworkAvailable = async () => {
  return new Promise((resolve) => {
    dns.lookup("smtp.gmail.com", (err) => {
      if (err) {
        console.error("DNS lookup failed:", err);
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
};

const transporter = nodemailer.createTransport({
  host: `smtp.gmail.com`,
  service: "gmail",
  port: 465,
  secure: true,
  auth: {
    user: process.env.SEND_MAIL_NAME,
    pass: process.env.SEND_MAIL_PASSWORD,
  },
});

const sendVarificationCodeOnMail = async ({ code, email }) => {
  try {
    if (!(await isNetworkAvailable())) {
      throw new Error("Network is not available");
    }
    const mailOptions = {
      from: process.env.SEND_MAIL_NAME,
      to: email,
      subject: "Confirm your SignUp with Link!",
      html: `<div style="background-color: #080B0E; padding: 20px; border-radius: 15px; font-family: 'Poppins', sans-serif; height: '250px';">
      ${process.env.SEND_MAIL_URL}/${email}/${code}
      </div>`,
    };
    await transporter.sendMail(mailOptions);
    console.log("Verification email sent successfully to:", email);
    return true;
  } catch (error) {
    console.error(
      `Error sending verification code to: ${email} - ${error.message}`
    );
    return false;
  }
};

export { sendVarificationCodeOnMail };
