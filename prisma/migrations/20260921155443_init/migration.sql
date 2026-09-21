-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'recepcion', 'tecnico', 'cliente');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('INGRESADA', 'DIAGNOSTICO', 'PRESUPUESTADA', 'APROBADA', 'EN_REPARACION', 'CONTROL_CALIDAD', 'LISTA_ENTREGA', 'ENTREGADA', 'CANCELADA');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "rol" "Role" NOT NULL,
    "nombre" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "cedulaRif" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "email" TEXT,
    "direccion" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Equipo" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "serieImei" TEXT,
    "claveAcceso" TEXT,
    "accesorios" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Equipo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Repuesto" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "compatible" TEXT,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "stockMinimo" INTEGER NOT NULL DEFAULT 0,
    "costoUSD" DECIMAL(12,2) NOT NULL,
    "precioUSD" DECIMAL(12,2) NOT NULL,
    "ubicacion" TEXT,

    CONSTRAINT "Repuesto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Orden" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "equipoId" TEXT NOT NULL,
    "estado" "OrderStatus" NOT NULL DEFAULT 'INGRESADA',
    "fallaDeclarada" TEXT NOT NULL,
    "diagnostico" TEXT,
    "tecnicoId" TEXT,
    "prioridad" TEXT NOT NULL DEFAULT 'NORMAL',
    "fechaPromesa" TIMESTAMP(3),
    "fechaEntrega" TIMESTAMP(3),
    "garantiaDias" INTEGER NOT NULL DEFAULT 30,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Orden_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TasaCambio" (
    "id" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "valorVESporUSD" DECIMAL(18,2) NOT NULL,
    "fuente" TEXT NOT NULL DEFAULT 'MANUAL',
    "usuarioId" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TasaCambio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cobro" (
    "id" TEXT NOT NULL,
    "ordenId" TEXT NOT NULL,
    "tasaCobro" DECIMAL(18,2) NOT NULL,
    "totalVES" DECIMAL(14,2) NOT NULL,
    "totalUSDRef" DECIMAL(14,2) NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cobro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CajaDiaria" (
    "id" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tasaCierre" DECIMAL(18,2),
    "inicialVES" DECIMAL(14,2) NOT NULL,
    "inicialUSD" DECIMAL(14,2) NOT NULL,
    "esperadoVES" DECIMAL(14,2) NOT NULL,
    "esperadoUSD" DECIMAL(14,2) NOT NULL,
    "contadoVES" DECIMAL(14,2),
    "contadoUSD" DECIMAL(14,2),
    "cerradaEn" TIMESTAMP(3),

    CONSTRAINT "CajaDiaria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_cedulaRif_key" ON "Cliente"("cedulaRif");

-- CreateIndex
CREATE UNIQUE INDEX "Repuesto_sku_key" ON "Repuesto"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "Orden_codigo_key" ON "Orden"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "TasaCambio_fecha_key" ON "TasaCambio"("fecha");

-- AddForeignKey
ALTER TABLE "Equipo" ADD CONSTRAINT "Equipo_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Orden" ADD CONSTRAINT "Orden_equipoId_fkey" FOREIGN KEY ("equipoId") REFERENCES "Equipo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
