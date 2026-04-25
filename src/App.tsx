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
    
    // Remove the item at the current position
    selected.splice(index, 1);
    // Add it to the front
    selected.unshift(newMeal);
    
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

  return (
    <div className="min-h-screen bg-white flex flex-col relative selection:bg-brand selection:text-white">
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
        <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-4 z-50 pointer-events-none">
          <a 
            href="https://docs.google.com/spreadsheets/d/1ZPDo-WF5w-dCcSW6lZdveUeorxOynAv5IPUfkuPaioY/edit?gid=0#gid=0" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-brand text-[10px] font-bold uppercase tracking-wider bg-white/80 backdrop-blur px-3 py-1 rounded-full border border-gray-100 shadow-sm transition-colors pointer-events-auto"
          >
            Originale Liste
          </a>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="group flex items-center gap-3 bg-brand text-white px-8 py-4 rounded-full font-bold shadow-2xl hover:bg-brand-dark active:scale-95 transition-all disabled:opacity-50 pointer-events-auto"
          >
            <Shuffle className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Neu mischen</span>
          </button>
        </div>
      </main>
    </div>
  );
}


