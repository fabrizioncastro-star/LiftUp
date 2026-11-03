CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  correo VARCHAR(255) NOT NULL UNIQUE,
  contrasena VARCHAR(255) NOT NULL,
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

CREATE TABLE IF NOT EXISTS reacciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  publicacion_id INT NOT NULL,
  usuario_id INT NOT NULL,
  tipo VARCHAR(20) NOT NULL,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_reaccion (publicacion_id, usuario_id),
  CONSTRAINT fk_liftup_reacciones_publicacion FOREIGN KEY (publicacion_id) REFERENCES publicaciones(id) ON DELETE CASCADE,
  CONSTRAINT fk_liftup_reacciones_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS comentarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  publicacion_id INT NOT NULL,
  usuario_id INT NOT NULL,
  texto TEXT NOT NULL,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_comentarios_publicacion (publicacion_id),
  CONSTRAINT fk_liftup_comentarios_publicacion FOREIGN KEY (publicacion_id) REFERENCES publicaciones(id) ON DELETE CASCADE,
  CONSTRAINT fk_liftup_comentarios_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  ejercicio VARCHAR(150) NOT NULL,
  peso DECIMAL(7,2) NOT NULL,
  fecha DATE NOT NULL,
  INDEX idx_records_usuario_ejercicio (usuario_id, ejercicio),
  CONSTRAINT fk_liftup_records_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS logros (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  codigo VARCHAR(50) NOT NULL,
  nombre VARCHAR(150) NOT NULL,
  fecha_obtenido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_logro (usuario_id, codigo),
  CONSTRAINT fk_liftup_logros_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS comunidades (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL UNIQUE,
  tipo VARCHAR(100) NOT NULL,
  descripcion TEXT NULL,
  estado ENUM('activa','inactiva') NOT NULL DEFAULT 'activa',
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS miembros_comunidad (
  id INT AUTO_INCREMENT PRIMARY KEY,
  comunidad_id INT NOT NULL,
  usuario_id INT NOT NULL,
  fecha_union TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_miembro (comunidad_id, usuario_id),
  CONSTRAINT fk_liftup_miembros_comunidad FOREIGN KEY (comunidad_id) REFERENCES comunidades(id) ON DELETE CASCADE,
  CONSTRAINT fk_liftup_miembros_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS solicitudes_comunidad (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  nombre VARCHAR(150) NOT NULL,
  tipo VARCHAR(100) NOT NULL,
  descripcion TEXT NULL,
  estado ENUM('pendiente','aprobada','rechazada') NOT NULL DEFAULT 'pendiente',
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_solicitudes_estado (estado),
  CONSTRAINT fk_liftup_solicitudes_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS reportes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reportante_id INT NOT NULL,
  objetivo_tipo ENUM('publicacion','usuario') NOT NULL,
  objetivo_id INT NOT NULL,
  motivo VARCHAR(30) NOT NULL,
  detalle TEXT NULL,
  estado ENUM('pendiente','revisado','descartado') NOT NULL DEFAULT 'pendiente',
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_reporte (reportante_id, objetivo_tipo, objetivo_id),
  INDEX idx_reportes_estado (estado),
  CONSTRAINT fk_liftup_reportes_usuario FOREIGN KEY (reportante_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS historial_moderacion (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NOT NULL,
  accion VARCHAR(50) NOT NULL,
  objetivo_tipo VARCHAR(30) NOT NULL,
  objetivo_id INT NOT NULL,
  detalle TEXT NULL,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_liftup_historial_admin FOREIGN KEY (admin_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS notificaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  tipo VARCHAR(40) NOT NULL,
  mensaje VARCHAR(300) NOT NULL,
  leida TINYINT(1) NOT NULL DEFAULT 0,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notificaciones_usuario (usuario_id, leida),
  CONSTRAINT fk_liftup_notificaciones_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS codigos_recuperacion (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  codigo_hash VARCHAR(255) NOT NULL,
  expira DATETIME NOT NULL,
  intentos INT NOT NULL DEFAULT 0,
  usado TINYINT(1) NOT NULL DEFAULT 0,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_codigos_usuario (usuario_id),
  CONSTRAINT fk_liftup_codigos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
