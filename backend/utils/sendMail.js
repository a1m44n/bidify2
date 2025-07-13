const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
    if (!options.email) {
        throw new Error("No recipient defined");
    }

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        auth: {
          user: process.env.SMTP_EMAIL,
          pass: process.env.SMTP_PASS,
        },
      });

      const message = {
        from: `${process.env.SMTP_FROM_NAME} < ${process.env.SMTP_FROM_EMAIL}`,
        to: options.email,
        subject: options.subject,
        html: options.message
      };

      await transporter.sendMail(message);
};

module.exports = sendEmail;



// const nodemailer = require("nodemailer");

// const sendEmail = async (options) => {
//     if (!options.email) {
//         throw new Error("No recipient defined");
//     }

//     // Create transporter
//     const transporter = nodemailer.createTransport({
//         host: process.env.SMTP_HOST,
//         port: process.env.SMTP_PORT,
//         auth: {
//             user: process.env.SMTP_EMAIL,
//             pass: process.env.SMTP_PASS
//         }
//     });

//     // Define email options
//     const mailOptions = {
//         from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM_EMAIL}>`,
//         to: options.email,
//         subject: options.subject,
//         text: options.message,
//         html: options.html
//     };

//     // Send email
//     const info = await transporter.sendMail(mailOptions);
//     return info;
// };

// module.exports = sendEmail;