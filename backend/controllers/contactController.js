import Contact from "../models/ContactModel.js";
import { sendEmail } from "../utils/mailer.js";

export const createContact = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !phone || !message) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const newContact = await Contact.create({
      name,
      email,
      phone,
      message,
    });

    try {
      const adminEmail = process.env.ADMIN_EMAIL;
      if (adminEmail) {
        await sendEmail({
          to: adminEmail,
          subject: `New Contact Submission from ${name}`,
          html: `
            <h3>New Contact Message</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone}</p>
            <p><strong>Message:</strong></p>
            <p>${message}</p>
          `,
        });
      }
    } catch (mailErr) {
      console.log("Contact email failed:", mailErr.message);
    }

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      contact: newContact,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const listContacts = async (req, res) => {
  try {
    const contacts = await Contact.find({}).sort({ createdAt: -1 }).limit(200);
    res.json({ success: true, contacts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateContact = async (req, res) => {
  try {
    const { isRead, adminNote } = req.body;
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      {
        ...(typeof isRead === "boolean" ? { isRead } : {}),
        ...(adminNote !== undefined ? { adminNote } : {}),
      },
      { new: true }
    );
    if (!contact) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }
    res.json({ success: true, contact });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }
    res.json({ success: true, message: "Deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
