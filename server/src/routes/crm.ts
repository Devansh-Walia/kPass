import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requireAppAccess } from "../middleware/appAccess.js";
import { crmService } from "../services/crmService.js";
import { createContactSchema, updateContactSchema, createDealSchema, updateDealSchema, createActivitySchema } from "../validators/crm.js";

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

export default router;
