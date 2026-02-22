import { sequelize, DataTypes } from "../database.js";

const Obra = sequelize.define(
  "Obra",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING, allowNull: false },
    ubicacion: { type: DataTypes.STRING, allowNull: true },
  },
  { tableName: "obras", freezeTableName: true, timestamps: true }
);

export default Obra;