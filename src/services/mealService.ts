export interface Meal {
  id: string;
  name: string;
}

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQdrKhNWPbVMbRLZNnxjYofW9XgH4SEGM221Cte5mDEOqHddg1eZZ9yhf1mGEkiBZaAuLd3MonMubRM/pub?output=csv';

export async function fetchMeals(): Promise<Meal[]> {
  try {
    const response = await fetch(SHEET_URL);
    if (!response.ok) {
      throw new Error('Fehler beim Laden der Daten');
    }
    const csvData = await response.text();
    
    // Simple CSV parser (assuming first row is header "Essen")
    const lines = csvData.split('\n');
    const meals: Meal[] = lines
      .slice(1) // Skip header
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map((name, index) => ({
        id: `meal-${index}`,
        name: name.replace(/^"(.*)"$/, '$1') // Remove quotes if present
      }));
      
    return meals;
  } catch (error) {
    console.error('Error fetching meals:', error);
    return [];
  }
}

export function getRandomMeals(meals: Meal[], count: number): Meal[] {
  if (meals.length === 0) return [];
  const shuffled = [...meals].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, meals.length));
}
