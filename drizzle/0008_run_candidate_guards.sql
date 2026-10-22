-- Tenant guards for the discovery queue (same pattern as 0001_tenant_guards).
CREATE TRIGGER tg_run_candidates_tenant_insert BEFORE INSERT ON run_candidates
FOR EACH ROW WHEN (SELECT workspace_id FROM companies WHERE id = NEW.company_id) IS NOT NEW.workspace_id
BEGIN SELECT RAISE(ABORT, 'tenant isolation: run_candidates workspace/company mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER tg_run_candidates_tenant_update BEFORE UPDATE ON run_candidates
FOR EACH ROW WHEN (SELECT workspace_id FROM companies WHERE id = NEW.company_id) IS NOT NEW.workspace_id
BEGIN SELECT RAISE(ABORT, 'tenant isolation: run_candidates workspace/company mismatch'); END;
