import { sequelize, DataTypes } from "../database.js";

const Asistencia = sequelize.define(
  "Asistencia",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    obraId: { type: DataTypes.INTEGER, allowNull: false, field: "obra_id" },
    empleadoId: { type: DataTypes.INTEGER, allowNull: false, field: "empleado_id" },
    fecha: { type: DataTypes.DATEONLY, allowNull: false },
    presente: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    horarioIngreso: { type: DataTypes.TIME, allowNull: true, field: "horario_ingreso" },
    horarioSalida: { type: DataTypes.TIME, allowNull: true, field: "horario_salida" },
    observacion: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: "asistencias",
    freezeTableName: true,
    timestamps: false,
    indexes: [
      { unique: true, fields: ["obra_id", "empleado_id", "fecha"] },
    ],
  }
);

export default Asistencia;
