import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requireAppAccess } from "../middleware/appAccess.js";
import { donorMgmtService } from "../services/donorMgmtService.js";
import { createDonorSchema, updateDonorSchema, createDonationSchema } from "../validators/donorMgmt.js";

const router = Router();
router.use(authenticate, requireAppAccess("donor-mgmt"));

// Donors
router.get("/donors", async (req, res) => {
  const { type, search } = req.query;
  const donors = await donorMgmtService.listDonors({
    type: type as "INDIVIDUAL" | "CORPORATE" | undefined,
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

export default router;
