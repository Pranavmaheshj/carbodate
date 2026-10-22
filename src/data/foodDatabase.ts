export interface FoodItemTemplate {
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  category: 'Protein' | 'Carbs' | 'Fats' | 'Produce' | 'Meals' | 'Snacks';
}

export const FOOD_DATABASE: FoodItemTemplate[] = [
  // Proteins
  { name: 'Grilled Chicken Breast', portion: '150g', calories: 247, protein: 46.5, carbs: 0, fat: 5.4, category: 'Protein' },
  { name: 'Salmon Fillet (Baked)', portion: '150g', calories: 312, protein: 34, carbs: 0, fat: 18.5, category: 'Protein' },
  { name: 'Whole Eggs (Boiled/Poached)', portion: '2 large (100g)', calories: 143, protein: 12.6, carbs: 0.7, fat: 9.9, category: 'Protein' },
  { name: 'Egg Whites', portion: '150g', calories: 78, protein: 16.4, carbs: 1.1, fat: 0.3, category: 'Protein' },
  { name: 'Greek Yogurt 0% Fat', portion: '200g', calories: 118, protein: 20.6, carbs: 7.2, fat: 0.8, category: 'Protein' },
  { name: 'Whey Protein Scoop', portion: '1 scoop (30g)', calories: 120, protein: 24, carbs: 2.5, fat: 1.5, category: 'Protein' },
  { name: 'Tofu (Firm)', portion: '150g', calories: 144, protein: 15.5, carbs: 3.5, fat: 8.2, category: 'Protein' },
  { name: 'Canned Tuna in Water', portion: '1 can (130g)', calories: 142, protein: 32, carbs: 0, fat: 1.1, category: 'Protein' },
  { name: 'Lean Ground Beef (93/7)', portion: '150g', calories: 228, protein: 31.5, carbs: 0, fat: 10.5, category: 'Protein' },
  { name: 'Cottage Cheese Low Fat', portion: '150g', calories: 123, protein: 18.6, carbs: 5.1, fat: 3.2, category: 'Protein' },

  // Carbs & Grains
  { name: 'White Rice (Cooked)', portion: '1 cup (158g)', calories: 205, protein: 4.2, carbs: 44.5, fat: 0.4, category: 'Carbs' },
  { name: 'Brown Rice (Cooked)', portion: '1 cup (195g)', calories: 216, protein: 5.0, carbs: 44.8, fat: 1.8, category: 'Carbs' },
  { name: 'Rolled Oats (Dry)', portion: '50g', calories: 189, protein: 6.8, carbs: 33.1, fat: 3.5, category: 'Carbs' },
  { name: 'Sweet Potato (Baked)', portion: '1 medium (150g)', calories: 135, protein: 3.0, carbs: 31.1, fat: 0.2, category: 'Carbs' },
  { name: 'Whole Wheat Bread', portion: '2 slices (70g)', calories: 160, protein: 8.0, carbs: 28.0, fat: 2.0, category: 'Carbs' },
  { name: 'Quinoa (Cooked)', portion: '1 cup (185g)', calories: 222, protein: 8.1, carbs: 39.4, fat: 3.6, category: 'Carbs' },
  { name: 'Pasta (Cooked)', portion: '1 cup (140g)', calories: 221, protein: 8.1, carbs: 43.2, fat: 1.3, category: 'Carbs' },
  { name: 'Banana', portion: '1 medium (118g)', calories: 105, protein: 1.3, carbs: 27.0, fat: 0.3, category: 'Carbs' },

  // Healthy Fats
  { name: 'Avocado', portion: '1/2 medium (100g)', calories: 160, protein: 2.0, carbs: 8.5, fat: 14.7, category: 'Fats' },
  { name: 'Peanut Butter / Almond Butter', portion: '2 tbsp (32g)', calories: 190, protein: 8.0, carbs: 7.0, fat: 16.0, category: 'Fats' },
  { name: 'Olive Oil', portion: '1 tbsp (14g)', calories: 119, protein: 0, carbs: 0, fat: 13.5, category: 'Fats' },
  { name: 'Raw Almonds', portion: '28g (approx 23 nuts)', calories: 164, protein: 6.0, carbs: 6.1, fat: 14.2, category: 'Fats' },
  { name: 'Chia Seeds', portion: '1 tbsp (12g)', calories: 58, protein: 2.0, carbs: 5.0, fat: 3.7, category: 'Fats' },

  // Produce & Greens
  { name: 'Broccoli (Steamed)', portion: '150g', calories: 52, protein: 3.6, carbs: 10.5, fat: 0.6, category: 'Produce' },
  { name: 'Baby Spinach (Raw)', portion: '100g', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, category: 'Produce' },
  { name: 'Mixed Berries (Fresh)', portion: '1 cup (150g)', calories: 84, protein: 1.4, carbs: 20.0, fat: 0.6, category: 'Produce' },
  { name: 'Apple (Fresh)', portion: '1 medium (182g)', calories: 95, protein: 0.5, carbs: 25.0, fat: 0.3, category: 'Produce' },

  // Meals & Quick dishes
  { name: 'Chicken & Rice Meal Prep Bowl', portion: '1 container (350g)', calories: 480, protein: 44, carbs: 52, fat: 8, category: 'Meals' },
  { name: 'Salmon & Roasted Veggies Plate', portion: '1 plate (380g)', calories: 520, protein: 38, carbs: 32, fat: 22, category: 'Meals' },
  { name: 'Protein Berry Oatmeal Bowl', portion: '1 bowl (300g)', calories: 380, protein: 28, carbs: 54, fat: 6, category: 'Meals' },
  { name: 'Avocado Toast with 2 Poached Eggs', portion: '1 plate', calories: 420, protein: 20, carbs: 32, fat: 23, category: 'Meals' },
  { name: 'Turkey Wrap with Greens', portion: '1 wrap (220g)', calories: 360, protein: 32, carbs: 35, fat: 9, category: 'Meals' },
];

