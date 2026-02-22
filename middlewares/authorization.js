const ROLES = {
  ADMIN: "administrador",
  OPERATOR: "usuario",
  VIEWER: "lector",
};

function hasRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.rol) {
      return res.status(403).json({ error: "Permiso denegado. Rol no definido en el token." });
    }

    const userRole = String(req.user.rol).toLowerCase().trim();
    const rolesToCheck = Array.isArray(allowedRoles) ? allowedRoles : allowedRoles ? [allowedRoles] : [];

    if (!rolesToCheck.length) return next();

    const lowerAllowed = rolesToCheck.map((r) => String(r).toLowerCase().trim());

    if (lowerAllowed.includes(userRole)) return next();

    return res.status(403).json({ error: "Permiso denegado. Su rol no tiene autorización para esta acción." });
  };
}

export { hasRole, ROLES };
