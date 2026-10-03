-- Aureon Base: grant project_records access to the RLS application role.
-- The data API executes project_records queries after SET LOCAL ROLE aureon_app.

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE project_records TO aureon_app;

ALTER TABLE project_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS project_records_tenant_scope ON project_records;
CREATE POLICY project_records_tenant_scope ON project_records
  FOR ALL
  USING (
    project_id = aureon_current_project_id()
    AND (
      owner_user_id IS NULL
      OR owner_user_id = aureon_current_user_id()
      OR EXISTS (
        SELECT 1 FROM project_users pu
        WHERE pu.project_id = project_records.project_id
          AND pu.user_id = aureon_current_user_id()
          AND pu.role IN ('owner','admin')
      )
    )
  )
  WITH CHECK (
    project_id = aureon_current_project_id()
    AND (
      owner_user_id IS NULL
      OR owner_user_id = aureon_current_user_id()
      OR EXISTS (
        SELECT 1 FROM project_users pu
        WHERE pu.project_id = project_records.project_id
          AND pu.user_id = aureon_current_user_id()
          AND pu.role IN ('owner','admin')
      )
    )
  );
