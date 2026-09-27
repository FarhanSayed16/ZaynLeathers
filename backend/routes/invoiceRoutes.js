import express from "express";
import adminAuth from "../middleware/adminAuth.js";
import authUser from "../middleware/auth.js";
import { requireFeature } from "../middleware/requireFeature.js";
import {
  bulkIssueInvoices,
  bulkPreviewInvoices,
  exportAccountingCsv,
  getAdminInvoicePdf,
  getCustomerInvoicePdf,
  getCustomerCreditNotePdf,
  getInvoiceConfig,
  getInvoiceShareMeta,
  issueCreditNote,
  issueInvoice,
  updateInvoiceConfig,
} from "../controllers/invoiceController.js";

const router = express.Router();

router.use(requireFeature("invoicing"));

router.get("/config", adminAuth, getInvoiceConfig);
router.put("/config", adminAuth, updateInvoiceConfig);

router.post("/issue/:orderId", adminAuth, issueInvoice);
router.get("/admin/:orderId/pdf", adminAuth, getAdminInvoicePdf);
router.get("/my/:orderId/pdf", authUser, getCustomerInvoicePdf);
router.get("/my/:orderId/credit-note/:cnNumber/pdf", authUser, getCustomerCreditNotePdf);

router.post("/credit-note/:orderId", adminAuth, issueCreditNote);
router.get("/bulk/preview", adminAuth, bulkPreviewInvoices);
router.post("/bulk/issue", adminAuth, bulkIssueInvoices);
router.get("/export/accounting", adminAuth, exportAccountingCsv);
router.get("/share/:orderId", adminAuth, getInvoiceShareMeta);

export default router;
