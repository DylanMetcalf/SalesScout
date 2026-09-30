-- Database-level tenant isolation guards.
-- Every company-scoped row must name the workspace its company belongs to,
-- and every prospect-scoped row must belong to the same company as its prospect.
-- The application filters by tenant on every query; these triggers are the backstop.
CREATE TRIGGER tg_brain_facts_tenant_insert BEFORE INSERT ON brain_facts
FOR EACH ROW WHEN (SELECT workspace_id FROM companies WHERE id = NEW.company_id) IS NOT NEW.workspace_id
BEGIN SELECT RAISE(ABORT, 'tenant isolation: brain_facts workspace/company mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER tg_brain_facts_tenant_update BEFORE UPDATE ON brain_facts
FOR EACH ROW WHEN (SELECT workspace_id FROM companies WHERE id = NEW.company_id) IS NOT NEW.workspace_id
BEGIN SELECT RAISE(ABORT, 'tenant isolation: brain_facts workspace/company mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER tg_sources_tenant_insert BEFORE INSERT ON sources
FOR EACH ROW WHEN (SELECT workspace_id FROM companies WHERE id = NEW.company_id) IS NOT NEW.workspace_id
BEGIN SELECT RAISE(ABORT, 'tenant isolation: sources workspace/company mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER tg_sources_tenant_update BEFORE UPDATE ON sources
FOR EACH ROW WHEN (SELECT workspace_id FROM companies WHERE id = NEW.company_id) IS NOT NEW.workspace_id
BEGIN SELECT RAISE(ABORT, 'tenant isolation: sources workspace/company mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER tg_documents_tenant_insert BEFORE INSERT ON documents
FOR EACH ROW WHEN (SELECT workspace_id FROM companies WHERE id = NEW.company_id) IS NOT NEW.workspace_id
BEGIN SELECT RAISE(ABORT, 'tenant isolation: documents workspace/company mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER tg_documents_tenant_update BEFORE UPDATE ON documents
FOR EACH ROW WHEN (SELECT workspace_id FROM companies WHERE id = NEW.company_id) IS NOT NEW.workspace_id
BEGIN SELECT RAISE(ABORT, 'tenant isolation: documents workspace/company mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER tg_market_opportunities_tenant_insert BEFORE INSERT ON market_opportunities
FOR EACH ROW WHEN (SELECT workspace_id FROM companies WHERE id = NEW.company_id) IS NOT NEW.workspace_id
BEGIN SELECT RAISE(ABORT, 'tenant isolation: market_opportunities workspace/company mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER tg_market_opportunities_tenant_update BEFORE UPDATE ON market_opportunities
FOR EACH ROW WHEN (SELECT workspace_id FROM companies WHERE id = NEW.company_id) IS NOT NEW.workspace_id
BEGIN SELECT RAISE(ABORT, 'tenant isolation: market_opportunities workspace/company mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER tg_lead_strategies_tenant_insert BEFORE INSERT ON lead_strategies
FOR EACH ROW WHEN (SELECT workspace_id FROM companies WHERE id = NEW.company_id) IS NOT NEW.workspace_id
BEGIN SELECT RAISE(ABORT, 'tenant isolation: lead_strategies workspace/company mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER tg_lead_strategies_tenant_update BEFORE UPDATE ON lead_strategies
FOR EACH ROW WHEN (SELECT workspace_id FROM companies WHERE id = NEW.company_id) IS NOT NEW.workspace_id
BEGIN SELECT RAISE(ABORT, 'tenant isolation: lead_strategies workspace/company mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER tg_search_runs_tenant_insert BEFORE INSERT ON search_runs
FOR EACH ROW WHEN (SELECT workspace_id FROM companies WHERE id = NEW.company_id) IS NOT NEW.workspace_id
BEGIN SELECT RAISE(ABORT, 'tenant isolation: search_runs workspace/company mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER tg_search_runs_tenant_update BEFORE UPDATE ON search_runs
FOR EACH ROW WHEN (SELECT workspace_id FROM companies WHERE id = NEW.company_id) IS NOT NEW.workspace_id
BEGIN SELECT RAISE(ABORT, 'tenant isolation: search_runs workspace/company mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER tg_prospects_tenant_insert BEFORE INSERT ON prospects
FOR EACH ROW WHEN (SELECT workspace_id FROM companies WHERE id = NEW.company_id) IS NOT NEW.workspace_id
BEGIN SELECT RAISE(ABORT, 'tenant isolation: prospects workspace/company mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER tg_prospects_tenant_update BEFORE UPDATE ON prospects
FOR EACH ROW WHEN (SELECT workspace_id FROM companies WHERE id = NEW.company_id) IS NOT NEW.workspace_id
BEGIN SELECT RAISE(ABORT, 'tenant isolation: prospects workspace/company mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER tg_evidence_tenant_insert BEFORE INSERT ON evidence
FOR EACH ROW WHEN (SELECT workspace_id FROM companies WHERE id = NEW.company_id) IS NOT NEW.workspace_id
BEGIN SELECT RAISE(ABORT, 'tenant isolation: evidence workspace/company mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER tg_evidence_tenant_update BEFORE UPDATE ON evidence
FOR EACH ROW WHEN (SELECT workspace_id FROM companies WHERE id = NEW.company_id) IS NOT NEW.workspace_id
BEGIN SELECT RAISE(ABORT, 'tenant isolation: evidence workspace/company mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER tg_contacts_tenant_insert BEFORE INSERT ON contacts
FOR EACH ROW WHEN (SELECT workspace_id FROM companies WHERE id = NEW.company_id) IS NOT NEW.workspace_id
BEGIN SELECT RAISE(ABORT, 'tenant isolation: contacts workspace/company mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER tg_contacts_tenant_update BEFORE UPDATE ON contacts
FOR EACH ROW WHEN (SELECT workspace_id FROM companies WHERE id = NEW.company_id) IS NOT NEW.workspace_id
BEGIN SELECT RAISE(ABORT, 'tenant isolation: contacts workspace/company mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER tg_activities_tenant_insert BEFORE INSERT ON activities
FOR EACH ROW WHEN (SELECT workspace_id FROM companies WHERE id = NEW.company_id) IS NOT NEW.workspace_id
BEGIN SELECT RAISE(ABORT, 'tenant isolation: activities workspace/company mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER tg_activities_tenant_update BEFORE UPDATE ON activities
FOR EACH ROW WHEN (SELECT workspace_id FROM companies WHERE id = NEW.company_id) IS NOT NEW.workspace_id
BEGIN SELECT RAISE(ABORT, 'tenant isolation: activities workspace/company mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER tg_follow_ups_tenant_insert BEFORE INSERT ON follow_ups
FOR EACH ROW WHEN (SELECT workspace_id FROM companies WHERE id = NEW.company_id) IS NOT NEW.workspace_id
BEGIN SELECT RAISE(ABORT, 'tenant isolation: follow_ups workspace/company mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER tg_follow_ups_tenant_update BEFORE UPDATE ON follow_ups
FOR EACH ROW WHEN (SELECT workspace_id FROM companies WHERE id = NEW.company_id) IS NOT NEW.workspace_id
BEGIN SELECT RAISE(ABORT, 'tenant isolation: follow_ups workspace/company mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER tg_outreach_drafts_tenant_insert BEFORE INSERT ON outreach_drafts
FOR EACH ROW WHEN (SELECT workspace_id FROM companies WHERE id = NEW.company_id) IS NOT NEW.workspace_id
BEGIN SELECT RAISE(ABORT, 'tenant isolation: outreach_drafts workspace/company mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER tg_outreach_drafts_tenant_update BEFORE UPDATE ON outreach_drafts
FOR EACH ROW WHEN (SELECT workspace_id FROM companies WHERE id = NEW.company_id) IS NOT NEW.workspace_id
BEGIN SELECT RAISE(ABORT, 'tenant isolation: outreach_drafts workspace/company mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER tg_sales_briefs_tenant_insert BEFORE INSERT ON sales_briefs
FOR EACH ROW WHEN (SELECT workspace_id FROM companies WHERE id = NEW.company_id) IS NOT NEW.workspace_id
BEGIN SELECT RAISE(ABORT, 'tenant isolation: sales_briefs workspace/company mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER tg_sales_briefs_tenant_update BEFORE UPDATE ON sales_briefs
FOR EACH ROW WHEN (SELECT workspace_id FROM companies WHERE id = NEW.company_id) IS NOT NEW.workspace_id
BEGIN SELECT RAISE(ABORT, 'tenant isolation: sales_briefs workspace/company mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER tg_feedback_tenant_insert BEFORE INSERT ON feedback
FOR EACH ROW WHEN (SELECT workspace_id FROM companies WHERE id = NEW.company_id) IS NOT NEW.workspace_id
BEGIN SELECT RAISE(ABORT, 'tenant isolation: feedback workspace/company mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER tg_feedback_tenant_update BEFORE UPDATE ON feedback
FOR EACH ROW WHEN (SELECT workspace_id FROM companies WHERE id = NEW.company_id) IS NOT NEW.workspace_id
BEGIN SELECT RAISE(ABORT, 'tenant isolation: feedback workspace/company mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER tg_exclusions_tenant_insert BEFORE INSERT ON exclusions
FOR EACH ROW WHEN (SELECT workspace_id FROM companies WHERE id = NEW.company_id) IS NOT NEW.workspace_id
BEGIN SELECT RAISE(ABORT, 'tenant isolation: exclusions workspace/company mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER tg_exclusions_tenant_update BEFORE UPDATE ON exclusions
FOR EACH ROW WHEN (SELECT workspace_id FROM companies WHERE id = NEW.company_id) IS NOT NEW.workspace_id
BEGIN SELECT RAISE(ABORT, 'tenant isolation: exclusions workspace/company mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER tg_learning_suggestions_tenant_insert BEFORE INSERT ON learning_suggestions
FOR EACH ROW WHEN (SELECT workspace_id FROM companies WHERE id = NEW.company_id) IS NOT NEW.workspace_id
BEGIN SELECT RAISE(ABORT, 'tenant isolation: learning_suggestions workspace/company mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER tg_learning_suggestions_tenant_update BEFORE UPDATE ON learning_suggestions
FOR EACH ROW WHEN (SELECT workspace_id FROM companies WHERE id = NEW.company_id) IS NOT NEW.workspace_id
BEGIN SELECT RAISE(ABORT, 'tenant isolation: learning_suggestions workspace/company mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER tg_writing_preferences_tenant_insert BEFORE INSERT ON writing_preferences
FOR EACH ROW WHEN (SELECT workspace_id FROM companies WHERE id = NEW.company_id) IS NOT NEW.workspace_id
BEGIN SELECT RAISE(ABORT, 'tenant isolation: writing_preferences workspace/company mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER tg_writing_preferences_tenant_update BEFORE UPDATE ON writing_preferences
FOR EACH ROW WHEN (SELECT workspace_id FROM companies WHERE id = NEW.company_id) IS NOT NEW.workspace_id
BEGIN SELECT RAISE(ABORT, 'tenant isolation: writing_preferences workspace/company mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER tg_exports_tenant_insert BEFORE INSERT ON exports
FOR EACH ROW WHEN (SELECT workspace_id FROM companies WHERE id = NEW.company_id) IS NOT NEW.workspace_id
BEGIN SELECT RAISE(ABORT, 'tenant isolation: exports workspace/company mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER tg_exports_tenant_update BEFORE UPDATE ON exports
FOR EACH ROW WHEN (SELECT workspace_id FROM companies WHERE id = NEW.company_id) IS NOT NEW.workspace_id
BEGIN SELECT RAISE(ABORT, 'tenant isolation: exports workspace/company mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER tg_evidence_prospect_insert BEFORE INSERT ON evidence
FOR EACH ROW WHEN NEW.prospect_id IS NOT NULL AND (SELECT company_id FROM prospects WHERE id = NEW.prospect_id) IS NOT NEW.company_id
BEGIN SELECT RAISE(ABORT, 'tenant isolation: evidence prospect/company mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER tg_evidence_prospect_update BEFORE UPDATE ON evidence
FOR EACH ROW WHEN NEW.prospect_id IS NOT NULL AND (SELECT company_id FROM prospects WHERE id = NEW.prospect_id) IS NOT NEW.company_id
BEGIN SELECT RAISE(ABORT, 'tenant isolation: evidence prospect/company mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER tg_contacts_prospect_insert BEFORE INSERT ON contacts
FOR EACH ROW WHEN NEW.prospect_id IS NOT NULL AND (SELECT company_id FROM prospects WHERE id = NEW.prospect_id) IS NOT NEW.company_id
BEGIN SELECT RAISE(ABORT, 'tenant isolation: contacts prospect/company mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER tg_contacts_prospect_update BEFORE UPDATE ON contacts
FOR EACH ROW WHEN NEW.prospect_id IS NOT NULL AND (SELECT company_id FROM prospects WHERE id = NEW.prospect_id) IS NOT NEW.company_id
BEGIN SELECT RAISE(ABORT, 'tenant isolation: contacts prospect/company mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER tg_activities_prospect_insert BEFORE INSERT ON activities
FOR EACH ROW WHEN NEW.prospect_id IS NOT NULL AND (SELECT company_id FROM prospects WHERE id = NEW.prospect_id) IS NOT NEW.company_id
BEGIN SELECT RAISE(ABORT, 'tenant isolation: activities prospect/company mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER tg_activities_prospect_update BEFORE UPDATE ON activities
FOR EACH ROW WHEN NEW.prospect_id IS NOT NULL AND (SELECT company_id FROM prospects WHERE id = NEW.prospect_id) IS NOT NEW.company_id
BEGIN SELECT RAISE(ABORT, 'tenant isolation: activities prospect/company mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER tg_follow_ups_prospect_insert BEFORE INSERT ON follow_ups
FOR EACH ROW WHEN NEW.prospect_id IS NOT NULL AND (SELECT company_id FROM prospects WHERE id = NEW.prospect_id) IS NOT NEW.company_id
BEGIN SELECT RAISE(ABORT, 'tenant isolation: follow_ups prospect/company mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER tg_follow_ups_prospect_update BEFORE UPDATE ON follow_ups
FOR EACH ROW WHEN NEW.prospect_id IS NOT NULL AND (SELECT company_id FROM prospects WHERE id = NEW.prospect_id) IS NOT NEW.company_id
BEGIN SELECT RAISE(ABORT, 'tenant isolation: follow_ups prospect/company mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER tg_outreach_drafts_prospect_insert BEFORE INSERT ON outreach_drafts
FOR EACH ROW WHEN NEW.prospect_id IS NOT NULL AND (SELECT company_id FROM prospects WHERE id = NEW.prospect_id) IS NOT NEW.company_id
BEGIN SELECT RAISE(ABORT, 'tenant isolation: outreach_drafts prospect/company mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER tg_outreach_drafts_prospect_update BEFORE UPDATE ON outreach_drafts
FOR EACH ROW WHEN NEW.prospect_id IS NOT NULL AND (SELECT company_id FROM prospects WHERE id = NEW.prospect_id) IS NOT NEW.company_id
BEGIN SELECT RAISE(ABORT, 'tenant isolation: outreach_drafts prospect/company mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER tg_sales_briefs_prospect_insert BEFORE INSERT ON sales_briefs
FOR EACH ROW WHEN NEW.prospect_id IS NOT NULL AND (SELECT company_id FROM prospects WHERE id = NEW.prospect_id) IS NOT NEW.company_id
BEGIN SELECT RAISE(ABORT, 'tenant isolation: sales_briefs prospect/company mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER tg_sales_briefs_prospect_update BEFORE UPDATE ON sales_briefs
FOR EACH ROW WHEN NEW.prospect_id IS NOT NULL AND (SELECT company_id FROM prospects WHERE id = NEW.prospect_id) IS NOT NEW.company_id
BEGIN SELECT RAISE(ABORT, 'tenant isolation: sales_briefs prospect/company mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER tg_companies_account_insert BEFORE INSERT ON companies
FOR EACH ROW WHEN (SELECT account_id FROM workspaces WHERE id = NEW.workspace_id) IS NOT NEW.account_id
BEGIN SELECT RAISE(ABORT, 'tenant isolation: company workspace/account mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER tg_integration_company_insert BEFORE INSERT ON integration_accounts
FOR EACH ROW WHEN NEW.company_id IS NOT NULL AND (SELECT workspace_id FROM companies WHERE id = NEW.company_id) IS NOT NEW.workspace_id
BEGIN SELECT RAISE(ABORT, 'tenant isolation: integration workspace/company mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER tg_companies_account_update BEFORE UPDATE ON companies
FOR EACH ROW WHEN (SELECT account_id FROM workspaces WHERE id = NEW.workspace_id) IS NOT NEW.account_id
BEGIN SELECT RAISE(ABORT, 'tenant isolation: company workspace/account mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER tg_integration_company_update BEFORE UPDATE ON integration_accounts
FOR EACH ROW WHEN NEW.company_id IS NOT NULL AND (SELECT workspace_id FROM companies WHERE id = NEW.company_id) IS NOT NEW.workspace_id
BEGIN SELECT RAISE(ABORT, 'tenant isolation: integration workspace/company mismatch'); END;
