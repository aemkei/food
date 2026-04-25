import { useState, useEffect, useRef } from 'react';
import { Reorder, useMotionValue, AnimatePresence, motion } from 'motion/react';
import { Meal } from '../services/mealService';
import { GripVertical, Check, Search, X, Shuffle } from 'lucide-react';

function TypewriterText({ text, instanceId }: { text: string; instanceId?: string }) {
  const [displayedText, setDisplayedText] = useState(text);
  const lastInstanceId = useRef<string | undefined>(instanceId);

  useEffect(() => {
    // If instanceId matches our last seen ID, we don't restart animation
    // This prevents re-animation on mount/remount or re-ordering
    if (instanceId === lastInstanceId.current) {
      return;
    }
    
    lastInstanceId.current = instanceId;
    let index = 0;
    setDisplayedText('');
    let timeoutId: ReturnType<typeof setTimeout>;
    
    const typeNextChar = () => {
      if (index <= text.length) {
        setDisplayedText(text.slice(0, index));
        index++;
        
        // Randomize speed: approx 6-18ms base
        const isSpace = text[index - 1] === ' ';
        const delay = (isSpace ? 12 : 6) + Math.random() * 12;
        
        timeoutId = setTimeout(typeNextChar, delay);
      }
    };

    typeNextChar();
    return () => clearTimeout(timeoutId);
  }, [text, instanceId]);

  return <>{displayedText}</>;
}

export function MealCard({ 
  meal, 
  index, 
  onClick,
  onToggleLock,
  allMeals = [],
  onSelectMeal
}: { 
  meal: Meal; 
  index: number; 
  key?: string | number;
  allMeals?: Meal[];
  onSelectMeal?: (m: Meal) => void;
  onClick?: () => void;
  onToggleLock?: () => void;
}) {
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredMeals = searchQuery.trim() === '' 
    ? [] 
    : allMeals.filter(m => 
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        m.id !== meal.id
      ).slice(0, 5);

  useEffect(() => {
    if (isSearching && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSearching]);

  return (
    <Reorder.Item
      value={meal}
      id={meal.slotId!}
      className={`flex flex-col group transition-colors relative ${meal.isLocked ? 'bg-brand/5' : 'bg-white hover:bg-gray-50'}`}
    >
      <AnimatePresence>
        {isSearching && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed inset-0 bg-white z-[100] flex flex-col pt-4 px-4 overflow-hidden"
          >
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <Search size={22} className="text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Gericht suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setIsSearching(false);
                    setSearchQuery('');
                  }
                }}
                className="flex-1 bg-transparent border-none outline-none text-xl font-medium text-gray-800 placeholder:text-gray-300"
              />
              <button 
                onClick={() => {
                  setIsSearching(false);
                  setSearchQuery('');
                }}
                className="p-3 text-gray-400 bg-gray-50 rounded-full hover:bg-gray-100"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto pb-20">
              {filteredMeals.length > 0 ? (
                <div className="flex flex-col divide-y divide-gray-100">
                  {filteredMeals.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        onSelectMeal?.(m);
                        setIsSearching(false);
                        setSearchQuery('');
                      }}
                      className="text-left px-5 py-4 hover:bg-brand/5 text-gray-700 font-medium text-lg active:bg-brand/10 transition-colors"
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              ) : searchQuery.trim() !== '' ? (
                <div className="text-center py-20 text-gray-400 font-medium">
                  Keine Gerichte gefunden für "{searchQuery}"
                </div>
              ) : (
                <div className="text-center py-20 text-gray-400 font-medium italic">
                  Fang an zu tippen, um die Liste zu durchsuchen...
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-4 px-3 py-3">
          <div className="flex-shrink-0 flex items-center gap-2">
            <GripVertical className="text-gray-300 cursor-grab active:cursor-grabbing" size={20} />
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onToggleLock?.();
              }}
              className={`p-1.5 rounded-lg transition-all ${meal.isLocked ? 'text-brand bg-brand/10' : 'text-gray-300 hover:text-gray-400 hover:bg-gray-100'}`}
              aria-label={meal.isLocked ? "Entsperren" : "Sperren"}
            >
              <Check size={20} strokeWidth={meal.isLocked ? 3 : 2} />
            </button>
          </div>
          
          <div 
            className="flex-1 min-w-0 cursor-pointer py-1" 
            onDoubleClick={() => !meal.isLocked && setIsSearching(true)}
          >
            <h3 className={`text-lg font-semibold tracking-tight transition-colors truncate ${meal.isLocked ? 'text-brand' : 'text-gray-800'}`}>
              <TypewriterText text={meal.name} instanceId={meal.instanceId} />
            </h3>
          </div>

          <div className="flex items-center gap-1.5 whitespace-nowrap">
            {!meal.isLocked && (
              <>
                <button 
                  onClick={onClick} 
                  className="p-3 rounded-xl text-gray-400 bg-gray-50 active:bg-gray-100 transition-colors"
                  aria-label="Neu würfeln"
                >
                  <Shuffle size={18} />
                </button>
                <button 
                  onClick={() => setIsSearching(true)}
                  className="p-3 rounded-xl text-gray-400 bg-gray-50 active:bg-gray-100 transition-colors"
                  aria-label="Suchen"
                >
                  <Search size={18} />
                </button>
              </>
            )}
          </div>
        </div>
    </Reorder.Item>
  );
}


