import React from "react";
import { Link } from "react-router-dom";

const TopRatedCard = ({ component }) => {
  const {
    _id,
    title,
    price,
    averageRating,
    downloads,
    screenshots,
    slug,
  } = component;

  const imageUrl = screenshots && screenshots.length > 0 
    ? screenshots[0] 
    : "/placeholder.svg?height=120&width=220&query=component+preview";

  const renderStars = (rating = 0) => {
    const stars = [];
    const r = Math.max(0, Math.min(5, Number(rating) || 0));
    const fullStars = Math.floor(r);
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={i} className="top-rated-star">★</span>);
    }
    
    const emptyStars = 5 - fullStars;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} className="top-rated-star-empty">☆</span>);
    }
    
    return stars;
  };

  return (
    <Link 
      to={`/components/${slug || _id}`}
      className="top-rated-card-link"
    >
      <div className="top-rated-card">
        <div className="top-rated-card-image">
          <img 
            src={imageUrl} 
            alt={title}
            onError={(e) => {
              e.target.src = "/placeholder.svg?height=120&width=220&query=component+preview";
            }}
          />
        </div>
        
        <div className="top-rated-card-content">
          <h3 className="top-rated-card-title" title={title}>
            {title}
          </h3>
          
          <div className="top-rated-card-rating">
            {renderStars(averageRating)}
            <span className="top-rated-rating-number">({averageRating.toFixed(1)})</span>
          </div>
          
          <div className="top-rated-card-stats">
            <span className="top-rated-downloads">⬇ {downloads.toLocaleString()}</span>
            <span className="top-rated-price">${price.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default TopRatedCard;
