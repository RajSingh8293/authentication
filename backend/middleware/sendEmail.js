import nodemailer from "nodemailer";
export const sendEmail = async (data) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      auth: {
        user: process.env.SMTP_MAIL,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: process.env.SMTP_MAIL,
      to: data.email,
      subject: data.subject,
      text: data.message,
      html: data.html || data.message,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.log("Email not sent : ", error);
  }
};
