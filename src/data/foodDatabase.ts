export interface FoodItemTemplate {
  name: string;
  portion: string;
  baseWeightGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fiber: number;
  fat: number;
  category: 'Protein' | 'Carbs' | 'Fats' | 'Produce' | 'Meals' | 'Snacks';
}

export const FOOD_DATABASE: FoodItemTemplate[] = [
  // Proteins
  { name: 'Grilled Chicken Breast', portion: '150g', baseWeightGrams: 150, calories: 247, protein: 46.5, carbs: 0, fiber: 0, fat: 5.4, category: 'Protein' },
  { name: 'Salmon Fillet (Baked)', portion: '150g', baseWeightGrams: 150, calories: 312, protein: 34, carbs: 0, fiber: 0, fat: 18.5, category: 'Protein' },
  { name: 'Whole Eggs (Boiled/Poached)', portion: '2 large (100g)', baseWeightGrams: 100, calories: 143, protein: 12.6, carbs: 0.7, fiber: 0, fat: 9.9, category: 'Protein' },
  { name: 'Egg Whites', portion: '150g', baseWeightGrams: 150, calories: 78, protein: 16.4, carbs: 1.1, fiber: 0, fat: 0.3, category: 'Protein' },
  { name: 'Greek Yogurt 0% Fat', portion: '200g', baseWeightGrams: 200, calories: 118, protein: 20.6, carbs: 7.2, fiber: 0, fat: 0.8, category: 'Protein' },
  { name: 'Whey Protein Scoop', portion: '1 scoop (30g)', baseWeightGrams: 30, calories: 120, protein: 24, carbs: 2.5, fiber: 0.5, fat: 1.5, category: 'Protein' },
  { name: 'Tofu (Firm)', portion: '150g', baseWeightGrams: 150, calories: 144, protein: 15.5, carbs: 3.5, fiber: 2.3, fat: 8.2, category: 'Protein' },
  { name: 'Canned Tuna in Water', portion: '1 can (130g)', baseWeightGrams: 130, calories: 142, protein: 32, carbs: 0, fiber: 0, fat: 1.1, category: 'Protein' },
  { name: 'Lean Ground Beef (93/7)', portion: '150g', baseWeightGrams: 150, calories: 228, protein: 31.5, carbs: 0, fiber: 0, fat: 10.5, category: 'Protein' },
  { name: 'Cottage Cheese Low Fat', portion: '150g', baseWeightGrams: 150, calories: 123, protein: 18.6, carbs: 5.1, fiber: 0, fat: 3.2, category: 'Protein' },

  // Carbs & Grains
  { name: 'High Protein Oats', portion: '50g', baseWeightGrams: 50, calories: 205, protein: 12.25, carbs: 31.0, fiber: 5.5, fat: 3.8, category: 'Carbs' },
  { name: 'Rolled Oats (Dry)', portion: '50g', baseWeightGrams: 50, calories: 190, protein: 6.6, carbs: 33.7, fiber: 5.1, fat: 3.5, category: 'Carbs' },
  { name: 'Banana', portion: '1 medium (118g)', baseWeightGrams: 118, calories: 105, protein: 1.3, carbs: 27.0, fiber: 3.1, fat: 0.3, category: 'Carbs' },
  { name: 'White Rice (Cooked)', portion: '1 cup (158g)', baseWeightGrams: 158, calories: 205, protein: 4.2, carbs: 44.5, fiber: 0.6, fat: 0.4, category: 'Carbs' },
  { name: 'Brown Rice (Cooked)', portion: '1 cup (195g)', baseWeightGrams: 195, calories: 216, protein: 5.0, carbs: 44.8, fiber: 3.5, fat: 1.8, category: 'Carbs' },
  { name: 'Sweet Potato (Baked)', portion: '1 medium (150g)', baseWeightGrams: 150, calories: 135, protein: 3.0, carbs: 31.1, fiber: 4.0, fat: 0.2, category: 'Carbs' },
  { name: 'Whole Wheat Bread', portion: '2 slices (70g)', baseWeightGrams: 70, calories: 160, protein: 8.0, carbs: 28.0, fiber: 4.0, fat: 2.0, category: 'Carbs' },
  { name: 'Quinoa (Cooked)', portion: '1 cup (185g)', baseWeightGrams: 185, calories: 222, protein: 8.1, carbs: 39.4, fiber: 5.2, fat: 3.6, category: 'Carbs' },
  { name: 'Pasta (Cooked)', portion: '1 cup (140g)', baseWeightGrams: 140, calories: 221, protein: 8.1, carbs: 43.2, fiber: 2.5, fat: 1.3, category: 'Carbs' },

  // Healthy Fats
  { name: 'Peanut Butter (Natural)', portion: '20g (1 tbsp)', baseWeightGrams: 20, calories: 120, protein: 5.5, carbs: 4.0, fiber: 1.6, fat: 10.0, category: 'Fats' },
  { name: 'Almond Butter', portion: '20g (1 tbsp)', baseWeightGrams: 20, calories: 126, protein: 4.2, carbs: 3.8, fiber: 2.0, fat: 11.2, category: 'Fats' },
  { name: 'Avocado', portion: '1/2 medium (100g)', baseWeightGrams: 100, calories: 160, protein: 2.0, carbs: 8.5, fiber: 6.7, fat: 14.7, category: 'Fats' },
  { name: 'Olive Oil', portion: '1 tbsp (14g)', baseWeightGrams: 14, calories: 119, protein: 0, carbs: 0, fiber: 0, fat: 13.5, category: 'Fats' },
  { name: 'Raw Almonds', portion: '28g (approx 23 nuts)', baseWeightGrams: 28, calories: 164, protein: 6.0, carbs: 6.1, fiber: 3.5, fat: 14.2, category: 'Fats' },
  { name: 'Chia Seeds', portion: '1 tbsp (12g)', baseWeightGrams: 12, calories: 58, protein: 2.0, carbs: 5.0, fiber: 4.1, fat: 3.7, category: 'Fats' },

  // Produce & Greens
  { name: 'Broccoli (Steamed)', portion: '150g', baseWeightGrams: 150, calories: 52, protein: 3.6, carbs: 10.5, fiber: 3.8, fat: 0.6, category: 'Produce' },
  { name: 'Baby Spinach (Raw)', portion: '100g', baseWeightGrams: 100, calories: 23, protein: 2.9, carbs: 3.6, fiber: 2.2, fat: 0.4, category: 'Produce' },
  { name: 'Mixed Berries (Fresh)', portion: '1 cup (150g)', baseWeightGrams: 150, calories: 84, protein: 1.4, carbs: 20.0, fiber: 5.3, fat: 0.6, category: 'Produce' },
  { name: 'Apple (Fresh)', portion: '1 medium (182g)', baseWeightGrams: 182, calories: 95, protein: 0.5, carbs: 25.0, fiber: 4.4, fat: 0.3, category: 'Produce' },

  // Composed Meals & Bowls
  { name: 'Oatmeal with Banana & Peanut Butter', portion: '1 bowl (50g oats + banana + 20g PB)', baseWeightGrams: 190, calories: 415, protein: 12.9, carbs: 64.7, fiber: 9.8, fat: 13.8, category: 'Meals' },
  { name: 'Chicken & Rice Meal Prep Bowl', portion: '1 container (350g)', baseWeightGrams: 350, calories: 480, protein: 44, carbs: 52, fiber: 3.5, fat: 8, category: 'Meals' },
  { name: 'Salmon & Roasted Veggies Plate', portion: '1 plate (380g)', baseWeightGrams: 380, calories: 520, protein: 38, carbs: 32, fiber: 6.2, fat: 22, category: 'Meals' },
  { name: 'Avocado Toast with 2 Poached Eggs', portion: '1 plate', baseWeightGrams: 250, calories: 420, protein: 20, carbs: 32, fiber: 7.0, fat: 23, category: 'Meals' },
  { name: 'Turkey Wrap with Greens', portion: '1 wrap (220g)', baseWeightGrams: 220, calories: 360, protein: 32, carbs: 35, fiber: 4.2, fat: 9, category: 'Meals' },
];
