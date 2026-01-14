// components/MovieCard.jsx
import React from 'react';


const MovieCard = ({ thumbnail, title, description, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="w-full bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 transition-all hover:border-zinc-600">
      {/* Image Container: Aspect-video maintains 16:9 ratio */}
      <div className="aspect-video w-full bg-zinc-800">
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Text Content */}
      <div className="p-4">
        {/* truncate prevents text from wrapping or breaking the card width */}
        <h3 className="text-white font-bold text-sm truncate uppercase tracking-wide">
          {title}
        </h3>
        <p className="text-zinc-400 text-xs truncate mt-2">
          {description}
        </p>
      </div>
    </div>
  );
};

export default MovieCard;
