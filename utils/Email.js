const nodemailer = require("nodemailer");
module.exports = class Email {
  constructor(user, url) {
      
      this.to = user.email;
      this.firstname = user.name.split(" ")[0];
      this.url = url;
      this.form = `Abdelrahman <${process.env.EMAIL_FORM_NODEMAILER}>`;
  }
  newTransport() {
    return nodemailer.createTransport({
      service: "gmail",
      host: process.env.GMAIL_HOST_NODEMAILER,
      port: process.env.GMAIL_PORT_NODEMAILER,
      secure: false, //! true for 465, false for other ports
      auth: {
        user: process.env.GMAIL_USERNAME_NODEMAILER,
        pass: process.env.GMAIL_PASSWORD_NODEMAILER,
      },
      tls: {
        rejectUnauthorized: false, // ✅ تجاهل فحص الشهادة
      },
    });
  }
  async send(html, subject) {
    const mailOptions = {
      from: this.form,
      to: this.to,
      subject: subject,
      html,
    };
    // 3) creatre a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }
  async sendPasswordReset(code) {
    const htmlMessage = `
      <div style="
        font-family: Arial, sans-serif;
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background-color: #f9f9f9;
        border-radius: 10px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      ">
        <div style="
          text-align: center;
          padding: 20px;
          background-color: #f44336;
          border-radius: 8px 8px 0 0;
        ">
          <h1 style="
            color: white;
            margin: 0;
            font-size: 24px;
          ">Password Reset Request</h1>
        </div>

        <div style="
          padding: 30px 20px;
          background-color: white;
          border-radius: 0 0 8px 8px;
        ">
          <h2 style="
            color: #333;
            margin-bottom: 20px;
            font-size: 20px;
          ">Hello ${this.firstname},</h2>

          <p style="
            color: #666;
            line-height: 1.6;
            margin-bottom: 20px;
          ">You requested to reset your password. Use the code below to verify your account. If you didn't request this, please ignore this email!</p>

          <div style="
            text-align: center;
            margin: 30px 0;
          ">
            <span style="
              display: inline-block;
              padding: 16px 40px;
              background-color: #f44336;
              color: white;
              font-size: 28px;
              letter-spacing: 4px;
              border-radius: 8px;
              font-weight: bold;
              box-shadow: 0 2px 5px rgba(0,0,0,0.08);
            ">${code}</span>
          </div>

          <p style="
            color: #666;
            font-size: 14px;
            margin-top: 30px;
            text-align: center;
          ">This code is valid for 10 minutes only.</p>
        </div>

        <div style="
          text-align: center;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          color: #999;
          font-size: 12px;
        ">
          <p>© 2024 LMS Platform. All rights reserved.</p>
        </div>
      </div>
    `;
    await this.send(
      htmlMessage,
      "Your password reset token (valid for 10 minutes)"
    );
  }


  async sendWelcome() {
    const htmlMessage = `
      <div style="
        font-family: Arial, sans-serif;
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background-color: #f9f9f9;
        border-radius: 10px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      ">
        <div style="
          text-align: center;
          padding: 20px;
          background-color: #f44336;
          border-radius: 8px 8px 0 0;
        ">
          <h1 style="
            color: white;
            margin: 0;
            font-size: 24px;
          ">Welcome to Our Platform!</h1>
        </div>

        <div style="
          padding: 30px 20px;
          background-color: white;
          border-radius: 0 0 8px 8px;
        ">
          <h2 style="
            color: #333;
            margin-bottom: 20px;
            font-size: 20px;
          ">Hello ${this.firstname},</h2>

          <p style="
            color: #666;
            line-height: 1.6;
            margin-bottom: 20px;
          ">Your account has been successfully created. We're excited to have you on board!</p>

          <div style="
            text-align: center;
            margin: 30px 0;
          ">
            <p  style="
              display: inline-block;
              padding: 12px 30px;
              background-color: #f44336;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              font-weight: bold;
              transition: background-color 0.3s;
            ">WELCOME TO LMS PLATFORM 🥳</p>
          </div>

          <p style="
            color: #666;
            font-size: 14px;
            margin-top: 30px;
            text-align: center;
          ">If you didn't create this account, please ignore this email.</p>
        </div>

        <div style="
          text-align: center;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          color: #999;
          font-size: 12px;
        ">
          <p>© 2024 LMS Platform. All rights reserved.</p>
        </div>
      </div>
    `;

    await this.send(htmlMessage, "Welcome to Our Platform!");
  }
};