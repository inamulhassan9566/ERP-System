import { ComponentType, CalculationMethod, WeightBasis } from "@prisma/client";
import { TransactionItemInput, ItemComponentValues } from "@/lib/types";

export function getComponentValue(
  component: ComponentType,
  itemComponents: ItemComponentValues
): number {
  switch (component) {
    case ComponentType.METAL_VALUE:
    case ComponentType.GOLD_VALUE:
    case ComponentType.SILVER_VALUE:
    case ComponentType.OTHER_METAL_VALUE:
      return itemComponents.metalValue || 0;

    case ComponentType.MAKING_CHARGE:
    case ComponentType.LABOUR_CHARGE:
    case ComponentType.OTHER_MANUFACTURING:
      return itemComponents.makingCharge || 0;

    case ComponentType.WASTAGE:
      return itemComponents.wastage || 0;

    case ComponentType.STONE_VALUE:
    case ComponentType.DIAMOND_VALUE:
    case ComponentType.STONE_SETTING:
    case ComponentType.OTHER_STONE:
      return itemComponents.stoneValue || 0;

    case ComponentType.HALLMARK_CHARGE:
      return itemComponents.hallmarkCharge || 0;

    case ComponentType.CERTIFICATION_CHARGE:
      return itemComponents.certificationCharge || 0;

    case ComponentType.ENGRAVING:
      return itemComponents.engraving || 0;

    case ComponentType.POLISHING:
      return itemComponents.polishing || 0;

    case ComponentType.OTHER_CHARGES:
      return itemComponents.otherCharges || 0;

    case ComponentType.ENTIRE_ITEM:
      return (
        (itemComponents.metalValue || 0) +
        (itemComponents.makingCharge || 0) +
        (itemComponents.wastage || 0) +
        (itemComponents.stoneValue || 0) +
        (itemComponents.hallmarkCharge || 0) +
        (itemComponents.certificationCharge || 0) +
        (itemComponents.engraving || 0) +
        (itemComponents.polishing || 0) +
        (itemComponents.otherCharges || 0)
      );

    case ComponentType.ENTIRE_BILL:
      return 0; // Handled at bill level

    default:
      return 0;
  }
}

export function computeRawDiscountAmount(
  method: CalculationMethod,
  discountValue: number,
  originalValue: number,
  item?: TransactionItemInput,
  weightBasis: WeightBasis = WeightBasis.NET_WEIGHT
): number {
  if (originalValue <= 0 || discountValue <= 0) return 0;

  let calculated = 0;

  switch (method) {
    case CalculationMethod.PERCENTAGE:
      calculated = originalValue * (discountValue / 100);
      break;

    case CalculationMethod.FIXED_AMOUNT:
      calculated = Math.min(discountValue, originalValue);
      break;

    case CalculationMethod.AMOUNT_PER_GRAM:
      if (item) {
        const weight = weightBasis === WeightBasis.GROSS_WEIGHT ? item.grossWeight : item.netWeight;
        calculated = Math.min(originalValue, discountValue * (weight || 0));
      }
      break;

    case CalculationMethod.AMOUNT_PER_PIECE:
      if (item) {
        calculated = Math.min(originalValue, discountValue * (item.quantity || 1));
      }
      break;

    case CalculationMethod.AMOUNT_PER_CARAT:
      if (item) {
        calculated = Math.min(originalValue, discountValue * (item.stoneCarat || 0));
      }
      break;

    case CalculationMethod.PRICE_OVERRIDE:
      // Final price is explicitly overridden to discountValue, so discount is original - override
      if (discountValue < originalValue) {
        calculated = originalValue - discountValue;
      }
      break;

    default:
      calculated = 0;
  }

  // Ensure discount does not exceed original component value
  return Math.max(0, Math.min(calculated, originalValue));
}

export function applyLimits(
  discountAmount: number,
  originalValue: number,
  limits?: {
    maxDiscountPercent?: number | null;
    maxDiscountAmount?: number | null;
    maxPerItem?: number | null;
    maxPerBill?: number | null;
  }
): { finalDiscount: number; capped: boolean; capReason?: string } {
  if (!limits) return { finalDiscount: discountAmount, capped: false };

  let cappedDiscount = discountAmount;
  let capped = false;
  let capReason: string | undefined;

  // 1. Max percentage cap
  if (limits.maxDiscountPercent !== null && limits.maxDiscountPercent !== undefined && limits.maxDiscountPercent > 0) {
    const maxAllowedByPercent = originalValue * (limits.maxDiscountPercent / 100);
    if (cappedDiscount > maxAllowedByPercent) {
      cappedDiscount = maxAllowedByPercent;
      capped = true;
      capReason = `Capped by maximum rule limit of ${limits.maxDiscountPercent}% (₹${maxAllowedByPercent.toFixed(2)})`;
    }
  }

  // 2. Max absolute amount cap
  if (limits.maxDiscountAmount !== null && limits.maxDiscountAmount !== undefined && limits.maxDiscountAmount > 0) {
    if (cappedDiscount > limits.maxDiscountAmount) {
      cappedDiscount = limits.maxDiscountAmount;
      capped = true;
      capReason = `Capped by maximum rule amount limit of ₹${limits.maxDiscountAmount.toFixed(2)}`;
    }
  }

  // 3. Max per item cap
  if (limits.maxPerItem !== null && limits.maxPerItem !== undefined && limits.maxPerItem > 0) {
    if (cappedDiscount > limits.maxPerItem) {
      cappedDiscount = limits.maxPerItem;
      capped = true;
      capReason = `Capped by max-per-item limit of ₹${limits.maxPerItem.toFixed(2)}`;
    }
  }

  return {
    finalDiscount: Math.round(cappedDiscount * 100) / 100,
    capped,
    capReason,
  };
}
