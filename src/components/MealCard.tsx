import { useState, useEffect, useRef } from 'react';
import { Reorder, useMotionValue, AnimatePresence, motion } from 'motion/react';
import { Meal } from '../services/mealService';
import { GripVertical, Lock, Unlock, Search, X, Shuffle } from 'lucide-react';

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
  const number = (index + 1).toString().padStart(2, '0');
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
      {isSearching ? (
        <div className="flex flex-col px-3 py-4 bg-white border-b border-gray-100 shadow-sm z-10">
          <div className="flex items-center gap-3">
            <Search size={18} className="text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setIsSearching(false);
                  setSearchQuery('');
                }
              }}
              className="flex-1 bg-transparent border-none outline-none text-lg font-medium text-gray-800 placeholder:text-gray-300"
            />
            <button 
              onClick={() => {
                setIsSearching(false);
                setSearchQuery('');
              }}
              className="p-2 text-gray-400 rounded-full hover:bg-gray-50"
            >
              <X size={20} />
            </button>
          </div>
          
          {filteredMeals.length > 0 && (
            <div className="absolute top-full left-4 right-4 mt-2 bg-white border border-gray-100 shadow-2xl z-[70] rounded-2xl flex flex-col gap-1 overflow-hidden p-1">
              {filteredMeals.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    onSelectMeal?.(m);
                    setIsSearching(false);
                    setSearchQuery('');
                  }}
                  className="text-left px-4 py-3 rounded-xl hover:bg-brand/5 text-gray-700 font-medium active:bg-brand/10 transition-colors pointer-events-auto"
                >
                  {m.name}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-4 px-3 py-3">
          <div className="flex-shrink-0 flex items-center gap-2">
            <GripVertical className="text-gray-300 cursor-grab active:cursor-grabbing" size={20} />
            <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold transition-colors ${meal.isLocked ? 'bg-brand border-brand text-white' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
              {number}
            </div>
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
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onToggleLock?.();
              }}
              className={`p-3 rounded-xl transition-all ${meal.isLocked ? 'text-brand bg-brand/10' : 'text-gray-400 bg-gray-50 active:bg-gray-100'}`}
              aria-label={meal.isLocked ? "Entsperren" : "Sperren"}
            >
              {meal.isLocked ? <Lock size={20} /> : <Unlock size={20} />}
            </button>
          </div>
        </div>
      )}
    </Reorder.Item>
  );
}


