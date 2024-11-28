import { resend } from "../app.js";

export const sendProductDeletionEmail = async (email: string, productName: string) => {
    try {
        await resend.emails.send({
            from: "ShopSphere <no-reply@divyanshucodings.live>",
            to: email,
            subject: "ReusableProduct Deleted",
            html: `<p>
            we are sorry to inform you that your product <b>${productName}</b> has been deleted from our shop due to some reasons.
            Feel free to contact us for more information. Also, you can upload your query again for a different product. Your product will be reverted back to you soon.
            </p>`,
        });
    } catch (error) {
        console.error(`Failed to send notification email to ${email}:`, error);
    }
}

export const sendProductDeletionEmailDueToShortage = async (email: string, productName: string) => {
    try {
        await resend.emails.send({
            from: "ShopSphere <no-reply@divyanshucodings.live>",
            to: email,
            subject: "ReusableProduct Deleted",
            html: `<p>
            we are sorry to inform you that your product <b>${productName}</b> has been deleted from our shop due to shortage of stock.
            You can upload your query again for the same or a different product considering the stock availability.
            </p>`,
        });
    } catch (error) {
        console.error(`Failed to send notification email to ${email}:`, error);
    }
}