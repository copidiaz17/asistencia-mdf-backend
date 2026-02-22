import express from "express";
import bcrypt from "bcryptjs";
import Usuario from "../models/Usuario.js";
import { authMiddleware } from "./auth.js";

const router = express.Router();

router.post("/", authMiddleware, async (req, res) => {
  if (req.user.id !== 1) {
    return res.status(403).json({ message: "Solo el superadministrador puede crear usuarios." });
  }

  const { nombre, email, password, rol } = req.body;
  if (!nombre || !email || !password)
    return res.status(400).json({ message: "Nombre, email y password son requeridos." });

  const rolesPermitidos = ["administrador", "usuario", "lector"];
  const rolFinal = rolesPermitidos.includes(rol) ? rol : "usuario";

  try {
    const hash = await bcrypt.hash(password, 10);
    const nuevo = await Usuario.create({ nombre, email, password: hash, rol: rolFinal });
    return res.status(201).json({ id: nuevo.id, nombre: nuevo.nombre, email: nuevo.email, rol: nuevo.rol });
  } catch (e) {
    if (e.name === "SequelizeUniqueConstraintError")
      return res.status(400).json({ message: "El email ya está registrado." });
    return res.status(500).json({ message: "Error al crear usuario." });
  }
});

export default router;
