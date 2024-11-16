import sgMail from "@sendgrid/mail";

require("dotenv").config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const sendOtpEmail = (email: string, otp: number) => {
  const message = `<strong>Your ChessMates! OTP is: ${otp} for the email address: ${email}</strong>`;

  const msg = {
    to: email,
    from: "mohak.londhe@gmail.com",
    subject: `Your ChessMates! OTP is ${otp}`,
    html: message,
  };

  return new Promise((resolve, reject) => {
    sgMail
      .send(msg)
      .then(() => {
        resolve("Email sent");
      })
      .catch((error) => {
        reject(error);
        console.error("Error in sending email OTP: " + error);
      });
  });
};

export default sendOtpEmail;
