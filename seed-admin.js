import dotenv from "dotenv";
dotenv.config();

import bcrypt from "bcryptjs";
import { sequelize } from "./database.js";
import Usuario from "./models/Usuario.js";

async function seedAdmin() {
  try {
    await sequelize.authenticate();
    console.log("✅ Conexión a la BD OK");

    await sequelize.sync({ alter: false });

    const email = "admin@mdf.com";
    const existente = await Usuario.findOne({ where: { email } });

    if (existente) {
      console.log(`ℹ️  El usuario '${email}' ya existe. No se crea de nuevo.`);
    } else {
      const hash = await bcrypt.hash("admin123", 10);
      await Usuario.create({
        nombre: "Administrador",
        email,
        password: hash,
        rol: "administrador",
      });
      console.log(`✅ Usuario '${email}' creado`);
      console.log(`   Password: admin123`);
      console.log(`   Rol: administrador`);
    }
  } catch (err) {
    console.error("⛔ Error:", err.message);
  } finally {
    await sequelize.close();
  }
}

seedAdmin();
