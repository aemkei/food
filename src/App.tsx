import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
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
    // Add slotId to ensure stable keys during reordering and remixing
    const initial = getRandomMeals(meals, 10).map((m, i) => ({ 
      ...m, 
      instanceId: `${m.id}-${Date.now()}-${i}`,
      slotId: `slot-${i}`
    }));
    setSelectedMeals(initial);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      const lockedMeals = selectedMeals.filter(m => m.isLocked);
      const lockedIds = new Set(lockedMeals.map(m => m.id));
      
      const neededCount = 10 - lockedMeals.length;
      const availablePool = allMeals.filter(m => !lockedIds.has(m.id));
      const newRandoms = getRandomMeals(availablePool, neededCount);
      
      let newRandomIndex = 0;
      const refreshed = selectedMeals.map((m, i) => {
        if (m.isLocked) return m;
        const nextMeal = newRandoms[newRandomIndex++];
        if (!nextMeal) return m; 
        return { 
          ...nextMeal, 
          instanceId: `${nextMeal.id}-${Date.now()}-${newRandomIndex}`,
          slotId: m.slotId // Keep the slot stable
        };
      });

      setSelectedMeals(refreshed);
      setRefreshing(false);
    }, 400);
  };

  const handleToggleLock = (index: number) => {
    const newSelected = [...selectedMeals];
    newSelected[index] = { ...newSelected[index], isLocked: !newSelected[index].isLocked };
    setSelectedMeals(newSelected);
  };

  const handleRefreshSingle = (index: number) => {
    if (allMeals.length === 0 || selectedMeals[index]?.isLocked) return;
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
    
    newSelected[index] = { 
      ...newMeal, 
      instanceId: `${newMeal.id}-${Date.now()}`,
      slotId: selectedMeals[index].slotId // Keep the slot stable
    };
    setSelectedMeals(newSelected);
  };

  const handleManualSelect = (index: number, chosenMeal: Meal) => {
    const newSelected = [...selectedMeals];
    newSelected[index] = {
      ...chosenMeal,
      instanceId: `${chosenMeal.id}-${Date.now()}`,
      slotId: selectedMeals[index].slotId,
      isLocked: true
    };
    setSelectedMeals(newSelected);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand flex flex-col items-center justify-center p-6 text-white">
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
    <div className="min-h-screen bg-[#fafafa] flex flex-col items-center selection:bg-brand selection:text-white pb-20">
      {/* Header */}
      <header className="w-full max-w-2xl px-6 py-12 flex flex-col items-center text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">
          Abendessen
        </h1>
        <p className="text-gray-500 font-medium tracking-tight">
          Zehn zufällige Vorschläge für heute.
        </p>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-2xl px-6">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mb-8">
          <Reorder.Group 
            axis="y" 
            values={selectedMeals} 
            onReorder={setSelectedMeals}
            className="divide-y divide-gray-100"
          >
            {selectedMeals.length > 0 ? (
              selectedMeals.map((meal, index) => (
                <MealCard 
                  key={meal.slotId} 
                  meal={meal} 
                  index={index} 
                  allMeals={allMeals}
                  onSelectMeal={(m) => handleManualSelect(index, m)}
                  onClick={() => handleRefreshSingle(index)}
                  onToggleLock={() => handleToggleLock(index)}
                />
              ))
            ) : (
              <div className="py-20 text-center">
                <p className="text-gray-300 font-medium">Lade Vorschläge...</p>
              </div>
            )}
          </Reorder.Group>
        </div>

        {/* Action Button */}
        <div className="flex justify-center">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="group relative flex items-center gap-2 bg-brand text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg shadow-brand/30 hover:shadow-brand/40 active:scale-95 transition-all disabled:opacity-50 cursor-pointer overflow-hidden"
            id="refresh-button"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
            <span>Alle neu mischen</span>
          </button>
        </div>

        {/* Spreadsheet Link */}
        <div className="mt-12 text-center pb-8">
          <a 
            href="https://docs.google.com/spreadsheets/d/1ZPDo-WF5w-dCcSW6lZdveUeorxOynAv5IPUfkuPaioY/edit?gid=0#gid=0" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-brand text-xs font-semibold uppercase tracking-wider transition-colors inline-flex items-center gap-2"
          >
            <span>Originale Liste öffnen</span>
            <Info size={14} />
          </a>
        </div>
      </main>
    </div>
  );
}


