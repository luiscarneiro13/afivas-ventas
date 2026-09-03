import bcrypt from 'bcryptjs'

// Reemplaza el login dummy actual (cualquier usuario/contraseña funciona).
// Contraseña por defecto: 'admin123' — cambiarla es responsabilidad del
// primer uso real de la app (no hay flujo de "forzar cambio" todavía).
export async function seedUsuarios(knex) {
  const existing = await knex('usuarios').where({ usuario: 'admin' }).first()
  if (existing) return

  const passwordHash = await bcrypt.hash('admin123', 10)
  await knex('usuarios').insert({
    usuario: 'admin',
    nombre_completo: 'Administrador',
    password_hash: passwordHash,
    rol: 'administrador',
    activo: 1
  })
}
