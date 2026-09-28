import {
  RuleStatus,
  StackingMethod,
  CustomerTargetType,
  ProductTargetScope,
  ComponentType,
  CalculationMethod,
  WeightBasis,
  ApplicationStatus,
  ApprovalStatus,
  AuditEntityType,
  AuditAction,
} from "@prisma/client";

export {
  RuleStatus,
  StackingMethod,
  CustomerTargetType,
  ProductTargetScope,
  ComponentType,
  CalculationMethod,
  WeightBasis,
  ApplicationStatus,
  ApprovalStatus,
  AuditEntityType,
  AuditAction,
};

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  roleId: string;
  roleCode: "ADMIN" | "MANAGER" | "SALES_STAFF";
  roleName: string;
  maxDiscountPercent: number;
  maxDiscountAmount: number;
  canOverridePrice: boolean;
  canDiscountBill: boolean;
  canApprove: boolean;
  allowedComponents: string[];
  branchId?: string | null;
  branchName?: string | null;
}

export interface ItemComponentValues {
  metalValue: number;
  makingCharge: number;
  wastage: number;
  stoneValue: number;
  hallmarkCharge: number;
  certificationCharge: number;
  engraving: number;
  polishing: number;
  otherCharges: number;
}

export interface TransactionItemInput {
  id: string; // item temporary or row id
  productId?: string;
  sku: string;
  name: string;
  categoryId?: string;
  subCategoryId?: string;
  articleGroupId?: string;
  articleId?: string;
  metalCode?: string; // 'GOLD', 'SILVER', 'DIAMOND', etc.
  purityCode?: string; // '22K', '18K', '925_SILVER', etc.
  grossWeight: number; // in grams
  netWeight: number; // in grams
  stoneWeight?: number; // in grams
  stoneCarat?: number; // in carats
  quantity: number;
  components: ItemComponentValues;
}

export interface TransactionContext {
  customerId?: string;
  customerCode?: string;
  customerName?: string;
  customerGroupId?: string;
  customerGroupCode?: string; // 'VIP', 'WHOLESALE', 'RETAIL', etc.
  customerTypeId?: string;
  customerTierId?: string;
  isNewCustomer?: boolean;

  items: TransactionItemInput[];
  billValueOverride?: number; // Optional explicit bill gross, otherwise sum of all item components
  branchId?: string;
  branchCode?: string;
  salesChannelId?: string;
  salesChannelCode?: string; // 'POS', 'WHOLESALE', 'B2B', 'ONLINE'

  userId: string;
  userRoleCode?: string;
  userMaxDiscountPercent?: number;
  userMaxDiscountAmount?: number;
  userCanDiscountBill?: boolean;
  userAllowedComponents?: string[];

  date?: Date | string; // Defaults to now
}

export interface ComponentCalculationResult {
  componentType: ComponentType;
  originalValue: number;
  discountAmount: number;
  finalValue: number;
  appliedRules: {
    ruleId: string;
    ruleCode: string;
    ruleName: string;
    ruleVersion: number;
    method: CalculationMethod;
    rateOrValue: number;
    discountAmount: number;
    isManual?: boolean;
  }[];
}

export interface ItemCalculationResult {
  itemId: string;
  sku: string;
  name: string;
  quantity: number;
  grossWeight: number;
  netWeight: number;
  components: Record<ComponentType, ComponentCalculationResult>;
  originalItemTotal: number;
  itemLevelDiscount: number; // Discount directly on ENTIRE_ITEM
  totalItemDiscount: number; // Sum of component discounts + itemLevelDiscount
  finalItemTotal: number;
}

export interface ConflictInfo {
  ruleIds: string[];
  ruleCodes: string[];
  component: ComponentType;
  itemId?: string;
  priority: number;
  message: string;
  resolved: boolean;
  resolutionNote?: string;
}

export interface TraceStep {
  step: "DISCOVERY" | "ELIGIBILITY" | "PRODUCT_MATCH" | "CONDITION_CHECK" | "PRIORITY_EVAL" | "STACKING_EVAL" | "CALCULATION" | "LIMITS_CHECK" | "PERMISSION_CHECK";
  ruleCode?: string;
  ruleName?: string;
  target?: string;
  passed: boolean;
  detail: string;
  timestamp?: string;
}

export interface DiscountCalculationResponse {
  applicableRules: {
    ruleId: string;
    ruleCode: string;
    ruleName: string;
    priority: number;
    stackable: boolean;
    stackingMethod: StackingMethod;
    status: RuleStatus;
    matched: boolean;
    reason: string;
  }[];

  appliedRules: {
    ruleId: string;
    ruleCode: string;
    ruleName: string;
    priority: number;
    component: ComponentType;
    discountAmount: number;
    method: CalculationMethod;
    value: number;
  }[];

  discountByItem: Record<string, ItemCalculationResult>;
  discountByComponent: Record<ComponentType, number>;
  billDiscount: number;

  totalGrossAmount: number;
  totalDiscountAmount: number;
  totalFinalAmount: number;

  approvalRequired: boolean;
  approvalReason?: string;
  approvalDetails?: {
    requestedAmount: number;
    requestedPercent: number;
    allowedPercent: number;
    allowedAmount: number;
    violatingComponents?: string[];
  };

  warnings: string[];
  conflicts: ConflictInfo[];
  calculationTrace: TraceStep[];
}

export interface CreateRuleInput {
  code: string;
  name: string;
  description?: string;
  status: RuleStatus;
  priority: number;
  stackable: boolean;
  stackingMethod: StackingMethod;
  approvalRequired: boolean;
  startDate: string | Date;
  endDate?: string | Date | null;
  startTime?: string | null;
  endTime?: string | null;
  daysOfWeek?: string | null;

  target: {
    targetCustomerType: CustomerTargetType;
    targetCustomerId?: string | null;
    targetCustomerGroupId?: string | null;
    targetProductScope: ProductTargetScope;
    targetCategoryId?: string | null;
    targetSubCategoryId?: string | null;
    targetArticleGroupId?: string | null;
    targetArticleId?: string | null;
    targetSku?: string | null;
    targetMetalId?: string | null;
    targetPurityId?: string | null;
    targetBranchId?: string | null;
    targetSalesChannelId?: string | null;
  };

  components: {
    component: ComponentType;
    calculationMethod: CalculationMethod;
    discountValue: number;
    weightBasis?: WeightBasis;
    maxDiscountPercent?: number | null;
    maxDiscountAmount?: number | null;
    maxPerItem?: number | null;
    maxPerBill?: number | null;
  }[];

  condition?: {
    minBillValue?: number | null;
    maxBillValue?: number | null;
    minQuantity?: number | null;
    maxQuantity?: number | null;
    minWeight?: number | null;
    maxWeight?: number | null;
    minItemValue?: number | null;
    maxItemValue?: number | null;
    customConditions?: string | null;
  } | null;

  changeSummary?: string;
}
