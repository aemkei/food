import { motion } from 'motion/react';
import { Meal } from '../services/mealService';

export function MealCard({ 
  meal, 
  index, 
  onClick 
}: { 
  meal: Meal; 
  index: number; 
  key?: string | number;
  onClick?: () => void;
}) {
  const number = (index + 1).toString().padStart(2, '0');
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className="flex items-baseline py-4 border-b-4 border-black group last:border-b-0 cursor-pointer active:scale-95 transition-all"
      id={`meal-card-${meal.id}`}
    >
      <span className="font-black text-xl mr-4 min-w-[32px] text-black/40 group-hover:text-brand transition-colors">
        {number}
      </span>
      <div className="flex-1">
        <h3 className="font-black text-2xl uppercase tracking-tighter leading-none text-black break-words">
          {meal.name}
        </h3>
      </div>
    </motion.div>
  );
}


