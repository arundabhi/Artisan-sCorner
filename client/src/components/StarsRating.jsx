import React from 'react';
import { Star, StarHalf } from 'lucide-react';

const StarsRating = ({ rating, size = 16, interactive = false, onChange }) => {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 !== 0;
  const total = 5;

  const starsArray = [];
  for (let i = 1; i <= total; i++) {
    if (interactive) {
      starsArray.push(
        <button
          key={i}
          type="button"
          onClick={() => onChange && onChange(i)}
          className="text-amber-400 hover:scale-110 transition-transform focus:outline-none"
        >
          <Star
            size={size}
            className={i <= rating ? 'fill-amber-400 text-amber-400' : 'text-artisanal-300'}
          />
        </button>
      );
    } else {
      if (i <= fullStars) {
        starsArray.push(<Star key={i} size={size} className="fill-amber-400 text-amber-400" />);
      } else if (i === fullStars + 1 && hasHalf) {
        starsArray.push(
          <div key={i} className="relative inline-block">
            <StarHalf size={size} className="fill-amber-400 text-amber-400 absolute top-0 left-0" />
            <Star size={size} className="text-artisanal-300" />
          </div>
        );
      } else {
        starsArray.push(<Star key={i} size={size} className="text-artisanal-300" />);
      }
    }
  }

  return <div className="flex items-center gap-0.5">{starsArray}</div>;
};

export default StarsRating;
