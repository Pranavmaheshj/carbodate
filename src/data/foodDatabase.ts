export interface FoodItemTemplate {
  name: string;
  portion: string;
  baseWeightGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fiber: number;
  fat: number;
  category: 'Protein' | 'Carbs' | 'Fats' | 'Produce' | 'Meals' | 'Snacks' | 'Drinks';
}

export const FOOD_DATABASE: FoodItemTemplate[] = [
  // ===================== COFFEE & HOT DRINKS =====================
  { name: 'Coffee (Brewed / Black)', portion: '1 cup (240ml)', baseWeightGrams: 240, calories: 2, protein: 0.3, carbs: 0, fiber: 0, fat: 0, category: 'Drinks' },
  { name: 'Coffee with Milk', portion: '1 cup (240ml)', baseWeightGrams: 240, calories: 65, protein: 2.8, carbs: 8.5, fiber: 0, fat: 2.2, category: 'Drinks' },
  { name: 'Coffee with Milk & Sugar', portion: '1 cup (240ml)', baseWeightGrams: 240, calories: 95, protein: 2.8, carbs: 16.0, fiber: 0, fat: 2.2, category: 'Drinks' },
  { name: 'Espresso (Single Shot)', portion: '1 shot (30ml)', baseWeightGrams: 30, calories: 3, protein: 0.1, carbs: 0.5, fiber: 0, fat: 0.1, category: 'Drinks' },
  { name: 'Caffè Latte', portion: '1 cup (240ml)', baseWeightGrams: 240, calories: 135, protein: 7.2, carbs: 10.5, fiber: 0, fat: 7.0, category: 'Drinks' },
  { name: 'Cappuccino', portion: '1 cup (240ml)', baseWeightGrams: 240, calories: 95, protein: 6.0, carbs: 8.0, fiber: 0, fat: 4.5, category: 'Drinks' },
  { name: 'Americano (Hot / Iced)', portion: '1 cup (240ml)', baseWeightGrams: 240, calories: 5, protein: 0.3, carbs: 0.8, fiber: 0, fat: 0, category: 'Drinks' },
  { name: 'Cold Brew Coffee', portion: '1 cup (240ml)', baseWeightGrams: 240, calories: 5, protein: 0.4, carbs: 0.5, fiber: 0, fat: 0, category: 'Drinks' },
  { name: 'Chai / Indian Milk Tea', portion: '1 cup (200ml)', baseWeightGrams: 200, calories: 90, protein: 2.8, carbs: 13.0, fiber: 0, fat: 3.0, category: 'Drinks' },
  { name: 'Green Tea (Plain)', portion: '1 cup (240ml)', baseWeightGrams: 240, calories: 2, protein: 0.2, carbs: 0.3, fiber: 0, fat: 0, category: 'Drinks' },
  { name: 'Black Tea (Plain)', portion: '1 cup (240ml)', baseWeightGrams: 240, calories: 2, protein: 0.2, carbs: 0.4, fiber: 0, fat: 0, category: 'Drinks' },

  // ===================== COLD DRINKS & SHAKES =====================
  { name: 'Whey Protein Shake (Water)', portion: '1 shaker (300ml)', baseWeightGrams: 300, calories: 130, protein: 25.0, carbs: 3.0, fiber: 1.0, fat: 1.5, category: 'Drinks' },
  { name: 'Whey Protein Shake (Milk)', portion: '1 shaker (350ml)', baseWeightGrams: 350, calories: 245, protein: 32.0, carbs: 14.5, fiber: 1.0, fat: 6.0, category: 'Drinks' },
  { name: 'Cow Milk (Whole)', portion: '1 cup (240ml)', baseWeightGrams: 240, calories: 149, protein: 7.7, carbs: 11.7, fiber: 0, fat: 8.0, category: 'Drinks' },
  { name: 'Skim Milk / Low Fat', portion: '1 cup (240ml)', baseWeightGrams: 240, calories: 83, protein: 8.3, carbs: 12.2, fiber: 0, fat: 0.2, category: 'Drinks' },
  { name: 'Almond Milk (Unsweetened)', portion: '1 cup (240ml)', baseWeightGrams: 240, calories: 30, protein: 1.0, carbs: 1.0, fiber: 1.0, fat: 2.5, category: 'Drinks' },
  { name: 'Soy Milk (Plain)', portion: '1 cup (240ml)', baseWeightGrams: 240, calories: 105, protein: 7.0, carbs: 4.0, fiber: 1.5, fat: 4.0, category: 'Drinks' },
  { name: 'Coconut Water', portion: '1 cup (240ml)', baseWeightGrams: 240, calories: 45, protein: 1.7, carbs: 8.9, fiber: 2.6, fat: 0.5, category: 'Drinks' },
  { name: 'Fresh Orange Juice', portion: '1 cup (240ml)', baseWeightGrams: 240, calories: 112, protein: 1.7, carbs: 25.8, fiber: 0.5, fat: 0.5, category: 'Drinks' },
  { name: 'Fresh Apple Juice', portion: '1 cup (240ml)', baseWeightGrams: 240, calories: 114, protein: 0.2, carbs: 28.0, fiber: 0.5, fat: 0.3, category: 'Drinks' },
  { name: 'Soda / Cola (Regular)', portion: '1 can (355ml)', baseWeightGrams: 355, calories: 140, protein: 0, carbs: 39.0, fiber: 0, fat: 0, category: 'Drinks' },
  { name: 'Diet Soda / Zero Sugar Cola', portion: '1 can (355ml)', baseWeightGrams: 355, calories: 1, protein: 0, carbs: 0, fiber: 0, fat: 0, category: 'Drinks' },
  { name: 'Buttermilk / Chaas', portion: '1 glass (240ml)', baseWeightGrams: 240, calories: 50, protein: 3.5, carbs: 4.8, fiber: 0, fat: 1.8, category: 'Drinks' },
  { name: 'Mango Lassi', portion: '1 glass (250ml)', baseWeightGrams: 250, calories: 210, protein: 6.0, carbs: 35.0, fiber: 1.0, fat: 5.5, category: 'Drinks' },

  // ===================== SNACKS =====================
  { name: 'Roasted Peanuts', portion: '1 handful (30g)', baseWeightGrams: 30, calories: 170, protein: 7.5, carbs: 4.5, fiber: 2.5, fat: 14.0, category: 'Snacks' },
  { name: 'Raw Almonds', portion: '28g (approx 23 nuts)', baseWeightGrams: 28, calories: 164, protein: 6.0, carbs: 6.1, fiber: 3.5, fat: 14.2, category: 'Snacks' },
  { name: 'Roasted Cashews', portion: '1 handful (30g)', baseWeightGrams: 30, calories: 165, protein: 5.5, carbs: 9.0, fiber: 1.0, fat: 13.0, category: 'Snacks' },
  { name: 'Walnuts', portion: '1 handful (30g)', baseWeightGrams: 30, calories: 195, protein: 4.5, carbs: 4.0, fiber: 2.0, fat: 20.0, category: 'Snacks' },
  { name: 'Mixed Dry Fruits & Nuts', portion: '1 portion (40g)', baseWeightGrams: 40, calories: 190, protein: 4.8, carbs: 16.0, fiber: 2.8, fat: 12.0, category: 'Snacks' },
  { name: 'Dark Chocolate (70%)', portion: '1 bar / 3 squares (30g)', baseWeightGrams: 30, calories: 170, protein: 2.2, carbs: 13.0, fiber: 3.1, fat: 12.0, category: 'Snacks' },
  { name: 'Popcorn (Air-Popped)', portion: '1 bowl (30g)', baseWeightGrams: 30, calories: 115, protein: 3.1, carbs: 18.6, fiber: 3.6, fat: 3.5, category: 'Snacks' },
  { name: 'Roasted Makhana (Fox Nuts)', portion: '1 bowl (30g)', baseWeightGrams: 30, calories: 105, protein: 3.0, carbs: 20.0, fiber: 2.5, fat: 0.5, category: 'Snacks' },
  { name: 'Digestive Biscuits / Cookies', portion: '2 biscuits (30g)', baseWeightGrams: 30, calories: 140, protein: 2.2, carbs: 20.0, fiber: 1.2, fat: 5.8, category: 'Snacks' },
  { name: 'Potato Chips', portion: '1 small bag (30g)', baseWeightGrams: 30, calories: 160, protein: 2.0, carbs: 15.0, fiber: 1.2, fat: 10.0, category: 'Snacks' },
  { name: 'Granola Bar', portion: '1 bar (40g)', baseWeightGrams: 40, calories: 170, protein: 3.8, carbs: 26.0, fiber: 2.5, fat: 5.5, category: 'Snacks' },
  { name: 'Protein Bar', portion: '1 bar (60g)', baseWeightGrams: 60, calories: 210, protein: 20.0, carbs: 22.0, fiber: 8.0, fat: 7.0, category: 'Snacks' },
  { name: 'Samosa', portion: '1 piece (80g)', baseWeightGrams: 80, calories: 262, protein: 3.5, carbs: 24.0, fiber: 2.0, fat: 17.0, category: 'Snacks' },

  // ===================== PROTEIN SOURCES =====================
  { name: 'Grilled Chicken Breast', portion: '150g', baseWeightGrams: 150, calories: 247, protein: 46.5, carbs: 0, fiber: 0, fat: 5.4, category: 'Protein' },
  { name: 'Salmon Fillet (Baked)', portion: '150g', baseWeightGrams: 150, calories: 312, protein: 34.0, carbs: 0, fiber: 0, fat: 18.5, category: 'Protein' },
  { name: 'Whole Eggs (Boiled/Poached)', portion: '2 large (100g)', baseWeightGrams: 100, calories: 143, protein: 12.6, carbs: 0.7, fiber: 0, fat: 9.9, category: 'Protein' },
  { name: 'Egg Whites', portion: '150g', baseWeightGrams: 150, calories: 78, protein: 16.4, carbs: 1.1, fiber: 0, fat: 0.3, category: 'Protein' },
  { name: 'Greek Yogurt 0% Fat', portion: '200g', baseWeightGrams: 200, calories: 118, protein: 20.6, carbs: 7.2, fiber: 0, fat: 0.8, category: 'Protein' },
  { name: 'Whey Protein Scoop', portion: '1 scoop (30g)', baseWeightGrams: 30, calories: 120, protein: 24.0, carbs: 2.5, fiber: 0.5, fat: 1.5, category: 'Protein' },
  { name: 'Paneer (Cottage Cheese)', portion: '100g', baseWeightGrams: 100, calories: 265, protein: 18.3, carbs: 3.4, fiber: 0, fat: 20.8, category: 'Protein' },
  { name: 'Tofu (Firm)', portion: '150g', baseWeightGrams: 150, calories: 144, protein: 15.5, carbs: 3.5, fiber: 2.3, fat: 8.2, category: 'Protein' },
  { name: 'Canned Tuna in Water', portion: '1 can (130g)', baseWeightGrams: 130, calories: 142, protein: 32.0, carbs: 0, fiber: 0, fat: 1.1, category: 'Protein' },
  { name: 'Lean Ground Beef (93/7)', portion: '150g', baseWeightGrams: 150, calories: 228, protein: 31.5, carbs: 0, fiber: 0, fat: 10.5, category: 'Protein' },
  { name: 'Cottage Cheese Low Fat', portion: '150g', baseWeightGrams: 150, calories: 123, protein: 18.6, carbs: 5.1, fiber: 0, fat: 3.2, category: 'Protein' },

  // ===================== CARBS & GRAINS =====================
  { name: 'High Protein Oats', portion: '50g', baseWeightGrams: 50, calories: 205, protein: 12.25, carbs: 31.0, fiber: 5.5, fat: 3.8, category: 'Carbs' },
  { name: 'Rolled Oats (Dry)', portion: '50g', baseWeightGrams: 50, calories: 190, protein: 6.6, carbs: 33.7, fiber: 5.1, fat: 3.5, category: 'Carbs' },
  { name: 'White Rice (Cooked)', portion: '1 cup (158g)', baseWeightGrams: 158, calories: 205, protein: 4.2, carbs: 44.5, fiber: 0.6, fat: 0.4, category: 'Carbs' },
  { name: 'Brown Rice (Cooked)', portion: '1 cup (195g)', baseWeightGrams: 195, calories: 216, protein: 5.0, carbs: 44.8, fiber: 3.5, fat: 1.8, category: 'Carbs' },
  { name: 'Roti / Chapati', portion: '1 piece (40g)', baseWeightGrams: 40, calories: 120, protein: 3.5, carbs: 22.0, fiber: 3.5, fat: 1.5, category: 'Carbs' },
  { name: 'Sweet Potato (Baked)', portion: '1 medium (150g)', baseWeightGrams: 150, calories: 135, protein: 3.0, carbs: 31.1, fiber: 4.0, fat: 0.2, category: 'Carbs' },
  { name: 'Boiled Potato', portion: '1 medium (150g)', baseWeightGrams: 150, calories: 130, protein: 3.0, carbs: 30.0, fiber: 2.4, fat: 0.2, category: 'Carbs' },
  { name: 'Whole Wheat Bread', portion: '2 slices (70g)', baseWeightGrams: 70, calories: 160, protein: 8.0, carbs: 28.0, fiber: 4.0, fat: 2.0, category: 'Carbs' },
  { name: 'White Bread', portion: '1 slice (30g)', baseWeightGrams: 30, calories: 79, protein: 2.7, carbs: 15.0, fiber: 0.8, fat: 1.0, category: 'Carbs' },
  { name: 'Cooked Lentils / Dal', portion: '1 cup (198g)', baseWeightGrams: 198, calories: 230, protein: 17.9, carbs: 39.9, fiber: 15.6, fat: 0.8, category: 'Carbs' },
  { name: 'Chickpeas / Chana', portion: '1 cup (164g)', baseWeightGrams: 164, calories: 269, protein: 14.5, carbs: 45.0, fiber: 12.5, fat: 4.2, category: 'Carbs' },
  { name: 'Quinoa (Cooked)', portion: '1 cup (185g)', baseWeightGrams: 185, calories: 222, protein: 8.1, carbs: 39.4, fiber: 5.2, fat: 3.6, category: 'Carbs' },
  { name: 'Pasta (Cooked)', portion: '1 cup (140g)', baseWeightGrams: 140, calories: 221, protein: 8.1, carbs: 43.2, fiber: 2.5, fat: 1.3, category: 'Carbs' },
  { name: 'Idli (Steamed)', portion: '2 pieces (100g)', baseWeightGrams: 100, calories: 140, protein: 4.2, carbs: 28.5, fiber: 2.0, fat: 0.4, category: 'Carbs' },
  { name: 'Dosa (Plain)', portion: '1 medium (100g)', baseWeightGrams: 100, calories: 168, protein: 4.0, carbs: 29.0, fiber: 1.5, fat: 3.7, category: 'Carbs' },
  { name: 'Poha', portion: '1 bowl (150g)', baseWeightGrams: 150, calories: 180, protein: 3.2, carbs: 33.5, fiber: 2.5, fat: 4.0, category: 'Carbs' },
  { name: 'Upma', portion: '1 bowl (150g)', baseWeightGrams: 150, calories: 190, protein: 4.0, carbs: 32.0, fiber: 3.0, fat: 5.0, category: 'Carbs' },

  // ===================== HEALTHY FATS =====================
  { name: 'Natural Peanut Butter', portion: '20g (1 tbsp)', baseWeightGrams: 20, calories: 120, protein: 5.5, carbs: 4.0, fiber: 1.6, fat: 10.0, category: 'Fats' },
  { name: 'Almond Butter', portion: '20g (1 tbsp)', baseWeightGrams: 20, calories: 126, protein: 4.2, carbs: 3.8, fiber: 2.0, fat: 11.2, category: 'Fats' },
  { name: 'Avocado', portion: '1/2 medium (100g)', baseWeightGrams: 100, calories: 160, protein: 2.0, carbs: 8.5, fiber: 6.7, fat: 14.7, category: 'Fats' },
  { name: 'Olive Oil', portion: '1 tbsp (14g)', baseWeightGrams: 14, calories: 119, protein: 0, carbs: 0, fiber: 0, fat: 13.5, category: 'Fats' },
  { name: 'Ghee (Clarified Butter)', portion: '1 tbsp (14g)', baseWeightGrams: 14, calories: 123, protein: 0, carbs: 0, fiber: 0, fat: 14.0, category: 'Fats' },
  { name: 'Chia Seeds', portion: '1 tbsp (12g)', baseWeightGrams: 12, calories: 58, protein: 2.0, carbs: 5.0, fiber: 4.1, fat: 3.7, category: 'Fats' },

  // ===================== PRODUCE & FRUITS =====================
  { name: 'Banana', portion: '1 medium (118g)', baseWeightGrams: 118, calories: 105, protein: 1.3, carbs: 27.0, fiber: 3.1, fat: 0.3, category: 'Produce' },
  { name: 'Apple (Fresh)', portion: '1 medium (182g)', baseWeightGrams: 182, calories: 95, protein: 0.5, carbs: 25.0, fiber: 4.4, fat: 0.3, category: 'Produce' },
  { name: 'Fresh Orange', portion: '1 medium (140g)', baseWeightGrams: 140, calories: 65, protein: 1.3, carbs: 15.5, fiber: 3.4, fat: 0.2, category: 'Produce' },
  { name: 'Mixed Berries (Fresh)', portion: '1 cup (150g)', baseWeightGrams: 150, calories: 84, protein: 1.4, carbs: 20.0, fiber: 5.3, fat: 0.6, category: 'Produce' },
  { name: 'Broccoli (Steamed)', portion: '150g', baseWeightGrams: 150, calories: 52, protein: 3.6, carbs: 10.5, fiber: 3.8, fat: 0.6, category: 'Produce' },
  { name: 'Baby Spinach (Raw)', portion: '100g', baseWeightGrams: 100, calories: 23, protein: 2.9, carbs: 3.6, fiber: 2.2, fat: 0.4, category: 'Produce' },
  { name: 'Cucumber (Sliced)', portion: '1 cup (100g)', baseWeightGrams: 100, calories: 15, protein: 0.7, carbs: 3.6, fiber: 0.5, fat: 0.1, category: 'Produce' },

  // ===================== COMPOSED MEALS =====================
  { name: 'Oatmeal with Banana & Peanut Butter', portion: '1 bowl (50g oats + banana + 20g PB)', baseWeightGrams: 190, calories: 415, protein: 12.9, carbs: 64.7, fiber: 9.8, fat: 13.8, category: 'Meals' },
  { name: 'Chicken & Rice Meal Prep Bowl', portion: '1 container (350g)', baseWeightGrams: 350, calories: 480, protein: 44.0, carbs: 52.0, fiber: 3.5, fat: 8.0, category: 'Meals' },
  { name: 'Chicken Biryani', portion: '1 plate (350g)', baseWeightGrams: 350, calories: 520, protein: 32.0, carbs: 58.0, fiber: 3.0, fat: 16.0, category: 'Meals' },
  { name: 'Chicken Curry', portion: '1 cup (200g)', baseWeightGrams: 200, calories: 280, protein: 26.0, carbs: 8.0, fiber: 2.0, fat: 15.0, category: 'Meals' },
  { name: 'Paneer Butter Masala', portion: '1 cup (200g)', baseWeightGrams: 200, calories: 360, protein: 14.0, carbs: 12.0, fiber: 3.0, fat: 28.0, category: 'Meals' },
  { name: 'Rajma / Kidney Bean Curry', portion: '1 cup (200g)', baseWeightGrams: 200, calories: 215, protein: 12.0, carbs: 35.0, fiber: 9.0, fat: 3.5, category: 'Meals' },
  { name: 'Chole / Chickpea Curry', portion: '1 cup (200g)', baseWeightGrams: 200, calories: 240, protein: 10.0, carbs: 34.0, fiber: 8.0, fat: 6.0, category: 'Meals' },
  { name: 'Salmon & Roasted Veggies Plate', portion: '1 plate (380g)', baseWeightGrams: 380, calories: 520, protein: 38.0, carbs: 32.0, fiber: 6.2, fat: 22.0, category: 'Meals' },
  { name: 'Avocado Toast with 2 Poached Eggs', portion: '1 plate', baseWeightGrams: 250, calories: 420, protein: 20.0, carbs: 32.0, fiber: 7.0, fat: 23.0, category: 'Meals' },
  { name: 'Turkey Wrap with Greens', portion: '1 wrap (220g)', baseWeightGrams: 220, calories: 360, protein: 32.0, carbs: 35.0, fiber: 4.2, fat: 9.0, category: 'Meals' },
];

