// API Response Types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ApiError {
  error: string;
  message: string;
  details?: Record<string, unknown>;
  request_id: string;
}

// Pagination params
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}

// Work Order States
export const WORK_ORDER_STATUSES = [
  'received',
  'in_progress',
  'paused',
  'completed',
  'invoiced',
  'paid',
  'delivered',
  'cancelled',
] as const;

export type WorkOrderStatus = (typeof WORK_ORDER_STATUSES)[number];

// Subscription Plans
export const PLANS = ['free', 'basic', 'premium', 'enterprise'] as const;
export type Plan = (typeof PLANS)[number];

// Roles
export const ROLES = [
  'super_admin',
  'admin_taller',
  'recepcionista',
  'mecanico',
  'cliente',
] as const;

export type Role = (typeof ROLES)[number];

// Tenant Status
export const TENANT_STATUSES = [
  'pending_verification',
  'trialing',
  'trial_expired',
  'active',
  'suspended',
  'deleted',
] as const;

export type TenantStatus = (typeof TENANT_STATUSES)[number];
