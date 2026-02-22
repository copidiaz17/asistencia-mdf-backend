import Obra from "./Obra.js";
import Empleado from "./Empleado.js";
import Asistencia from "./Asistencia.js";

Obra.hasMany(Empleado, { foreignKey: "obra_id", as: "empleados" });
Empleado.belongsTo(Obra, { foreignKey: "obra_id", as: "obra" });

Obra.hasMany(Asistencia, { foreignKey: "obra_id", as: "asistencias" });
Asistencia.belongsTo(Obra, { foreignKey: "obra_id", as: "obra" });

Empleado.hasMany(Asistencia, { foreignKey: "empleado_id", as: "asistencias" });
Asistencia.belongsTo(Empleado, { foreignKey: "empleado_id", as: "empleado" });

console.log("✅ Asociaciones Sequelize definidas correctamente");
