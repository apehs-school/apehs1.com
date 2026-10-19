export const mealCategories = ["Breakfast", "Lunch period", "Main Dish", "Vegetables", "Snack", "Beverage"] as const;

export function isMealCategory(value: string): value is (typeof mealCategories)[number] {
  return mealCategories.includes(value as (typeof mealCategories)[number]);
}
