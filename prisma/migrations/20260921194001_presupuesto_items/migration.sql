-- CreateTable
CREATE TABLE "PresupuestoItem" (
    "id" TEXT NOT NULL,
    "presupuestoId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precioUSD" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "PresupuestoItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PresupuestoItem_presupuestoId_idx" ON "PresupuestoItem"("presupuestoId");

-- AddForeignKey
ALTER TABLE "PresupuestoItem" ADD CONSTRAINT "PresupuestoItem_presupuestoId_fkey" FOREIGN KEY ("presupuestoId") REFERENCES "Presupuesto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
