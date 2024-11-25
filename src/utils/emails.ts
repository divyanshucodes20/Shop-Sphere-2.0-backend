import { resend } from "../app.js";





export const sendProductDeletionEmail = async (email: string,productName:string) => {
    try {
     
      await resend.emails.send({
      from: "ShopSphere <no-reply@shopsphere.com>",
      to: email,
      subject: "ReusableProduct Deleted",
      html: `<p>
      we are sorry to inform you that your product <b>${productName}</b> has been deleted from our shop due to some reasons.
      Feel free to contact us for more information.Also you can upload your query again for different product. 
      </p>`,});
    } catch (error) {
      console.error(`Failed to send notification email to ${email}:`, error);
    }
      
}
export const sendProductDeletionEmailDueToShortage = async (email: string,productName:string) => {
    try {
     
      await resend.emails.send({
      from: "ShopSphere <no-reply@shopsphere.com>",
      to: email,
      subject: "ReusableProduct Deleted",
        html: `<p>
        we are sorry to inform you that your product <b>${productName}</b> has been deleted from our shop due to shortage of stock.
        You can upload your query again for same or different product considering the stock availability.
        </p>`,});
    } catch (error) {
        console.error(`Failed to send notification email to ${email}:`, error);
        }
}