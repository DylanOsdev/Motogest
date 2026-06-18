-- CreateTable
CREATE TABLE "work_orders" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "milestone" VARCHAR(30) NOT NULL DEFAULT 'created',
    "priority" VARCHAR(20) NOT NULL DEFAULT 'normal',
    "scheduled_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "description" TEXT NOT NULL,
    "client_notes" TEXT,
    "internal_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_order_mechanics" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "work_order_id" UUID NOT NULL,
    "mechanic_id" UUID NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "work_order_mechanics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "work_orders_tenant_id_milestone_idx" ON "work_orders"("tenant_id", "milestone");

-- CreateIndex
CREATE INDEX "work_orders_tenant_id_vehicle_id_idx" ON "work_orders"("tenant_id", "vehicle_id");

-- CreateIndex
CREATE INDEX "work_orders_tenant_id_client_id_idx" ON "work_orders"("tenant_id", "client_id");

-- CreateIndex
CREATE INDEX "work_order_mechanics_work_order_id_idx" ON "work_order_mechanics"("work_order_id");

-- CreateIndex
CREATE INDEX "work_order_mechanics_mechanic_id_idx" ON "work_order_mechanics"("mechanic_id");

-- CreateIndex
CREATE UNIQUE INDEX "work_order_mechanics_work_order_id_mechanic_id_key" ON "work_order_mechanics"("work_order_id", "mechanic_id");

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_mechanics" ADD CONSTRAINT "work_order_mechanics_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_mechanics" ADD CONSTRAINT "work_order_mechanics_mechanic_id_fkey" FOREIGN KEY ("mechanic_id") REFERENCES "mechanics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
