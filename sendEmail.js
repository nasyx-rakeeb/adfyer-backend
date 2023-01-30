const {MailtrapClient} = require("mailtrap");
const dotenv = require('dotenv')

dotenv.config();

const sendEmail = (email, subject, body) => {
    const TOKEN = `${process.env.MAILTRAP_TOKEN}`
    const ENDPOINT = "https://send.api.mailtrap.io/";
    const client = new MailtrapClient({
        endpoint: ENDPOINT, token: TOKEN
    });
    const sender = {
        email: "mailtrap@codipher.com",
        name: "Adfyer",
    };
    const recipients = [{
        email: email,
    }];
    client
    .send({
        from: sender,
        to: recipients,
        subject: subject,
        text: body,
        category: "Integration Test",
    })
    .then(console.log, console.error);
}

module.exports = sendEmail