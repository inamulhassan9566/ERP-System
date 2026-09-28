const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Seed ---');

  // Clear existing data cleanly if running seed multiple times
  await prisma.auditLog.deleteMany();
  await prisma.discountApplicationComponent.deleteMany();
  await prisma.discountApplicationItem.deleteMany();
  await prisma.discountApplication.deleteMany();
  await prisma.approvalRequest.deleteMany();
  await prisma.discountRuleVersion.deleteMany();
  await prisma.discountRuleCondition.deleteMany();
  await prisma.discountRuleComponent.deleteMany();
  await prisma.discountRuleTarget.deleteMany();
  await prisma.discountRule.deleteMany();
  await prisma.discountReason.deleteMany();
  await prisma.product.deleteMany();
  await prisma.article.deleteMany();
  await prisma.articleGroup.deleteMany();
  await prisma.subCategory.deleteMany();
  await prisma.category.deleteMany();
  await prisma.purity.deleteMany();
  await prisma.metal.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.customerTier.deleteMany();
  await prisma.customerType.deleteMany();
  await prisma.customerGroup.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.salesChannel.deleteMany();

  // 1. Roles
  const adminRole = await prisma.role.create({
    data: {
      code: 'ADMIN',
      name: 'Administrator / Owner',
      description: 'Full system access and authority to configure rules and approve discounts without restriction',
      maxDiscountPercent: 100,
      maxDiscountAmount: 10000000,
      canOverridePrice: true,
      canDiscountBill: true,
      canApprove: true,
      allowedComponents: [
        'METAL_VALUE', 'GOLD_VALUE', 'SILVER_VALUE', 'MAKING_CHARGE', 
        'LABOUR_CHARGE', 'WASTAGE', 'STONE_VALUE', 'DIAMOND_VALUE', 
        'HALLMARK_CHARGE', 'CERTIFICATION_CHARGE', 'ENGRAVING', 'POLISHING', 
        'OTHER_CHARGES', 'ENTIRE_ITEM', 'ENTIRE_BILL'
      ],
    },
  });

  const managerRole = await prisma.role.create({
    data: {
      code: 'MANAGER',
      name: 'Store Manager',
      description: 'Authority to give up to 25% discount or ₹50,000, approve staff requests',
      maxDiscountPercent: 25,
      maxDiscountAmount: 50000,
      canOverridePrice: false,
      canDiscountBill: true,
      canApprove: true,
      allowedComponents: [
        'MAKING_CHARGE', 'LABOUR_CHARGE', 'WASTAGE', 'STONE_VALUE', 
        'HALLMARK_CHARGE', 'ENGRAVING', 'ENTIRE_BILL'
      ],
    },
  });

  const salesRole = await prisma.role.create({
    data: {
      code: 'SALES_STAFF',
      name: 'Sales Staff',
      description: 'Frontline sales staff, limited to 10% on making and labour charges',
      maxDiscountPercent: 10,
      maxDiscountAmount: 10000,
      canOverridePrice: false,
      canDiscountBill: false,
      canApprove: false,
      allowedComponents: ['MAKING_CHARGE', 'LABOUR_CHARGE'],
    },
  });

  // 2. Branches
  const chennaiMain = await prisma.branch.create({
    data: {
      code: 'CHENNAI_MAIN',
      name: 'Chennai Main Showroom',
      address: '144 Usman Road, T. Nagar, Chennai - 600017',
    },
  });

  const chennaiAnna = await prisma.branch.create({
    data: {
      code: 'CHENNAI_ANNA_NAGAR',
      name: 'Chennai Anna Nagar Branch',
      address: '2nd Avenue, Anna Nagar, Chennai - 600040',
    },
  });

  // 3. Sales Channels
  const posChannel = await prisma.salesChannel.create({
    data: { code: 'POS', name: 'Showroom Counter (POS)' },
  });
  const wholesaleChannel = await prisma.salesChannel.create({
    data: { code: 'WHOLESALE', name: 'Wholesale B2B Order' },
  });
  const b2bChannel = await prisma.salesChannel.create({
    data: { code: 'B2B', name: 'Corporate Gifting' },
  });
  const onlineChannel = await prisma.salesChannel.create({
    data: { code: 'ONLINE', name: 'Digital Portal' },
  });

  // 4. Users
  const passwordHash = await bcrypt.hash('password123', 10);
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const managerPasswordHash = await bcrypt.hash('manager123', 10);
  const salesPasswordHash = await bcrypt.hash('sales123', 10);

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@jewelleryerp.com',
      name: 'Suresh Kumar (Admin)',
      passwordHash: adminPasswordHash,
      roleId: adminRole.id,
      branchId: chennaiMain.id,
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      email: 'manager@jewelleryerp.com',
      name: 'Priya Raman (Manager)',
      passwordHash: managerPasswordHash,
      roleId: managerRole.id,
      branchId: chennaiMain.id,
    },
  });

  const salesUser = await prisma.user.create({
    data: {
      email: 'sales@jewelleryerp.com',
      name: 'Arun Varma (Sales Staff)',
      passwordHash: salesPasswordHash,
      roleId: salesRole.id,
      branchId: chennaiMain.id,
    },
  });

  // 5. Customer Groups, Types, Tiers
  const vipGroup = await prisma.customerGroup.create({
    data: { code: 'VIP', name: 'VIP Elite Customer', description: 'High net-worth clients with priority benefits' },
  });
  const wholesaleGroup = await prisma.customerGroup.create({
    data: { code: 'WHOLESALE', name: 'Wholesale Partner', description: 'Bulk trade distributors and bullion buyers' },
  });
  const retailGroup = await prisma.customerGroup.create({
    data: { code: 'RETAIL', name: 'Retail Walk-in', description: 'Standard retail consumer clientele' },
  });
  const b2bGroup = await prisma.customerGroup.create({
    data: { code: 'B2B', name: 'B2B Corporate', description: 'Corporate entities with special billing' },
  });
  const employeeGroup = await prisma.customerGroup.create({
    data: { code: 'EMPLOYEE', name: 'Internal Staff & Family', description: 'Employee discount privileges' },
  });

  const individualType = await prisma.customerType.create({
    data: { code: 'INDIVIDUAL', name: 'Individual' },
  });
  const corporateType = await prisma.customerType.create({
    data: { code: 'CORPORATE', name: 'Corporate Entity' },
  });

  const platinumTier = await prisma.customerTier.create({
    data: { code: 'PLATINUM', name: 'Platinum Tier' },
  });
  const goldTier = await prisma.customerTier.create({
    data: { code: 'GOLD', name: 'Gold Tier' },
  });
  const silverTier = await prisma.customerTier.create({
    data: { code: 'SILVER', name: 'Silver Tier' },
  });

  // 6. Customers (Rahul, Aisha, Vijay, Meera)
  const rahulCustomer = await prisma.customer.create({
    data: {
      code: 'CUST-001',
      name: 'Rahul Sharma',
      phone: '+91 98401 23456',
      email: 'rahul.sharma@example.com',
      customerGroupId: retailGroup.id,
      customerTypeId: individualType.id,
      customerTierId: silverTier.id,
      isNewCustomer: false,
    },
  });

  const aishaCustomer = await prisma.customer.create({
    data: {
      code: 'CUST-002',
      name: 'Aisha Patel',
      phone: '+91 98402 34567',
      email: 'aisha.patel@example.com',
      customerGroupId: vipGroup.id,
      customerTypeId: individualType.id,
      customerTierId: platinumTier.id,
      isNewCustomer: false,
    },
  });

  const vijayCustomer = await prisma.customer.create({
    data: {
      code: 'CUST-003',
      name: 'Vijay Jewellers (Wholesale)',
      phone: '+91 98403 45678',
      email: 'vijay.trade@example.com',
      customerGroupId: wholesaleGroup.id,
      customerTypeId: corporateType.id,
      customerTierId: platinumTier.id,
      isNewCustomer: false,
    },
  });

  const meeraCustomer = await prisma.customer.create({
    data: {
      code: 'CUST-004',
      name: 'Meera Textiles B2B',
      phone: '+91 98404 56789',
      email: 'meera.b2b@example.com',
      customerGroupId: b2bGroup.id,
      customerTypeId: corporateType.id,
      customerTierId: goldTier.id,
      isNewCustomer: false,
    },
  });

  // 7. Metals & Purities
  const goldMetal = await prisma.metal.create({
    data: { code: 'GOLD', name: 'Gold' },
  });
  const silverMetal = await prisma.metal.create({
    data: { code: 'SILVER', name: 'Silver' },
  });
  const diamondMetal = await prisma.metal.create({
    data: { code: 'DIAMOND', name: 'Diamond' },
  });
  const platinumMetal = await prisma.metal.create({
    data: { code: 'PLATINUM', name: 'Platinum' },
  });

  const purity22K = await prisma.purity.create({
    data: { metalId: goldMetal.id, code: '22K', name: '22 Karat (916 Hallmarked)' },
  });
  const purity18K = await prisma.purity.create({
    data: { metalId: goldMetal.id, code: '18K', name: '18 Karat (750 Hallmarked)' },
  });
  const purity24K = await prisma.purity.create({
    data: { metalId: goldMetal.id, code: '24K', name: '24 Karat (999 Pure Bullion)' },
  });
  const purity925Silver = await prisma.purity.create({
    data: { metalId: silverMetal.id, code: '925_SILVER', name: 'Sterling Silver 925' },
  });
  const purity999Silver = await prisma.purity.create({
    data: { metalId: silverMetal.id, code: '999_SILVER', name: 'Fine Silver 999' },
  });
  const purityDiamondVVS = await prisma.purity.create({
    data: { metalId: diamondMetal.id, code: 'VVS_EF', name: 'VVS / E-F Color' },
  });

  // 8. Categories & Subcategories
  const goldChainsCategory = await prisma.category.create({
    data: { code: 'GOLD_CHAINS', name: 'Gold Chains' },
  });
  const goldRingsCategory = await prisma.category.create({
    data: { code: 'GOLD_RINGS', name: 'Gold Rings' },
  });
  const goldBanglesCategory = await prisma.category.create({
    data: { code: 'GOLD_BANGLES', name: 'Gold Bangles' },
  });
  const goldEarringsCategory = await prisma.category.create({
    data: { code: 'GOLD_EARRINGS', name: 'Gold Earrings' },
  });
  const silverChainsCategory = await prisma.category.create({
    data: { code: 'SILVER_CHAINS', name: 'Silver Chains' },
  });
  const silverRingsCategory = await prisma.category.create({
    data: { code: 'SILVER_RINGS', name: 'Silver Rings' },
  });
  const silverArticlesCategory = await prisma.category.create({
    data: { code: 'SILVER_ARTICLES', name: 'Silver Articles' },
  });
  const diamondJewelleryCategory = await prisma.category.create({
    data: { code: 'DIAMOND_JEWELLERY', name: 'Diamond Jewellery' },
  });

  const ropeSubCategory = await prisma.subCategory.create({
    data: { categoryId: goldChainsCategory.id, code: 'ROPE_CHAINS', name: 'Rope Design Chains' },
  });
  const boxSubCategory = await prisma.subCategory.create({
    data: { categoryId: goldChainsCategory.id, code: 'BOX_CHAINS', name: 'Box Link Chains' },
  });

  // 9. Article Groups & Articles
  const chainArticleGroup = await prisma.articleGroup.create({
    data: { code: 'CHAINS_GRP', name: 'Neckwear Articles' },
  });
  const royalArticle = await prisma.article.create({
    data: { articleGroupId: chainArticleGroup.id, code: 'ART-ROYAL-CHAIN', name: 'Royal Filigree Chain' },
  });
  const ringArticleGroup = await prisma.articleGroup.create({
    data: { code: 'RINGS_GRP', name: 'Finger Rings' },
  });
  const bandArticle = await prisma.article.create({
    data: { articleGroupId: ringArticleGroup.id, code: 'ART-BAND-RING', name: 'Classic Gold Band' },
  });

  // 10. Products (Realistic Jewellery Inventory)
  const productGoldChain22K = await prisma.product.create({
    data: {
      sku: 'GC-22K-001',
      name: '22K Gold Rope Chain (25g)',
      categoryId: goldChainsCategory.id,
      subCategoryId: ropeSubCategory.id,
      articleGroupId: chainArticleGroup.id,
      articleId: royalArticle.id,
      metalId: goldMetal.id,
      purityId: purity22K.id,
      grossWeight: 25.0,
      netWeight: 25.0,
      stoneWeight: 0,
      stoneCarat: 0,
      wastagePercent: 3.5,
      baseMetalValue: 110000,
      baseMakingCharge: 10000,
      baseWastageCharge: 5000,
      baseStoneValue: 0,
      baseOtherCharges: 500, // Hallmark
      brand: 'Heritage Collection',
      collection: 'Festive 2026',
      design: 'Traditional Twisted Rope',
      tags: ['hallmarked', 'bestseller', '22k'],
    },
  });

  const productGoldBangle22K = await prisma.product.create({
    data: {
      sku: 'GB-22K-002',
      name: '22K Gold Bangle Kada (35g)',
      categoryId: goldBanglesCategory.id,
      articleGroupId: chainArticleGroup.id,
      metalId: goldMetal.id,
      purityId: purity22K.id,
      grossWeight: 35.0,
      netWeight: 35.0,
      stoneWeight: 0,
      stoneCarat: 0,
      wastagePercent: 4.0,
      baseMetalValue: 154000,
      baseMakingCharge: 14000,
      baseWastageCharge: 7000,
      baseStoneValue: 0,
      baseOtherCharges: 500,
      brand: 'Royal Solitaire',
      collection: 'Bridal Grandeur',
      design: 'Intricate Embossed Kada',
      tags: ['bridal', 'heavy', '22k'],
    },
  });

  const productGoldRing18K = await prisma.product.create({
    data: {
      sku: 'GR-18K-003',
      name: '18K Gold Men Ring (6g)',
      categoryId: goldRingsCategory.id,
      articleGroupId: ringArticleGroup.id,
      articleId: bandArticle.id,
      metalId: goldMetal.id,
      purityId: purity18K.id,
      grossWeight: 6.0,
      netWeight: 6.0,
      stoneWeight: 0,
      stoneCarat: 0,
      wastagePercent: 2.0,
      baseMetalValue: 22000,
      baseMakingCharge: 3500,
      baseWastageCharge: 1200,
      baseStoneValue: 0,
      baseOtherCharges: 300,
      brand: 'Urban Elegance',
      collection: 'Executive Men',
      design: 'Matte Finish Band',
      tags: ['mens', '18k', 'dailywear'],
    },
  });

  const productSilverChain = await prisma.product.create({
    data: {
      sku: 'SC-925-004',
      name: 'Sterling Silver 925 Curb Chain (10g)',
      categoryId: silverChainsCategory.id,
      metalId: silverMetal.id,
      purityId: purity925Silver.id,
      grossWeight: 10.0,
      netWeight: 10.0,
      stoneWeight: 0,
      stoneCarat: 0,
      wastagePercent: 1.5,
      baseMetalValue: 20000,
      baseMakingCharge: 1500,
      baseWastageCharge: 500,
      baseStoneValue: 0,
      baseOtherCharges: 200,
      brand: 'SilverLine',
      collection: 'Modern Minimal',
      design: 'Diamond-Cut Curb',
      tags: ['silver', '925', 'trendy'],
    },
  });

  const productSilverBracelet = await prisma.product.create({
    data: {
      sku: 'SB-925-005',
      name: 'Silver 925 Engraved Bracelet (20g)',
      categoryId: silverArticlesCategory.id,
      metalId: silverMetal.id,
      purityId: purity925Silver.id,
      grossWeight: 20.0,
      netWeight: 20.0,
      stoneWeight: 0,
      stoneCarat: 0,
      wastagePercent: 2.0,
      baseMetalValue: 40000,
      baseMakingCharge: 2500,
      baseWastageCharge: 1000,
      baseStoneValue: 0,
      baseOtherCharges: 300,
      brand: 'SilverLine',
      collection: 'Heritage Silver',
      design: 'Filigree Floral',
      tags: ['silver', '925', 'bracelet'],
    },
  });

  const productDiamondRing = await prisma.product.create({
    data: {
      sku: 'DR-VVS-006',
      name: 'Solitaire Diamond 1.5ct Ring 18K',
      categoryId: diamondJewelleryCategory.id,
      metalId: diamondMetal.id,
      purityId: purityDiamondVVS.id,
      grossWeight: 5.0,
      netWeight: 4.7,
      stoneWeight: 0.3,
      stoneCarat: 1.5,
      wastagePercent: 2.0,
      baseMetalValue: 18000,
      baseMakingCharge: 6000,
      baseWastageCharge: 1500,
      baseStoneValue: 75000,
      baseOtherCharges: 1500, // IGI Certification
      brand: 'Lustre Diamonds',
      collection: 'Eternal Solitaire',
      design: '6-Prong Crown Solitaire',
      tags: ['diamond', 'solitaire', 'igi-certified'],
    },
  });

  // 11. Discount Reasons
  const reasons = [
    { code: 'VIP_CUSTOMER', name: 'VIP Privilege Customer' },
    { code: 'OLD_CUSTOMER', name: 'Loyal / Repeat Patron' },
    { code: 'BULK_PURCHASE', name: 'High Volume Bullion / Bulk Purchase' },
    { code: 'FESTIVAL_OFFER', name: 'Diwali / Akshaya Tritiya Festive Discount' },
    { code: 'CLEARANCE', name: 'Seasonal Design Clearance' },
    { code: 'NEGOTIATED_PRICE', name: 'Floor Manager Negotiated Deal' },
    { code: 'DAMAGED_PACKAGING', name: 'Display Piece Minor Blemish / Box Damage' },
    { code: 'OTHER', name: 'Discretionary Exceptional Approval' },
  ];

  for (const r of reasons) {
    await prisma.discountReason.create({ data: r });
  }

  // 12. Preloaded Discount Rules (Rules 1 to 7 from Section 35)

  // RULE 1: VIP Gold Chain Making Discount
  // WHO: VIP, WHAT: Gold Chains, DISCOUNT ON: Making Charge, METHOD: 20%, CONDITION: Min Bill ₹50,000, STATUS: Active
  const rule1 = await prisma.discountRule.create({
    data: {
      code: 'VIP-GOLD-001',
      name: 'VIP Gold Chain Making Discount',
      description: 'Exclusive 20% discount on making charge for VIP Elite customers purchasing gold chains with bill >= ₹50,000.',
      status: 'ACTIVE',
      priority: 50,
      stackable: true,
      stackingMethod: 'STACK',
      approvalRequired: false,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2027-12-31'),
      currentVersion: 1,
      createdById: adminUser.id,
      target: {
        create: {
          targetCustomerType: 'CUSTOMER_GROUP',
          targetCustomerGroupId: vipGroup.id,
          targetProductScope: 'CATEGORY',
          targetCategoryId: goldChainsCategory.id,
          targetMetalId: goldMetal.id,
        },
      },
      components: {
        create: [
          {
            component: 'MAKING_CHARGE',
            calculationMethod: 'PERCENTAGE',
            discountValue: 20,
            maxDiscountPercent: 20,
          },
        ],
      },
      condition: {
        create: {
          minBillValue: 50000,
        },
      },
      versions: {
        create: {
          versionNumber: 1,
          snapshot: JSON.stringify({
            code: 'VIP-GOLD-001',
            name: 'VIP Gold Chain Making Discount',
            component: 'MAKING_CHARGE',
            method: 'PERCENTAGE',
            value: 20,
            targetCustomerGroup: 'VIP',
            targetCategory: 'GOLD_CHAINS',
            minBillValue: 50000,
          }),
          changeSummary: 'Initial production rule creation',
          changedById: adminUser.id,
        },
      },
    },
  });

  // RULE 2: Wholesale Silver Value Discount
  // WHO: Wholesale, WHAT: Silver, DISCOUNT ON: Silver Value, METHOD: ₹5/g
  const rule2 = await prisma.discountRule.create({
    data: {
      code: 'WHOLESALE-SILVER-002',
      name: 'Wholesale Silver Value Discount',
      description: '₹5/g reduction on silver metal value for all verified wholesale trade accounts.',
      status: 'ACTIVE',
      priority: 40,
      stackable: true,
      stackingMethod: 'STACK',
      approvalRequired: false,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2027-12-31'),
      currentVersion: 1,
      createdById: adminUser.id,
      target: {
        create: {
          targetCustomerType: 'CUSTOMER_GROUP',
          targetCustomerGroupId: wholesaleGroup.id,
          targetProductScope: 'ALL',
          targetMetalId: silverMetal.id,
        },
      },
      components: {
        create: [
          {
            component: 'SILVER_VALUE',
            calculationMethod: 'AMOUNT_PER_GRAM',
            discountValue: 5,
            weightBasis: 'NET_WEIGHT',
          },
        ],
      },
      versions: {
        create: {
          versionNumber: 1,
          snapshot: JSON.stringify({
            code: 'WHOLESALE-SILVER-002',
            name: 'Wholesale Silver Value Discount',
            component: 'SILVER_VALUE',
            method: 'AMOUNT_PER_GRAM',
            value: 5,
            targetCustomerGroup: 'WHOLESALE',
            targetMetal: 'SILVER',
          }),
          changeSummary: 'Initial production rule creation',
          changedById: adminUser.id,
        },
      },
    },
  });

  // RULE 3: Specific Article Discount
  // WHO: Specific Customer (Rahul), WHAT: Specific Article (ART-BAND-RING / 18K Gold Men Ring), DISCOUNT ON: Entire Item, METHOD: Fixed ₹3,000
  const rule3 = await prisma.discountRule.create({
    data: {
      code: 'SPECIFIC-ART-003',
      name: 'Specific Article Discount',
      description: 'Flat ₹3,000 discount on specific article 18K Gold Men Ring for Rahul Sharma.',
      status: 'ACTIVE',
      priority: 60,
      stackable: true,
      stackingMethod: 'STACK',
      approvalRequired: false,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2027-12-31'),
      currentVersion: 1,
      createdById: adminUser.id,
      target: {
        create: {
          targetCustomerType: 'SPECIFIC_CUSTOMER',
          targetCustomerId: rahulCustomer.id,
          targetProductScope: 'SPECIFIC_ARTICLE',
          targetArticleId: bandArticle.id,
        },
      },
      components: {
        create: [
          {
            component: 'ENTIRE_ITEM',
            calculationMethod: 'FIXED_AMOUNT',
            discountValue: 3000,
          },
        ],
      },
      versions: {
        create: {
          versionNumber: 1,
          snapshot: JSON.stringify({
            code: 'SPECIFIC-ART-003',
            name: 'Specific Article Discount',
            component: 'ENTIRE_ITEM',
            method: 'FIXED_AMOUNT',
            value: 3000,
            targetCustomer: 'Rahul Sharma',
            targetArticle: 'ART-BAND-RING',
          }),
          changeSummary: 'Initial production rule creation',
          changedById: adminUser.id,
        },
      },
    },
  });

  // RULE 4: Gold Chain Making Per Gram
  // WHAT: Gold Chain, DISCOUNT ON: Making Charge, METHOD: ₹150/g
  const rule4 = await prisma.discountRule.create({
    data: {
      code: 'CHAIN-MAKING-GRAM-004',
      name: 'Gold Chain Making Per Gram',
      description: '₹150 per gram discount on Making Charge across all Gold Chains.',
      status: 'ACTIVE',
      priority: 30,
      stackable: false,
      stackingMethod: 'HIGHEST',
      approvalRequired: false,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2027-12-31'),
      currentVersion: 1,
      createdById: adminUser.id,
      target: {
        create: {
          targetCustomerType: 'ALL',
          targetProductScope: 'CATEGORY',
          targetCategoryId: goldChainsCategory.id,
          targetMetalId: goldMetal.id,
        },
      },
      components: {
        create: [
          {
            component: 'MAKING_CHARGE',
            calculationMethod: 'AMOUNT_PER_GRAM',
            discountValue: 150,
            weightBasis: 'NET_WEIGHT',
          },
        ],
      },
      versions: {
        create: {
          versionNumber: 1,
          snapshot: JSON.stringify({
            code: 'CHAIN-MAKING-GRAM-004',
            name: 'Gold Chain Making Per Gram',
            component: 'MAKING_CHARGE',
            method: 'AMOUNT_PER_GRAM',
            value: 150,
          }),
          changeSummary: 'Initial production rule creation',
          changedById: adminUser.id,
        },
      },
    },
  });

  // RULE 5: Silver Value Discount
  // WHAT: Silver, DISCOUNT ON: Silver Value, METHOD: 3%
  const rule5 = await prisma.discountRule.create({
    data: {
      code: 'SILVER-VALUE-005',
      name: 'Silver Value Discount',
      description: 'General 3% discount on Silver metal value.',
      status: 'ACTIVE',
      priority: 20,
      stackable: true,
      stackingMethod: 'STACK',
      approvalRequired: false,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2027-12-31'),
      currentVersion: 1,
      createdById: adminUser.id,
      target: {
        create: {
          targetCustomerType: 'ALL',
          targetProductScope: 'ALL',
          targetMetalId: silverMetal.id,
        },
      },
      components: {
        create: [
          {
            component: 'SILVER_VALUE',
            calculationMethod: 'PERCENTAGE',
            discountValue: 3,
          },
        ],
      },
      versions: {
        create: {
          versionNumber: 1,
          snapshot: JSON.stringify({
            code: 'SILVER-VALUE-005',
            name: 'Silver Value Discount',
            component: 'SILVER_VALUE',
            method: 'PERCENTAGE',
            value: 3,
          }),
          changeSummary: 'Initial production rule creation',
          changedById: adminUser.id,
        },
      },
    },
  });

  // RULE 6: Large Bill Discount
  // CONDITION: Bill >= ₹500,000, DISCOUNT ON: Entire Bill, METHOD: 1%
  const rule6 = await prisma.discountRule.create({
    data: {
      code: 'BILL-LARGE-006',
      name: 'Large Bill Discount',
      description: '1% discount on the entire invoice total for grand purchases exceeding ₹500,000.',
      status: 'ACTIVE',
      priority: 10,
      stackable: true,
      stackingMethod: 'STACK',
      approvalRequired: false,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2027-12-31'),
      currentVersion: 1,
      createdById: adminUser.id,
      target: {
        create: {
          targetCustomerType: 'ALL',
          targetProductScope: 'ALL',
        },
      },
      components: {
        create: [
          {
            component: 'ENTIRE_BILL',
            calculationMethod: 'PERCENTAGE',
            discountValue: 1,
          },
        ],
      },
      condition: {
        create: {
          minBillValue: 500000,
        },
      },
      versions: {
        create: {
          versionNumber: 1,
          snapshot: JSON.stringify({
            code: 'BILL-LARGE-006',
            name: 'Large Bill Discount',
            component: 'ENTIRE_BILL',
            method: 'PERCENTAGE',
            value: 1,
            minBillValue: 500000,
          }),
          changeSummary: 'Initial production rule creation',
          changedById: adminUser.id,
        },
      },
    },
  });

  // RULE 7: VIP High Value Gold Chain
  // WHO: VIP, WHAT: Gold Chain, CONDITIONS: Net Weight > 20g, Bill > ₹100,000, DISCOUNT ON: Making Charge, METHOD: 25%
  const rule7 = await prisma.discountRule.create({
    data: {
      code: 'VIP-HIGH-VAL-007',
      name: 'VIP High Value Gold Chain',
      description: '25% making charge discount for VIP clients on high-weight gold chains (Net Weight > 20g & Bill > ₹100,000).',
      status: 'ACTIVE',
      priority: 70,
      stackable: true,
      stackingMethod: 'STACK',
      approvalRequired: false,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2027-12-31'),
      currentVersion: 1,
      createdById: adminUser.id,
      target: {
        create: {
          targetCustomerType: 'CUSTOMER_GROUP',
          targetCustomerGroupId: vipGroup.id,
          targetProductScope: 'CATEGORY',
          targetCategoryId: goldChainsCategory.id,
          targetMetalId: goldMetal.id,
        },
      },
      components: {
        create: [
          {
            component: 'MAKING_CHARGE',
            calculationMethod: 'PERCENTAGE',
            discountValue: 25,
          },
        ],
      },
      condition: {
        create: {
          minWeight: 20,
          minBillValue: 100000,
        },
      },
      versions: {
        create: {
          versionNumber: 1,
          snapshot: JSON.stringify({
            code: 'VIP-HIGH-VAL-007',
            name: 'VIP High Value Gold Chain',
            component: 'MAKING_CHARGE',
            method: 'PERCENTAGE',
            value: 25,
            targetCustomerGroup: 'VIP',
            targetCategory: 'GOLD_CHAINS',
            minWeight: 20,
            minBillValue: 100000,
          }),
          changeSummary: 'Initial production rule creation',
          changedById: adminUser.id,
        },
      },
    },
  });

  // Sample Audit Logs
  await prisma.auditLog.create({
    data: {
      entityType: 'RULE',
      entityId: rule1.id,
      action: 'CREATE',
      userId: adminUser.id,
      userName: adminUser.name,
      details: JSON.stringify({ code: rule1.code, name: rule1.name, status: 'ACTIVE' }),
    },
  });

  await prisma.auditLog.create({
    data: {
      entityType: 'RULE',
      entityId: rule7.id,
      action: 'CREATE',
      userId: adminUser.id,
      userName: adminUser.name,
      details: JSON.stringify({ code: rule7.code, name: rule7.name, status: 'ACTIVE' }),
    },
  });

  // Seed a realistic completed transaction and pending approval
  const sampleTxn = await prisma.discountApplication.create({
    data: {
      transactionNumber: 'TXN-2026-0001',
      customerId: aishaCustomer.id,
      branchId: chennaiMain.id,
      salesChannelId: posChannel.id,
      userId: salesUser.id,
      totalGrossAmount: 125500,
      totalDiscountAmount: 2000,
      totalFinalAmount: 123500,
      status: 'APPLIED',
      isManual: false,
      notes: 'Automatic discount applied for VIP customer Aisha Patel',
      calculationTrace: JSON.stringify({
        rule: 'VIP-GOLD-001',
        component: 'MAKING_CHARGE',
        originalMaking: 10000,
        discountPercent: 20,
        discountAmount: 2000,
        finalMaking: 8000,
      }),
      items: {
        create: [
          {
            productId: productGoldChain22K.id,
            sku: productGoldChain22K.sku,
            productName: productGoldChain22K.name,
            quantity: 1,
            grossWeight: 25.0,
            netWeight: 25.0,
            totalGross: 125500,
            totalDiscount: 2000,
            totalFinal: 123500,
          },
        ],
      },
      appliedComponents: {
        create: [
          {
            ruleId: rule1.id,
            ruleVersionNumber: 1,
            componentType: 'MAKING_CHARGE',
            originalValue: 10000,
            discountType: 'PERCENTAGE',
            discountRate: 20,
            discountAmount: 2000,
            finalValue: 8000,
            isManual: false,
          },
        ],
      },
    },
  });

  // Seed a realistic pending approval request (Sales Staff Arun requested 20% on a deal, exceeding 10% limit)
  await prisma.approvalRequest.create({
    data: {
      requestCode: 'APR-2026-001',
      requestedById: salesUser.id,
      status: 'PENDING',
      requestedDiscountPercent: 20,
      requestedDiscountAmount: 2800,
      userAllowedPercent: 10,
      userAllowedAmount: 1400,
      reason: 'Long-time customer Rahul Sharma negotiated festival discount on bridal gold bangle making charge',
      transactionSnapshot: JSON.stringify({
        customer: rahulCustomer.name,
        product: productGoldBangle22K.name,
        gross: 175500,
        makingCharge: 14000,
      }),
      calculationPreview: JSON.stringify({
        component: 'MAKING_CHARGE',
        originalMaking: 14000,
        requestedRate: 20,
        discount: 2800,
        finalMaking: 11200,
      }),
    },
  });

  console.log('--- Seed Completed Successfully! ---');
  console.log('Seeded Users:');
  console.log(' - Admin: admin@jewelleryerp.com / admin123');
  console.log(' - Manager: manager@jewelleryerp.com / manager123');
  console.log(' - Sales Staff: sales@jewelleryerp.com / sales123');
  console.log('Seeded Rules: 7 rules (VIP Gold Chain, Wholesale Silver, Specific Article, etc.)');
}

main()
  .catch((e) => {
    console.error('Seed Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
