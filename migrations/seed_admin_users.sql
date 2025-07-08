-- ===========================================
-- Admin Users Seed Data
-- ===========================================

-- Insert admin users with GitHub authentication
-- These users will be able to access the admin dashboard

INSERT OR IGNORE INTO users (id, github_id, email, created_at) VALUES
-- Cozy (multiple email addresses for flexibility)
('user_cozy_primary', 'Cozyartz', 'cozy2963@gmail.com', CURRENT_TIMESTAMP),
('user_cozy_business', 'Cozyartz', 'andrea@cozyartzmedia.com', CURRENT_TIMESTAMP),
('user_cozy_etchnft', 'Cozyartz', 'cozy@etchnft.com', CURRENT_TIMESTAMP),

-- Amy (grammar-nerd)
('user_amy_admin', 'grammar-nerd', 'amy@etchnft.com', CURRENT_TIMESTAMP);

-- Note: The actual GitHub ID will be populated when users first authenticate
-- These entries ensure the emails are recognized as admin accounts