export interface NutritionEstimateResult {
  calories: number;
  protein: number;
  carbs: number;
  fiber: number;
  fat: number;
  matchedTemplate: FoodItemTemplate | null;
  matchedName: string;
  isEstimate: boolean;
  autoExtractedQuantity?: number;
  autoExtractedUnit?: string;
  cleanQuery: string;
}

/**
 * Extracts quantity, unit, and food name from user text.
 * E.g. "50g oats" -> quantity: 50, unit: "g", cleanName: "oats"
 * "200ml coffee" -> quantity: 200, unit: "ml", cleanName: "coffee"
 * "1 cup coffee with milk" -> quantity: 240, unit: "ml", cleanName: "coffee with milk"
 * "2 eggs" -> quantity: 2, unit: "piece", cleanName: "eggs"
 */
export function extractFoodQueryAndQuantity(input: string): {
  quantity: number | null;
  unit: string | null;
  cleanName: string;
} {
  const raw = input.trim();
  if (!raw) return { quantity: null, unit: null, cleanName: '' };

  // Match leading quantity + unit (e.g. "50g", "200 ml", "1 cup", "2 pieces", "1 slice")
  const leadingMatch = raw.match(/^([\d.]+)\s*(g|grams|gm|ml|milliliters|cup|cups|tbsp|tablespoon|piece|pieces|slice|slices|scoop|scoops|bowl|bowls|can|cans|glass|glasses)?\b\s*(?:of\s+)?(.*)$/i);

  if (leadingMatch) {
    const qty = parseFloat(leadingMatch[1]);
    const rawUnit = (leadingMatch[2] || '').toLowerCase();
    const remaining = leadingMatch[3]?.trim() || '';

    if (!isNaN(qty) && qty > 0 && remaining.length > 0) {
      let unit = 'g';
      if (['ml', 'milliliters'].includes(rawUnit)) unit = 'ml';
      else if (['cup', 'cups'].includes(rawUnit)) unit = 'ml';
      else if (['tbsp', 'tablespoon'].includes(rawUnit)) unit = 'tbsp';
      else if (['piece', 'pieces', 'slice', 'slices'].includes(rawUnit)) unit = 'medium';
      else if (['scoop', 'scoops'].includes(rawUnit)) unit = 'g';
      else if (!rawUnit) {
        // e.g. "2 eggs" -> unit 'medium'
        unit = 'medium';
      }

      // If unit is cup or glass, convert quantity to ml if appropriate
      let adjustedQty = qty;
      if (['cup', 'cups', 'glass', 'glasses'].includes(rawUnit)) {
        adjustedQty = qty * 240;
        unit = 'ml';
      } else if (['tbsp', 'tablespoon'].includes(rawUnit)) {
        adjustedQty = qty * 15;
        unit = 'g';
      }

      return {
        quantity: adjustedQty,
        unit,
        cleanName: remaining,
      };
    }
  }

  return {
    quantity: null,
    unit: null,
    cleanName: raw,
  };
}

