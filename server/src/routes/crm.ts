import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { requireAppAccess } from "../middleware/appAccess.js";
import { crmService } from "../services/crmService.js";
import { createContactSchema, updateContactSchema, createDealSchema, updateDealSchema, createActivitySchema } from "../validators/crm.js";
import { bulkImportRequestSchema } from "../validators/bulkImport.js";
import { processBulkImport } from "../services/bulkImportService.js";
import { prisma } from "../lib/prisma.js";

const router = Router();
router.use(authenticate, requireAppAccess("crm"));

// Contacts
router.get("/contacts", async (_req, res) => {
  const contacts = await crmService.listContacts();
  res.json({ data: contacts });
});

router.get("/contacts/:id", async (req, res) => {
  const contact = await crmService.getContact(req.params.id);
  if (!contact) return res.status(404).json({ error: "Contact not found" });
  res.json({ data: contact });
});

router.post("/contacts", async (req, res) => {
  const body = createContactSchema.parse(req.body);
  const contact = await crmService.createContact(body, req.user!.id);
  res.status(201).json({ data: contact });
});

router.patch("/contacts/:id", async (req, res) => {
  const body = updateContactSchema.parse(req.body);
  const contact = await crmService.updateContact(req.params.id, body);
  res.json({ data: contact });
});

router.delete("/contacts/:id", requireAdmin, async (req, res) => {
  await crmService.deleteContact(req.params.id as string);
  res.json({ data: { message: "Contact deleted" } });
});

// Deals
router.get("/deals", async (_req, res) => {
  const deals = await crmService.listDeals();
  res.json({ data: deals });
});

router.post("/deals", async (req, res) => {
  const body = createDealSchema.parse(req.body);
  const deal = await crmService.createDeal(body, req.user!.id);
  res.status(201).json({ data: deal });
});

router.patch("/deals/:id", async (req, res) => {
  const body = updateDealSchema.parse(req.body);
  const deal = await crmService.updateDeal(req.params.id, body);
  res.json({ data: deal });
});

router.delete("/deals/:id", requireAdmin, async (req, res) => {
  await crmService.deleteDeal(req.params.id as string);
  res.json({ data: { message: "Deal deleted" } });
});

// Activities
router.get("/activities", async (req, res) => {
  const activities = await crmService.listActivities(req.query.contactId as string | undefined);
  res.json({ data: activities });
});

router.post("/activities", async (req, res) => {
  const body = createActivitySchema.parse(req.body);
  const activity = await crmService.createActivity(body, req.user!.id);
  res.status(201).json({ data: activity });
});

router.delete("/activities/:id", requireAdmin, async (req, res) => {
  await crmService.deleteActivity(req.params.id as string);
  res.json({ data: { message: "Activity deleted" } });
});

// Bulk import
router.post("/bulk-import", async (req, res) => {
  const { entity, rows } = bulkImportRequestSchema.parse(req.body);

  if (entity === "contact") {
    const result = await processBulkImport({
      rows,
      schema: createContactSchema,
      createFn: (data, userId) => crmService.createContact(data, userId),
      userId: req.user!.id,
      resolveFn: async (row) => {
        // Parse tags from comma-separated string
        if (typeof row.tags === "string") {
          return { ...row, tags: (row.tags as string).split(",").map(t => t.trim()).filter(Boolean) };
        }
        return row;
      },
    });
    return res.json({ data: result });
  }

  if (entity === "deal") {
    const result = await processBulkImport({
      rows,
      schema: createDealSchema,
      createFn: (data, userId) => crmService.createDeal(data, userId),
      userId: req.user!.id,
      resolveFn: async (row) => {
        if (row.contactName && !row.contactId) {
          const contact = await prisma.contact.findFirst({
            where: { name: { equals: row.contactName as string, mode: "insensitive" } },
          });
          if (!contact) throw new Error(`Contact "${row.contactName}" not found`);
          return { ...row, contactId: contact.id, contactName: undefined };
        }
        return row;
      },
    });
    return res.json({ data: result });
  }

  if (entity === "activity") {
    const result = await processBulkImport({
      rows,
      schema: createActivitySchema,
      createFn: (data, userId) => crmService.createActivity(data, userId),
      userId: req.user!.id,
      resolveFn: async (row) => {
        if (row.contactName && !row.contactId) {
          const contact = await prisma.contact.findFirst({
            where: { name: { equals: row.contactName as string, mode: "insensitive" } },
          });
          if (!contact) throw new Error(`Contact "${row.contactName}" not found`);
          return { ...row, contactId: contact.id, contactName: undefined };
        }
        return row;
      },
    });
    return res.json({ data: result });
  }

  res.status(400).json({ error: `Unknown entity: ${entity}. Supported: contact, deal, activity` });
});

router.get("/import-template", (req, res) => {
  const entity = req.query.entity as string;
  const templates: Record<string, any> = {
    contact: {
      fields: [
        { key: "name", label: "Name", type: "string", required: true },
        { key: "email", label: "Email", type: "email", required: false },
        { key: "phone", label: "Phone", type: "string", required: false },
        { key: "company", label: "Company", type: "string", required: false },
        { key: "tags", label: "Tags", type: "string", required: false, description: "Comma-separated list" },
        { key: "notes", label: "Notes", type: "string", required: false },
      ],
      example: { name: "Rahul Sharma", email: "rahul@example.com", phone: "9876543210", company: "TechCorp", tags: "sponsor,corporate", notes: "Met at gala" },
    },
    deal: {
      fields: [
        { key: "title", label: "Title", type: "string", required: true },
        { key: "value", label: "Value", type: "number", required: true },
        { key: "stage", label: "Stage", type: "enum", required: false, enumValues: ["LEAD", "CONTACTED", "PROPOSAL", "CLOSED"], description: "Defaults to LEAD" },
        { key: "contactId", label: "Contact ID", type: "uuid", required: false, description: "Either contactId or contactName" },
        { key: "contactName", label: "Contact Name", type: "string", required: false, description: "Will resolve to contactId" },
      ],
      example: { title: "Annual Sponsorship", value: 50000, stage: "LEAD", contactName: "Rahul Sharma" },
    },
    activity: {
      fields: [
        { key: "contactId", label: "Contact ID", type: "uuid", required: false, description: "Either contactId or contactName" },
        { key: "contactName", label: "Contact Name", type: "string", required: false, description: "Will resolve to contactId" },
        { key: "type", label: "Type", type: "enum", required: true, enumValues: ["CALL", "EMAIL", "NOTE", "MEETING"] },
        { key: "content", label: "Content", type: "string", required: true },
      ],
      example: { contactName: "Rahul Sharma", type: "CALL", content: "Discussed sponsorship plans" },
    },
  };
  if (!entity || !templates[entity]) {
    return res.status(400).json({ error: `Unknown entity. Supported: ${Object.keys(templates).join(", ")}` });
  }
  res.json({ data: templates[entity] });
});

export default router;
