-- LiftUp - esquema MySQL del Sprint 1 (Release 1: HU-001 a HU-006). Ejecutar en phpMyAdmin o por CLI.
-- (El servidor también lo aplica solo al arrancar: src/config/migrar.ts)
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  correo VARCHAR(255) NOT NULL UNIQUE,
  contrasena VARCHAR(255) NOT NULL,            -- hash bcrypt, nunca texto plano
  rol ENUM('usuario','admin') NOT NULL DEFAULT 'usuario',
  foto_perfil VARCHAR(500) NULL,
  nivel_experiencia ENUM('sin_experiencia','principiante','intermedio','avanzado') NOT NULL DEFAULT 'sin_experiencia',
  biografia TEXT NULL,
  privacidad ENUM('publica','solo_amigos','privada') NOT NULL DEFAULT 'publica',
  estado ENUM('activo','suspendido','inactivo') NOT NULL DEFAULT 'activo',
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sesiones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  token VARCHAR(512) NOT NULL,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_expiracion TIMESTAMP NOT NULL,
  CONSTRAINT fk_liftup_sesiones_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_sesiones_token (token(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- HU-005: sesiones de entrenamiento con foto o video (archivo_url guarda solo la ruta)
CREATE TABLE IF NOT EXISTS publicaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  descripcion TEXT NULL,
  archivo_url VARCHAR(500) NOT NULL,
  tipo_archivo ENUM('imagen','video') NOT NULL,
  ejercicio VARCHAR(150) NULL,
  peso_kg DECIMAL(6,2) NULL,
  series INT NULL,
  repeticiones INT NULL,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_liftup_publicaciones_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_publicaciones_fecha (fecha),
  INDEX idx_publicaciones_usuario (usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- HU-006: el feed prioriza a los usuarios seguidos. Los endpoints para seguir se construyen en el Release 2.
CREATE TABLE IF NOT EXISTS seguimientos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  seguidor_id INT NOT NULL,
  seguido_id INT NOT NULL,
  estado ENUM('pendiente','aceptado') NOT NULL DEFAULT 'aceptado',
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_seguimiento (seguidor_id, seguido_id),
  CONSTRAINT fk_liftup_seguimientos_seguidor FOREIGN KEY (seguidor_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT fk_liftup_seguimientos_seguido FOREIGN KEY (seguido_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
