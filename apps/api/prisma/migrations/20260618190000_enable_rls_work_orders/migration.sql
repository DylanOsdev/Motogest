-- Enable RLS on work_orders
ALTER TABLE "work_orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "work_orders" FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "work_orders"
  USING ("tenant_id" = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK ("tenant_id" = current_setting('app.tenant_id', true)::uuid);

-- Enable RLS on work_order_mechanics
ALTER TABLE "work_order_mechanics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "work_order_mechanics" FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "work_order_mechanics"
  USING ("tenant_id" = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK ("tenant_id" = current_setting('app.tenant_id', true)::uuid);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON "work_orders" TO taller_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "work_order_mechanics" TO taller_app;
