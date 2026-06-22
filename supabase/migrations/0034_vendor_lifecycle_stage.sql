-- Migration 0034: Add lifecycle_stage to vendors
-- Tracks vendor relationship lifecycle: discover → inventory → classify → assess →
-- risk → comply → monitor → audit → renew → offboard

CREATE TYPE vendor_lifecycle_stage AS ENUM (
  'discover',
  'inventory',
  'classify',
  'assess',
  'risk',
  'comply',
  'monitor',
  'audit',
  'renew',
  'offboard'
);

ALTER TABLE vendors
  ADD COLUMN lifecycle_stage vendor_lifecycle_stage NOT NULL DEFAULT 'inventory';
