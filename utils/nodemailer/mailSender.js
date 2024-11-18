import nodemailer from "nodemailer";

const mail_sender = async (email, title, body) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASS,
      },
    });

    let info = await transporter.sendMail({
      from: "cell sphere - shop",
      to: email,
      subject: title,
      html: body,
    });
    return info;
  } catch (error) {}
};

export default mail_sender;
