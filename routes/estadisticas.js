import express from "express";
import { sequelize } from "../database.js";
import Asistencia from "../models/Asistencia.js";
import Empleado from "../models/Empleado.js";
import Obra from "../models/Obra.js";
import { authMiddleware } from "./auth.js";

const router = express.Router();

router.get("/empleado/:empleadoId", authMiddleware, async (req, res) => {
  try {
    const { empleadoId } = req.params;
    const { periodo, year, month, quincena } = req.query;

    if (!periodo || !year || !month) {
      return res.status(400).json({ ok: false, error: "Se requieren los parámetros: periodo, year, month" });
    }

    if (periodo === "quincena" && !quincena) {
      return res.status(400).json({ ok: false, error: "Para período 'quincena' se requiere el parámetro quincena (1 o 2)" });
    }

    const empleado = await Empleado.findByPk(empleadoId, {
      include: [{ model: Obra, as: "obra" }]
    });

    if (!empleado) {
      return res.status(404).json({ ok: false, error: "Empleado no encontrado" });
    }

    let fechaInicio, fechaFin;
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);

    if (periodo === "mes") {
      fechaInicio = new Date(yearNum, monthNum - 1, 1);
      fechaFin = new Date(yearNum, monthNum, 0);
    } else if (periodo === "quincena") {
      const quincenaNum = parseInt(quincena);
      if (quincenaNum === 1) {
        fechaInicio = new Date(yearNum, monthNum - 1, 1);
        fechaFin = new Date(yearNum, monthNum - 1, 15);
      } else if (quincenaNum === 2) {
        fechaInicio = new Date(yearNum, monthNum - 1, 16);
        fechaFin = new Date(yearNum, monthNum, 0);
      } else {
        return res.status(400).json({ ok: false, error: "quincena debe ser 1 o 2" });
      }
    } else {
      return res.status(400).json({ ok: false, error: "periodo debe ser 'mes' o 'quincena'" });
    }

    const fechaInicioStr = fechaInicio.toISOString().split("T")[0];
    const fechaFinStr = fechaFin.toISOString().split("T")[0];

    const asistencias = await Asistencia.findAll({
      where: {
        empleadoId,
        fecha: { [sequelize.Sequelize.Op.between]: [fechaInicioStr, fechaFinStr] }
      },
      order: [["fecha", "ASC"]]
    });

    let diasAsistidos = 0;
    let diasInasistidos = 0;
    let totalHorasTrabajadas = 0;

    asistencias.forEach(asist => {
      if (asist.presente) {
        diasAsistidos++;
        if (asist.horarioIngreso && asist.horarioSalida) {
          const [horaIng, minIng] = asist.horarioIngreso.split(":").map(Number);
          const [horaSal, minSal] = asist.horarioSalida.split(":").map(Number);
          let minutosTrabajados = (horaSal * 60 + minSal) - (horaIng * 60 + minIng);
          if (minutosTrabajados < 0) minutosTrabajados += 24 * 60;
          totalHorasTrabajadas += minutosTrabajados / 60;
        }
      } else {
        diasInasistidos++;
      }
    });

    const diasPeriodo = Math.floor((fechaFin - fechaInicio) / (1000 * 60 * 60 * 24)) + 1;
    const diasSinRegistro = diasPeriodo - (diasAsistidos + diasInasistidos);

    return res.json({
      ok: true,
      empleado: {
        id: empleado.id,
        nombre: `${empleado.nombre} ${empleado.apellido}`,
        categoria: empleado.categoria,
        dni: empleado.dni,
        obra: empleado.obra?.nombre || "Sin obra"
      },
      periodo: {
        tipo: periodo,
        fechaInicio: fechaInicioStr,
        fechaFin: fechaFinStr,
        diasPeriodo,
        ...(periodo === "quincena" && { quincena: parseInt(quincena) })
      },
      estadisticas: {
        diasAsistidos,
        diasInasistidos,
        diasSinRegistro,
        totalHorasTrabajadas: Math.round(totalHorasTrabajadas * 100) / 100,
        promedioHorasDiarias: diasAsistidos > 0
          ? Math.round((totalHorasTrabajadas / diasAsistidos) * 100) / 100
          : 0
      },
      detalle: asistencias.map(a => ({
        fecha: a.fecha,
        presente: a.presente,
        horarioIngreso: a.horarioIngreso,
        horarioSalida: a.horarioSalida,
        horasTrabajadas: (a.horarioIngreso && a.horarioSalida) ? calcularHoras(a.horarioIngreso, a.horarioSalida) : 0,
        observacion: a.observacion
      }))
    });

  } catch (error) {
    console.error("Error obteniendo estadísticas:", error);
    return res.status(500).json({ ok: false, error: "Error al obtener estadísticas del empleado" });
  }
});

function calcularHoras(horarioIngreso, horarioSalida) {
  const [horaIng, minIng] = horarioIngreso.split(":").map(Number);
  const [horaSal, minSal] = horarioSalida.split(":").map(Number);
  let minutosTrabajados = (horaSal * 60 + minSal) - (horaIng * 60 + minIng);
  if (minutosTrabajados < 0) minutosTrabajados += 24 * 60;
  return Math.round((minutosTrabajados / 60) * 100) / 100;
}

export default router;
