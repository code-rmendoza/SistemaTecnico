-- AlterTable
ALTER TABLE "Cobro" ADD COLUMN     "usuario" TEXT NOT NULL DEFAULT 'sistema',
ADD COLUMN     "vueltoVES" DECIMAL(14,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "CobroLinea" (
    "id" TEXT NOT NULL,
    "cobroId" TEXT NOT NULL,
    "metodo" TEXT NOT NULL,
    "moneda" TEXT NOT NULL,
    "monto" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "CobroLinea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimientoCaja" (
    "id" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "usuario" TEXT NOT NULL,
    "moneda" TEXT NOT NULL,
    "monto" DECIMAL(14,2) NOT NULL,
    "concepto" TEXT NOT NULL,
    "cobroId" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MovimientoCaja_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CobroLinea_cobroId_idx" ON "CobroLinea"("cobroId");

-- CreateIndex
CREATE INDEX "MovimientoCaja_fecha_usuario_idx" ON "MovimientoCaja"("fecha", "usuario");

-- CreateIndex
CREATE INDEX "Cobro_ordenId_idx" ON "Cobro"("ordenId");

-- AddForeignKey
ALTER TABLE "CobroLinea" ADD CONSTRAINT "CobroLinea_cobroId_fkey" FOREIGN KEY ("cobroId") REFERENCES "Cobro"("id") ON DELETE CASCADE ON UPDATE CASCADE;
