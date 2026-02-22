import express from "express";
import Empleado from "../models/Empleado.js";
import { authMiddleware } from "./auth.js";
import { hasRole, ROLES } from "../middlewares/authorization.js";

const router = express.Router();

router.get("/:obraId/empleados", authMiddleware, hasRole([ROLES.ADMIN, ROLES.OPERATOR, ROLES.VIEWER]), async (req, res) => {
  try {
    const empleados = await Empleado.findAll({
      where: { obra_id: req.params.obraId, activo: true },
      order: [["apellido", "ASC"], ["nombre", "ASC"]],
    });
    return res.json(empleados);
  } catch (e) {
    console.error("Error listando empleados:", e);
    return res.status(500).json({ error: "Error al listar empleados" });
  }
});

router.post("/:obraId/empleados", authMiddleware, hasRole([ROLES.ADMIN, ROLES.OPERATOR]), async (req, res) => {
  try {
    const { nombre, apellido, fechaNacimiento, dni, categoria, fechaIngreso } = req.body;
    const { obraId } = req.params;

    if (!nombre || !apellido || !dni || !categoria)
      return res.status(400).json({ message: "Nombre, apellido, DNI y categoría son obligatorios" });

    const categoriasPermitidas = ["ayudante", "medio oficial", "oficial", "oficial especializado", "capataz"];
    if (!categoriasPermitidas.includes(categoria))
      return res.status(400).json({ message: "Categoría no válida" });

    const empleado = await Empleado.create({
      obraId,
      nombre,
      apellido,
      fechaNacimiento: fechaNacimiento || null,
      dni,
      categoria,
      fechaIngreso: fechaIngreso || null,
    });
    return res.status(201).json(empleado);
  } catch (e) {
    console.error("Error creando empleado:", e);
    return res.status(500).json({ error: "Error al crear empleado" });
  }
});

router.put("/:obraId/empleados/:empleadoId", authMiddleware, hasRole([ROLES.ADMIN, ROLES.OPERATOR]), async (req, res) => {
  try {
    const { empleadoId } = req.params;
    const { nombre, apellido, fechaNacimiento, dni, categoria, fechaIngreso } = req.body;

    const empleado = await Empleado.findByPk(empleadoId);
    if (!empleado) return res.status(404).json({ message: "Empleado no encontrado" });

    await empleado.update({ nombre, apellido, fechaNacimiento, dni, categoria, fechaIngreso });
    return res.json(empleado);
  } catch (e) {
    console.error("Error actualizando empleado:", e);
    return res.status(500).json({ error: "Error al actualizar empleado" });
  }
});

router.delete("/:obraId/empleados/:empleadoId", authMiddleware, hasRole([ROLES.ADMIN]), async (req, res) => {
  try {
    const empleado = await Empleado.findByPk(req.params.empleadoId);
    if (!empleado) return res.status(404).json({ message: "Empleado no encontrado" });
    await empleado.update({ activo: false });
    return res.status(204).send();
  } catch (e) {
    return res.status(500).json({ error: "Error al dar de baja el empleado" });
  }
});

export default router;
