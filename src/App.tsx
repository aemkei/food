import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { Shuffle, RefreshCw, ShoppingCart, Info } from 'lucide-react';
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
    const selected = [...selectedMeals];
    const targetSlotId = selected[index].slotId;
    
    // Create new instance of the meal with a new instanceId to trigger animation
    const newMeal = {
      ...chosenMeal,
      instanceId: `${chosenMeal.id}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      slotId: targetSlotId,
      isLocked: true
    };
    
    // Replace in place
    selected[index] = newMeal;
    
    setSelectedMeals(selected);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand flex flex-col items-center justify-center p-6 text-white">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        >
          <RefreshCw size={40} strokeWidth={3} />
        </motion.div>
      </div>
    );
  }

  const selectedIds = selectedMeals.map(m => m.id);

  return (
    <div className="min-h-screen bg-white flex flex-col relative selection:bg-brand selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-5 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Food</h1>
      </header>

      {/* Main Content */}
      <main className="w-full flex-1 flex flex-col pb-32">
        <div className="flex-1 bg-white overflow-hidden">
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
                  excludeIds={selectedIds}
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

        {/* Absolute Action Bar */}
        <div className="absolute bottom-8 left-0 right-0 px-4 flex items-center z-50 pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="group flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-full font-bold text-sm shadow-xl hover:bg-brand-dark active:scale-95 transition-all disabled:opacity-50 whitespace-nowrap"
            >
              <Shuffle className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Neu mischen</span>
            </button>
            <a 
              href="https://docs.google.com/spreadsheets/d/1ZPDo-WF5w-dCcSW6lZdveUeorxOynAv5IPUfkuPaioY/edit?gid=0#gid=0" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-brand text-[11px] font-bold uppercase tracking-wider hover:underline transition-color px-2 py-2 flex items-center justify-center whitespace-nowrap"
            >
              Originale Liste
            </a>

          </div>
        </div>
      </main>
    </div>
  );
}


