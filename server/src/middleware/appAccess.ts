import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";
import { Role } from "@prisma/client";

export function requireAppAccess(appSlug: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role === Role.ADMIN) return next();

    const app = await prisma.app.findUnique({ where: { slug: appSlug } });
    if (!app) return res.status(404).json({ error: "App not found" });

    const assignment = await prisma.userApp.findUnique({
      where: { userId_appId: { userId: req.user!.id, appId: app.id } },
    });

    if (!assignment) return res.status(403).json({ error: "App access required" });
    next();
  };
}