/**
 * Normalizes input units to grams or milliliters for nutritional scaling.
 */
export function convertUnitToGrams(quantity: number, unit: string, baseWeight: number = 100): number {
  const q = Math.max(0.1, quantity);
  const u = (unit || 'g').toLowerCase();

  switch (u) {
    case 'ml':
      return q; // 1ml water/milk/coffee ≈ 1g
    case 'cup':
      return q * 240;
    case 'tbsp':
      return q * 15;
    case 'medium':
    case 'piece':
    case 'servings':
      return q * (baseWeight > 0 ? baseWeight : 100);
    case 'g':
    default:
      return q;
  }
}

/**
 * Intelligent food matcher:
 * Finds the best item in FOOD_DATABASE using exact, starts-with, substring, and token intersection.
 */
export function findFoodDatabaseMatch(query: string): FoodItemTemplate | null {
  const q = query.trim().toLowerCase();
  if (!q || q.length < 2) return null;

  // 1. Exact match
  const exact = FOOD_DATABASE.find((f) => f.name.toLowerCase() === q);
  if (exact) return exact;

  // 2. Starts with query (e.g. "coffee" -> "Coffee (Brewed / Black)")
  const startsWith = FOOD_DATABASE.find((f) => f.name.toLowerCase().startsWith(q));
  if (startsWith) return startsWith;

  // 3. Name contains query
  const contains = FOOD_DATABASE.find((f) => f.name.toLowerCase().includes(q));
  if (contains) return contains;

  // 4. Query contains name (e.g. user typed "hot black coffee" contains "coffee")
  const queryContains = FOOD_DATABASE.find((f) => q.includes(f.name.toLowerCase()));
  if (queryContains) return queryContains;

  // 5. Word token match
  const queryTokens = q.split(/[\s,()/-]+/).filter((w) => w.length >= 2);
  let bestMatch: FoodItemTemplate | null = null;
  let highestOverlap = 0;

  for (const item of FOOD_DATABASE) {
    const itemTokens = item.name.toLowerCase().split(/[\s,()/-]+/).filter((w) => w.length >= 2);
    let overlap = 0;
    for (const qt of queryTokens) {
      if (itemTokens.some((it) => it === qt || it.startsWith(qt) || qt.startsWith(it))) {
        overlap++;
      }
    }
    if (overlap > highestOverlap) {
      highestOverlap = overlap;
      bestMatch = item;
    }
  }

  if (highestOverlap > 0 && bestMatch) {
    return bestMatch;
  }

  return null;
}

