import { Resend } from "resend";

const resend = new Resend(import.meta.env.RESEND_API_KEY);

export async function sendConfirmationEmail(to: string, orderId: string) {
  const subject = `Your EtchNFT Order (#${orderId}) is Confirmed`;
  const html = `
    <h2>Thanks for your order!</h2>
    <p>We've received your etching request. Your certificate is in progress.</p>
    <p>You can view your cert here:</p>
    <a href="https://etchnft.com/cert/${orderId}">View Certificate</a>
    <br /><br />
    <p>– The EtchNFT Team</p>
  `;

  await resend.emails.send({
    from: "EtchNFT <orders@etchnft.com>",
    to,
    subject,
    html,
  });
}
