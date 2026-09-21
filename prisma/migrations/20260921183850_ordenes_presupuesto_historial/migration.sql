-- CreateTable
CREATE TABLE "EstadoHistorial" (
    "id" TEXT NOT NULL,
    "ordenId" TEXT NOT NULL,
    "de" "OrderStatus" NOT NULL,
    "a" "OrderStatus" NOT NULL,
    "usuario" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EstadoHistorial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Presupuesto" (
    "id" TEXT NOT NULL,
    "ordenId" TEXT NOT NULL,
    "manoObraUSD" DECIMAL(12,2) NOT NULL,
    "tasaRef" DECIMAL(18,2) NOT NULL,
    "totalUSDRef" DECIMAL(14,2) NOT NULL,
    "totalVES" DECIMAL(14,2) NOT NULL,
    "validezDias" INTEGER NOT NULL DEFAULT 7,
    "aprobada" BOOLEAN NOT NULL DEFAULT false,
    "aprobadaPor" TEXT,
    "aprobadaEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Presupuesto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EstadoHistorial_ordenId_idx" ON "EstadoHistorial"("ordenId");

-- CreateIndex
CREATE UNIQUE INDEX "Presupuesto_ordenId_key" ON "Presupuesto"("ordenId");

-- AddForeignKey
ALTER TABLE "EstadoHistorial" ADD CONSTRAINT "EstadoHistorial_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "Orden"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presupuesto" ADD CONSTRAINT "Presupuesto_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "Orden"("id") ON DELETE CASCADE ON UPDATE CASCADE;
