import express from "express";
import Obra from "../models/Obra.js";
import { authMiddleware } from "./auth.js";
import { hasRole, ROLES } from "../middlewares/authorization.js";

const router = express.Router();

router.get("/", authMiddleware, hasRole([ROLES.ADMIN, ROLES.OPERATOR, ROLES.VIEWER]), async (req, res) => {
  try {
    const obras = await Obra.findAll({ order: [["nombre", "ASC"]] });
    return res.json(obras);
  } catch (e) {
    return res.status(500).json({ error: "Error al listar obras" });
  }
});

router.post("/", authMiddleware, hasRole([ROLES.ADMIN, ROLES.OPERATOR]), async (req, res) => {
  try {
    const { nombre, ubicacion } = req.body;
    if (!nombre) return res.status(400).json({ message: "El nombre es obligatorio" });
    const obra = await Obra.create({ nombre, ubicacion: ubicacion || null });
    return res.status(201).json(obra);
  } catch (e) {
    return res.status(500).json({ error: "Error al crear obra" });
  }
});

router.get("/:obraId", authMiddleware, hasRole([ROLES.ADMIN, ROLES.OPERATOR, ROLES.VIEWER]), async (req, res) => {
  try {
    const obra = await Obra.findByPk(req.params.obraId);
    if (!obra) return res.status(404).json({ message: "Obra no encontrada" });
    return res.json(obra);
  } catch (e) {
    return res.status(500).json({ error: "Error al obtener obra" });
  }
});

export default router;