/**
 * Universal Nutrition Calculator:
 * Automatically calculates calories, protein, carbs, fiber, and fat for ANY food, snack, drink, or meal.
 * Uses FOOD_DATABASE first, and falls back to USDA food taxonomy heuristics.
 */
export function calculateFoodNutrition(
  rawInput: string,
  currentQuantity: number = 100,
  currentUnit: string = 'g'
): NutritionEstimateResult {
  const { quantity: extractedQty, unit: extractedUnit, cleanName } = extractFoodQueryAndQuantity(rawInput);
  const targetQuery = cleanName || rawInput.trim();
  const qLower = targetQuery.toLowerCase();

  const finalQty = extractedQty !== null ? extractedQty : currentQuantity;
  const finalUnit = extractedUnit !== null ? extractedUnit : currentUnit;

  if (!qLower || qLower.length < 2) {
    return {
      calories: 0,
      protein: 0,
      carbs: 0,
      fiber: 0,
      fat: 0,
      matchedTemplate: null,
      matchedName: '',
      isEstimate: false,
      cleanQuery: targetQuery,
    };
  }

  // Tier 1: Match from FOOD_DATABASE
  const match = findFoodDatabaseMatch(targetQuery);
  if (match) {
    // If user has unit 'medium'/'piece', base weight applies per piece
    const effectiveGrams = convertUnitToGrams(finalQty, finalUnit, match.baseWeightGrams);
    const ratio = match.baseWeightGrams > 0 ? effectiveGrams / match.baseWeightGrams : 1;

    return {
      calories: Math.round(match.calories * ratio),
      protein: Math.round(match.protein * ratio * 100) / 100,
      carbs: Math.round(match.carbs * ratio * 10) / 10,
      fiber: Math.round(match.fiber * ratio * 10) / 10,
      fat: Math.round(match.fat * ratio * 10) / 10,
      matchedTemplate: match,
      matchedName: match.name,
      isEstimate: false,
      autoExtractedQuantity: extractedQty !== null ? extractedQty : undefined,
      autoExtractedUnit: extractedUnit !== null ? extractedUnit : undefined,
      cleanQuery: targetQuery,
    };
  }

  // Tier 2: Heuristic Estimator for any uncatalogued Food, Drink, or Snack
  const effectiveGrams = convertUnitToGrams(finalQty, finalUnit, 100);
  const factor = effectiveGrams / 100; // standard per-100g factor

  // Heuristic profiles per 100g
  let per100 = { cal: 150, p: 4, c: 20, fiber: 2, f: 5, label: 'Standard Food' };

  if (qLower.includes('coffee') || qLower.includes('espresso') || qLower.includes('cappuccino') || qLower.includes('latte') || qLower.includes('americano') || qLower.includes('cold brew')) {
    if (qLower.includes('milk') || qLower.includes('latte') || qLower.includes('cappuccino')) {
      per100 = { cal: 35, p: 2.2, c: 3.5, fiber: 0, f: 1.5, label: 'Coffee with Milk' };
    } else {
      per100 = { cal: 1.5, p: 0.2, c: 0.1, fiber: 0, f: 0, label: 'Black Coffee' };
    }
  } else if (qLower.includes('tea') || qLower.includes('chai')) {
    if (qLower.includes('milk') || qLower.includes('chai')) {
      per100 = { cal: 45, p: 1.5, c: 6.5, fiber: 0, f: 1.5, label: 'Chai / Tea with Milk' };
    } else {
      per100 = { cal: 1, p: 0.1, c: 0.2, fiber: 0, f: 0, label: 'Tea' };
    }
  } else if (qLower.includes('juice') || qLower.includes('lemonade') || qLower.includes('soda') || qLower.includes('coke') || qLower.includes('pepsi')) {
    if (qLower.includes('diet') || qLower.includes('zero')) {
      per100 = { cal: 0.5, p: 0, c: 0, fiber: 0, f: 0, label: 'Zero Calorie Beverage' };
    } else {
      per100 = { cal: 45, p: 0.5, c: 11, fiber: 0.2, f: 0.1, label: 'Fruit Juice / Beverage' };
    }
  } else if (qLower.includes('shake') || qLower.includes('smoothie')) {
    per100 = { cal: 75, p: 6.5, c: 9, fiber: 1, f: 1.5, label: 'Protein Shake / Smoothie' };
  } else if (qLower.includes('chocolate')) {
    per100 = { cal: 540, p: 7, c: 50, fiber: 8, f: 35, label: 'Chocolate' };
  } else if (qLower.includes('chip') || qLower.includes('crisp') || qLower.includes('fries')) {
    per100 = { cal: 520, p: 6, c: 53, fiber: 3.5, f: 33, label: 'Chips / Crisps' };
  } else if (qLower.includes('cookie') || qLower.includes('biscuit')) {
    per100 = { cal: 470, p: 6, c: 66, fiber: 3, f: 20, label: 'Cookie / Biscuit' };
  } else if (qLower.includes('popcorn')) {
    per100 = { cal: 380, p: 10, c: 62, fiber: 12, f: 10, label: 'Popcorn' };
  } else if (qLower.includes('nut') || qLower.includes('peanut') || qLower.includes('almond') || qLower.includes('cashew') || qLower.includes('walnut')) {
    per100 = { cal: 580, p: 20, c: 18, fiber: 8, f: 50, label: 'Nuts' };
  } else if (qLower.includes('pizza')) {
    per100 = { cal: 266, p: 11, c: 33, fiber: 2.3, f: 10, label: 'Pizza' };
  } else if (qLower.includes('burger')) {
    per100 = { cal: 250, p: 13, c: 24, fiber: 1.5, f: 12, label: 'Burger' };
  } else if (qLower.includes('sandwich') || qLower.includes('wrap')) {
    per100 = { cal: 220, p: 11, c: 25, fiber: 2, f: 8, label: 'Sandwich' };
  } else if (qLower.includes('curry')) {
    per100 = { cal: 140, p: 10, c: 6, fiber: 2, f: 8, label: 'Curry' };
  } else if (qLower.includes('biryani') || qLower.includes('fried rice')) {
    per100 = { cal: 155, p: 8, c: 20, fiber: 1.5, f: 5, label: 'Rice Meal' };
  } else if (qLower.includes('salad')) {
    per100 = { cal: 65, p: 2, c: 5, fiber: 2.5, f: 4, label: 'Salad' };
  } else if (qLower.includes('soup')) {
    per100 = { cal: 45, p: 3, c: 5, fiber: 1, f: 1.5, label: 'Soup' };
  } else if (qLower.includes('chicken') || qLower.includes('turkey')) {
    per100 = { cal: 165, p: 31, c: 0, fiber: 0, f: 3.6, label: 'Poultry' };
  } else if (qLower.includes('fish') || qLower.includes('salmon') || qLower.includes('tuna')) {
    per100 = { cal: 180, p: 24, c: 0, fiber: 0, f: 9, label: 'Fish' };
  } else if (qLower.includes('beef') || qLower.includes('steak') || qLower.includes('mutton') || qLower.includes('lamb')) {
    per100 = { cal: 250, p: 26, c: 0, fiber: 0, f: 15, label: 'Meat' };
  } else if (qLower.includes('egg')) {
    per100 = { cal: 143, p: 12.6, c: 0.7, fiber: 0, f: 9.9, label: 'Egg' };
  } else if (qLower.includes('rice')) {
    per100 = { cal: 130, p: 2.7, c: 28, fiber: 0.4, f: 0.3, label: 'Cooked Rice' };
  } else if (qLower.includes('bread') || qLower.includes('toast') || qLower.includes('roti') || qLower.includes('naan')) {
    per100 = { cal: 265, p: 9, c: 49, fiber: 3, f: 3.2, label: 'Bread / Flatbread' };
  } else if (qLower.includes('oat')) {
    per100 = { cal: 380, p: 13, c: 67, fiber: 10, f: 7, label: 'Oats' };
  } else if (qLower.includes('apple') || qLower.includes('banana') || qLower.includes('orange') || qLower.includes('fruit') || qLower.includes('berry')) {
    per100 = { cal: 58, p: 0.8, c: 14.5, fiber: 2.8, f: 0.3, label: 'Fruit' };
  }

  return {
    calories: Math.max(0, Math.round(per100.cal * factor)),
    protein: Math.max(0, Math.round(per100.p * factor * 100) / 100),
    carbs: Math.max(0, Math.round(per100.c * factor * 10) / 10),
    fiber: Math.max(0, Math.round(per100.fiber * factor * 10) / 10),
    fat: Math.max(0, Math.round(per100.f * factor * 10) / 10),
    matchedTemplate: null,
    matchedName: per100.label,
    isEstimate: true,
    autoExtractedQuantity: extractedQty !== null ? extractedQty : undefined,
    autoExtractedUnit: extractedUnit !== null ? extractedUnit : undefined,
    cleanQuery: targetQuery,
  };
}
