import { sequelize, DataTypes } from "../database.js";

const Empleado = sequelize.define(
  "Empleado",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    obraId: { type: DataTypes.INTEGER, allowNull: false, field: "obra_id" },
    nombre: { type: DataTypes.STRING, allowNull: false },
    apellido: { type: DataTypes.STRING, allowNull: false },
    fechaNacimiento: { type: DataTypes.DATEONLY, allowNull: true, field: "fecha_nacimiento" },
    dni: { type: DataTypes.STRING(20), allowNull: false },
    categoria: {
      type: DataTypes.ENUM(
        "ayudante",
        "medio oficial",
        "oficial",
        "oficial especializado",
        "capataz"
      ),
      allowNull: false,
    },
    fechaIngreso: { type: DataTypes.DATEONLY, allowNull: true, field: "fecha_ingreso" },
    activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { tableName: "empleados", freezeTableName: true, timestamps: true }
);

export default Empleado;
