import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { requireAppAccess } from "../middleware/appAccess.js";
import { donorMgmtService } from "../services/donorMgmtService.js";
import { createDonorSchema, updateDonorSchema, createDonationSchema } from "../validators/donorMgmt.js";
import { bulkImportRequestSchema } from "../validators/bulkImport.js";
import { processBulkImport } from "../services/bulkImportService.js";
import { prisma } from "../lib/prisma.js";
import type { DonorType } from "@prisma/client";

const router = Router();
router.use(authenticate, requireAppAccess("donor-mgmt"));

// Donors
router.get("/donors", async (req, res) => {
  const { type, search } = req.query;
  const donors = await donorMgmtService.listDonors({
    type: type as DonorType | undefined,
    search: search as string | undefined,
  });
  res.json({ data: donors });
});

router.post("/donors", async (req, res) => {
  const body = createDonorSchema.parse(req.body);
  const donor = await donorMgmtService.createDonor(body, req.user!.id);
  res.status(201).json({ data: donor });
});

router.get("/donors/:id", async (req, res) => {
  const donor = await donorMgmtService.getDonor(req.params.id as string);
  if (!donor) return res.status(404).json({ error: "Donor not found" });
  res.json({ data: donor });
});

router.patch("/donors/:id", async (req, res) => {
  const body = updateDonorSchema.parse(req.body);
  const donor = await donorMgmtService.updateDonor(req.params.id as string, body);
  res.json({ data: donor });
});

router.delete("/donors/:id", requireAdmin, async (req, res) => {
  await donorMgmtService.deleteDonor(req.params.id as string);
  res.json({ data: { success: true } });
});

// Donations
router.get("/donations", async (_req, res) => {
  const donations = await donorMgmtService.listDonations();
  res.json({ data: donations });
});

router.post("/donations", async (req, res) => {
  const body = createDonationSchema.parse(req.body);
  const donation = await donorMgmtService.createDonation(body, req.user!.id);
  res.status(201).json({ data: donation });
});

router.delete("/donations/:id", requireAdmin, async (req, res) => {
  await donorMgmtService.deleteDonation(req.params.id as string);
  res.json({ data: { success: true } });
});

// Bulk import
router.post("/bulk-import", async (req, res) => {
  const { entity, rows } = bulkImportRequestSchema.parse(req.body);

  if (entity === "donor") {
    const result = await processBulkImport({
      rows,
      schema: createDonorSchema,
      createFn: (data, userId) => donorMgmtService.createDonor(data, userId),
      userId: req.user!.id,
    });
    return res.json({ data: result });
  }

  if (entity === "donation") {
    const result = await processBulkImport({
      rows,
      schema: createDonationSchema,
      createFn: (data, userId) => donorMgmtService.createDonation(data, userId),
      userId: req.user!.id,
      resolveFn: async (row) => {
        if (row.donorName && !row.donorId) {
          const donor = await prisma.donor.findFirst({
            where: { name: { equals: row.donorName as string, mode: "insensitive" } },
          });
          if (!donor) throw new Error(`Donor "${row.donorName}" not found`);
          return { ...row, donorId: donor.id, donorName: undefined };
        }
        return row;
      },
    });
    return res.json({ data: result });
  }

  res.status(400).json({ error: `Unknown entity: ${entity}. Supported: donor, donation` });
});

router.get("/import-template", (req, res) => {
  const entity = req.query.entity as string;
  const templates: Record<string, any> = {
    donor: {
      fields: [
        { key: "name", label: "Name", type: "string", required: true },
        { key: "email", label: "Email", type: "email", required: false },
        { key: "phone", label: "Phone", type: "string", required: false },
        { key: "type", label: "Type", type: "enum", required: true, enumValues: ["INDIVIDUAL", "CORPORATE"] },
        { key: "notes", label: "Notes", type: "string", required: false },
      ],
      example: { name: "Ratan Tata Foundation", email: "grants@tata.org", phone: "0221234567", type: "CORPORATE", notes: "Annual CSR partner" },
    },
    donation: {
      fields: [
        { key: "donorId", label: "Donor ID", type: "uuid", required: false, description: "Either donorId or donorName" },
        { key: "donorName", label: "Donor Name", type: "string", required: false, description: "Will resolve to donorId" },
        { key: "amount", label: "Amount", type: "number", required: true },
        { key: "date", label: "Date", type: "date", required: true, description: "YYYY-MM-DD format" },
        { key: "purpose", label: "Purpose", type: "string", required: false },
        { key: "receiptNo", label: "Receipt No.", type: "string", required: false },
      ],
      example: { donorName: "Ratan Tata Foundation", amount: 100000, date: "2025-03-01", purpose: "Annual CSR grant", receiptNo: "RCT-2025-001" },
    },
  };
  if (!entity || !templates[entity]) {
    return res.status(400).json({ error: `Unknown entity. Supported: ${Object.keys(templates).join(", ")}` });
  }
  res.json({ data: templates[entity] });
});

export default router;
