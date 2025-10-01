-- CreateTable
CREATE TABLE "roles" (
    "id_rol" SERIAL NOT NULL,
    "nombre_rol" VARCHAR(50) NOT NULL,
    "descripcion" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id_rol")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id_usuario" SERIAL NOT NULL,
    "nombre_completo" VARCHAR(255) NOT NULL,
    "correo_electronico" VARCHAR(255) NOT NULL,
    "contrasena_hash" VARCHAR(255) NOT NULL,
    "id_rol" INTEGER NOT NULL,
    "estado_cuenta" VARCHAR(50) NOT NULL DEFAULT 'pendiente',
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_aprobacion" TIMESTAMP(3),
    "fecha_ultimo_acceso" TIMESTAMP(3),
    "token_recuperacion" VARCHAR(255),
    "token_recuperacion_expira" TIMESTAMP(3),
    "intentos_fallidos" INTEGER NOT NULL DEFAULT 0,
    "bloqueado_hasta" TIMESTAMP(3),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "solicitudes_registro" (
    "id_solicitud" SERIAL NOT NULL,
    "nombre_completo" VARCHAR(255) NOT NULL,
    "correo_electronico" VARCHAR(255) NOT NULL,
    "estado" VARCHAR(50) NOT NULL DEFAULT 'pendiente',
    "fecha_solicitud" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_revision" TIMESTAMP(3),
    "id_revisor" INTEGER,
    "comentarios" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "solicitudes_registro_pkey" PRIMARY KEY ("id_solicitud")
);

-- CreateTable
CREATE TABLE "historial_operaciones" (
    "id_operacion" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "tipo_operacion" VARCHAR(100) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "datos_adicionales" JSONB,
    "fecha_operacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historial_operaciones_pkey" PRIMARY KEY ("id_operacion")
);

-- CreateTable
CREATE TABLE "sesiones_activas" (
    "id_sesion" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "fecha_inicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_expiracion" TIMESTAMP(3) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "sesiones_activas_pkey" PRIMARY KEY ("id_sesion")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_nombre_rol_key" ON "roles"("nombre_rol");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_correo_electronico_key" ON "usuarios"("correo_electronico");

-- CreateIndex
CREATE INDEX "usuarios_correo_electronico_idx" ON "usuarios"("correo_electronico");

-- CreateIndex
CREATE INDEX "usuarios_estado_cuenta_idx" ON "usuarios"("estado_cuenta");

-- CreateIndex
CREATE INDEX "historial_operaciones_id_usuario_idx" ON "historial_operaciones"("id_usuario");

-- CreateIndex
CREATE INDEX "historial_operaciones_fecha_operacion_idx" ON "historial_operaciones"("fecha_operacion");

-- CreateIndex
CREATE INDEX "sesiones_activas_id_usuario_idx" ON "sesiones_activas"("id_usuario");

-- CreateIndex
CREATE INDEX "sesiones_activas_activo_idx" ON "sesiones_activas"("activo");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_id_rol_fkey" FOREIGN KEY ("id_rol") REFERENCES "roles"("id_rol") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_operaciones" ADD CONSTRAINT "historial_operaciones_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesiones_activas" ADD CONSTRAINT "sesiones_activas_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;
