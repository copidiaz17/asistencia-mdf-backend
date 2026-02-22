import express from "express";
import { Op } from "sequelize";
import Asistencia from "../models/Asistencia.js";
import Empleado from "../models/Empleado.js";
import { authMiddleware } from "./auth.js";
import { hasRole, ROLES } from "../middlewares/authorization.js";

const router = express.Router();

function calcularMinutos(ingreso, salida) {
  if (!ingreso || !salida) return 0;
  const [hi, mi] = ingreso.split(":").map(Number);
  const [hs, ms] = salida.split(":").map(Number);
  const diff = (hs * 60 + ms) - (hi * 60 + mi);
  return diff > 0 ? diff : 0;
}

function formatearHoras(minutos) {
  if (minutos <= 0) return "-";
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return m > 0 ? h + "h " + m + "m" : h + "h";
}

router.get("/:obraId/asistencia/reporte", authMiddleware, hasRole([ROLES.ADMIN, ROLES.OPERATOR, ROLES.VIEWER]), async (req, res) => {
  try {
    const { obraId } = req.params;
    const { desde, hasta } = req.query;
    if (!desde || !hasta)
      return res.status(400).json({ message: "Los parámetros desde y hasta son requeridos." });
    const empleados = await Empleado.findAll({
      where: { obra_id: obraId, activo: true },
      order: [["apellido", "ASC"], ["nombre", "ASC"]],
      raw: true,
    });
    if (!empleados.length) return res.json([]);
    const empleadoIds = empleados.map((e) => e.id);
    const registros = await Asistencia.findAll({
      where: { obraId, empleadoId: empleadoIds, fecha: { [Op.between]: [desde, hasta] } },
      raw: true,
    });
    const result = empleados.map((emp) => {
      const regs = registros.filter((r) => (r.empleadoId ?? r.empleado_id) === emp.id);
      const diasPresente = regs.filter((r) => r.presente).length;
      const diasAusente  = regs.filter((r) => !r.presente).length;
      let totalMinutos = 0;
      regs.forEach((r) => {
        if (r.presente) {
          const ingreso = r.horarioIngreso ?? r.horario_ingreso;
          const salida  = r.horarioSalida  ?? r.horario_salida;
          totalMinutos += calcularMinutos(ingreso, salida);
        }
      });
      return {
        id: emp.id, nombre: emp.nombre, apellido: emp.apellido, dni: emp.dni, categoria: emp.categoria,
        diasPresente, diasAusente, totalRegistros: regs.length,
        horasTrabajadas: formatearHoras(totalMinutos), totalMinutos,
      };
    });
    return res.json(result);
  } catch (e) {
    console.error("Error generando reporte:", e);
    return res.status(500).json({ error: "Error al generar reporte" });
  }
});

router.get("/:obraId/asistencia/historial", authMiddleware, hasRole([ROLES.ADMIN, ROLES.OPERATOR, ROLES.VIEWER]), async (req, res) => {
  try {
    const { obraId } = req.params;
    const registros = await Asistencia.findAll({
      where: { obra_id: obraId },
      attributes: ["fecha", "presente"],
      raw: true,
      order: [["fecha", "DESC"]],
    });
    const fechaMap = {};
    registros.forEach((r) => {
      if (!fechaMap[r.fecha]) fechaMap[r.fecha] = { fecha: r.fecha, presentes: 0, total: 0 };
      fechaMap[r.fecha].total++;
      if (r.presente) fechaMap[r.fecha].presentes++;
    });
    return res.json(Object.values(fechaMap).sort((a, b) => b.fecha.localeCompare(a.fecha)));
  } catch (e) {
    return res.status(500).json({ error: "Error al obtener historial" });
  }
});

router.get("/:obraId/asistencia", authMiddleware, hasRole([ROLES.ADMIN, ROLES.OPERATOR, ROLES.VIEWER]), async (req, res) => {
  try {
    const { obraId } = req.params;
    const fecha = req.query.fecha || new Date().toISOString().split("T")[0];
    const empleados = await Empleado.findAll({
      where: { obra_id: obraId, activo: true },
      order: [["apellido", "ASC"], ["nombre", "ASC"]],
      raw: true,
    });
    if (!empleados.length) return res.json([]);
    const empleadoIds = empleados.map((e) => e.id);
    const registros = await Asistencia.findAll({
      where: { obraId, empleadoId: empleadoIds, fecha },
      raw: true,
    });
    const asistenciaMap = {};
    registros.forEach((r) => {
      const empId = r.empleadoId ?? r.empleado_id;
      asistenciaMap[empId] = {
        presente: Boolean(r.presente),
        horarioIngreso: r.horarioIngreso ?? r.horario_ingreso ?? null,
        horarioSalida: r.horarioSalida ?? r.horario_salida ?? null,
        observacion: r.observacion || "",
      };
    });
    const result = empleados.map((e) => {
      const reg = asistenciaMap[e.id];
      return {
        id: e.id, nombre: e.nombre, apellido: e.apellido, dni: e.dni, categoria: e.categoria,
        presente: reg ? Boolean(reg.presente) : false,
        horarioIngreso: reg ? reg.horarioIngreso : null,
        horarioSalida: reg ? reg.horarioSalida : null,
        observacion: reg ? reg.observacion : "",
      };
    });
    return res.json(result);
  } catch (e) {
    console.error("Error obteniendo asistencia:", e);
    return res.status(500).json({ error: "Error al obtener asistencia" });
  }
});

router.post("/:obraId/asistencia", authMiddleware, hasRole([ROLES.ADMIN, ROLES.OPERATOR]), async (req, res) => {
  try {
    const { obraId } = req.params;
    const { fecha, registros } = req.body;
    if (!fecha || !Array.isArray(registros) || !registros.length)
      return res.status(400).json({ message: "Fecha y registros son requeridos" });
    for (const r of registros) {
      if (r.presente && !r.horarioIngreso) {
        return res.status(400).json({ message: "Los empleados presentes deben tener horario de ingreso." });
      }
    }
    for (const r of registros) {
      const existente = await Asistencia.findOne({ where: { obraId, empleadoId: r.empleadoId, fecha } });
      const horarioIngresoFinal = r.presente && r.horarioIngreso ? r.horarioIngreso : existente?.horarioIngreso || null;
      await Asistencia.upsert({
        obraId, empleadoId: r.empleadoId, fecha,
        presente: r.presente ? true : false,
        horarioIngreso: horarioIngresoFinal,
        horarioSalida: r.presente && r.horarioSalida ? r.horarioSalida : null,
        observacion: r.observacion || null,
      });
    }
    return res.json({ ok: true, message: "Asistencia registrada correctamente", fecha });
  } catch (e) {
    console.error("Error registrando asistencia:", e);
    return res.status(500).json({ error: "Error al registrar asistencia" });
  }
});

export default router;
