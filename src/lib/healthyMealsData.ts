export interface HealthyMeal {
  id: string;
  name: string;
  mealType: 'sarapan' | 'makan_siang' | 'makan_malam' | 'snack';
  category: 'high_protein' | 'low_calorie' | 'healthy_snack' | 'balanced_meal';
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  description: string;
  recipeTips: string;
  iconEmoji: string;
}

export const HEALTHY_MEALS_DATABASE: HealthyMeal[] = [
  {
    id: 'meal_1',
    name: 'Dada Ayam Panggang Herb & Nasi Merah',
    mealType: 'makan_siang',
    category: 'high_protein',
    calories: 380,
    protein: 42,
    carbs: 35,
    fat: 6,
    description: '150g Dada ayam tanpa kulit di-marinate lada hitam & bumbu oregano, disajikan dengan 100g nasi merah kukus.',
    recipeTips: 'Gunakan pan anti lengket dengan spray minyak zaitun tipis.',
    iconEmoji: '🍗'
  },
  {
    id: 'meal_2',
    name: 'Omelet Putih Telur & Bayam Kukus',
    mealType: 'sarapan',
    category: 'high_protein',
    calories: 210,
    protein: 28,
    carbs: 6,
    fat: 5,
    description: '4 butir putih telur + 1 telur utuh didadar dengan segenggam bayam segar dan tomat potong.',
    recipeTips: 'Tambahkan sedikit garam oregano & lada hitam untuk cita rasa gurih tanpa kalori berlebih.',
    iconEmoji: '🍳'
  },
  {
    id: 'meal_3',
    name: 'Pepes Ikan Mas / Gurame Bumbu Kuning',
    mealType: 'makan_siang',
    category: 'balanced_meal',
    calories: 320,
    protein: 36,
    carbs: 8,
    fat: 10,
    description: '150g Ikan segar dibumbui kunyit, kemiri, daun kemangi, lalu dikukus bungkus daun pisang.',
    recipeTips: 'Kukus 25 menit agar bumbu meresap sempurna tanpa perlu memakai minyak goreng.',
    iconEmoji: '🐟'
  },
  {
    id: 'meal_4',
    name: 'Sup Bening Daging Sapi Tanpa Lemak & Wortel',
    mealType: 'makan_malam',
    category: 'high_protein',
    calories: 290,
    protein: 32,
    carbs: 12,
    fat: 8,
    description: '120g Daging sapi tenderloin/has dalam dipotong dadu direbus dalam kuah rempah bening dengan wortel & seledri.',
    recipeTips: 'Buang lapisan minyak mengapung di permukaan kuah sup untuk memangkas lemak ekstra.',
    iconEmoji: '🥣'
  },
  {
    id: 'meal_5',
    name: 'Tahu & Tempe Bacem Kukus (Tanpa Goreng)',
    mealType: 'makan_siang',
    category: 'low_calorie',
    calories: 180,
    protein: 16,
    carbs: 18,
    fat: 6,
    description: '2 potong tahu & 2 potong tempe dibumbui air kelapa, ketumbar, dan gula jawa tipis, lalu dikukus hingga meresap.',
    recipeTips: 'Sangat nikmat disajikan bersama sambal bajak rendah minyak.',
    iconEmoji: '🫘'
  },
  {
    id: 'meal_6',
    name: 'Gado-Gado Sehat Tanpa Kerupuk & Bumbu Kacang Terukur',
    mealType: 'makan_siang',
    category: 'balanced_meal',
    calories: 340,
    protein: 20,
    carbs: 32,
    fat: 12,
    description: 'Sayuran rebus (kangkung, tauge, labu siam), 1 telur rebus utuh, tahu kukus, dan 2 sdm bumbu kacang encer.',
    recipeTips: 'Ganti kerupuk dengan emping seperlunya atau lewati kerupuk untuk hemat 100+ kcal.',
    iconEmoji: '🥗'
  },
  {
    id: 'meal_7',
    name: 'Edamame Rebus Segar',
    mealType: 'snack',
    category: 'healthy_snack',
    calories: 140,
    protein: 12,
    carbs: 10,
    fat: 5,
    description: '100g Kedelai edamame rebus dengan taburan garam laut tipis.',
    recipeTips: 'Camilan kaya serat & protein tinggi yang sangat praktis.',
    iconEmoji: '🫛'
  },
  {
    id: 'meal_8',
    name: 'Sate Ayam Tanpa Bumbu Kacang Berlebih (Sate Taichan)',
    mealType: 'makan_malam',
    category: 'high_protein',
    calories: 260,
    protein: 38,
    carbs: 4,
    fat: 7,
    description: '10 tusuk Sate dada ayam bakar dibumbui perasan jeruk nipis & garam, disajikan dengan sambal rawit ulek.',
    recipeTips: 'Pilih daging dada polos tanpa lemak atau kulit.',
    iconEmoji: '🍢'
  },
  {
    id: 'meal_9',
    name: 'Yogurt Greek Low-Fat & Buah Berry / Pisang',
    mealType: 'snack',
    category: 'healthy_snack',
    calories: 160,
    protein: 15,
    carbs: 20,
    fat: 2,
    description: '150g Greek yogurt original tanpa gula ditaburi 50g strawberry segar atau pisang iris.',
    recipeTips: 'Sumber kalsium dan pro-biotik pencernaan yang menyegarkan.',
    iconEmoji: '🫐'
  },
  {
    id: 'meal_10',
    name: 'Whey Protein Shake & Air Dingin',
    mealType: 'snack',
    category: 'high_protein',
    calories: 130,
    protein: 25,
    carbs: 3,
    fat: 1.5,
    description: '1 scoop Whey Protein Isolate dikocok dengan 300ml air es setelah latihan.',
    recipeTips: 'Cara paling praktis memenuhi kekurangan protein harian tanpa kalori berlebih.',
    iconEmoji: '🥤'
  }
];

export function getRecommendedMeals(
  remainingCalories: number,
  remainingProtein: number,
  categoryFilter: string = 'all'
): HealthyMeal[] {
  return HEALTHY_MEALS_DATABASE.filter(meal => {
    // Check Category Filter
    if (categoryFilter !== 'all' && meal.category !== categoryFilter) {
      return false;
    }

    // If remaining calories is low (< 200), prioritize low-calorie snacks
    if (remainingCalories < 200) {
      return meal.calories <= Math.max(250, remainingCalories + 50);
    }

    // Otherwise, recommend meals that fit within remaining calories
    return meal.calories <= remainingCalories + 100;
  }).sort((a, b) => {
    // Prioritize higher protein efficiency (protein per calorie)
    const ratioA = a.protein / a.calories;
    const ratioB = b.protein / b.calories;
    return ratioB - ratioA;
  });
}
