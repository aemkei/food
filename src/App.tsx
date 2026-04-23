import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, ShoppingCart, ChefHat, Info } from 'lucide-react';
import { fetchMeals, getRandomMeals, Meal } from './services/mealService';
import { MealCard } from './components/MealCard';

export default function App() {
  const [allMeals, setAllMeals] = useState<Meal[]>([]);
  const [selectedMeals, setSelectedMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const meals = await fetchMeals();
    setAllMeals(meals);
    setSelectedMeals(getRandomMeals(meals, 10));
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setSelectedMeals(getRandomMeals(allMeals, 10));
      setRefreshing(false);
    }, 400);
  };

  const handleRefreshSingle = (index: number) => {
    if (allMeals.length === 0) return;
    const newSelected = [...selectedMeals];
    // Find a new meal that isn't already selected to avoid duplicates if possible
    let newMeal = allMeals[Math.floor(Math.random() * allMeals.length)];
    const selectedIds = selectedMeals.map(m => m.id);
    
    // Try a few times to get a unique one if we have enough total meals
    if (allMeals.length > 5) {
      let attempts = 0;
      while (selectedIds.includes(newMeal.id) && attempts < 10) {
        newMeal = allMeals[Math.floor(Math.random() * allMeals.length)];
        attempts++;
      }
    }
    
    newSelected[index] = newMeal;
    setSelectedMeals(newSelected);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand flex flex-col items-center justify-center p-6 text-black">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        >
          <RefreshCw size={64} strokeWidth={3} />
        </motion.div>
        <h1 className="mt-8 text-4xl font-black uppercase tracking-tighter">LÄDT...</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col selection:bg-black selection:text-white">
      {/* Container without box */}
      <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 grid-cols-1 relative">
        
        {/* Left Pane - Brand/Header */}
        <div className="bg-brand p-8 lg:p-12 lg:min-h-screen flex flex-col justify-center text-black relative">
          <div>
            <h1 className="text-[18vw] lg:text-[160px] font-black leading-[0.75] uppercase tracking-[-0.08em]">
              ESSEN
            </h1>
          </div>
        </div>

        {/* Right Pane - Results */}
        <div className="bg-white p-6 lg:p-12 flex flex-col">
          <div className="flex-1">
            <div className="relative">
              <AnimatePresence mode="popLayout">
                {selectedMeals.length > 0 ? (
                  <div className="space-y-0">
                    {selectedMeals.map((meal, index) => (
                      <MealCard 
                        key={`${meal.id}-${index}`} 
                        meal={meal} 
                        index={index} 
                        onClick={() => handleRefreshSingle(index)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-20 text-center">
                    <p className="font-black italic text-gray-300 uppercase">Leer...</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Action Bar */}
          <div className="mt-8 flex flex-col sm:flex-row gap-6 items-center justify-center border-t-4 border-black p-8 lg:p-12 bg-gray-50">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="w-full sm:w-auto bg-black text-white px-10 py-5 text-xl font-black uppercase tracking-tight active:translate-y-1 transition-all disabled:opacity-50 hover:bg-brand hover:text-black cursor-pointer"
              id="refresh-button"
            >
              Neu Mischen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


