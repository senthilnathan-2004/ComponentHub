import React from "react";
import TopRatedCard from "./TopRatedCard";

const TopRatedSection = ({ components, loading }) => {
  if (loading) {
    return (
      <div className="top-rated-section">
        <h2 className="top-rated-section-title">Top Rated Components</h2>
        <div className="top-rated-scroll-container">
          <div className="top-rated-loading-skeletons">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="top-rated-skeleton-card">
                <div className="top-rated-skeleton-image"></div>
                <div className="top-rated-skeleton-content">
                  <div className="top-rated-skeleton-title"></div>
                  <div className="top-rated-skeleton-stats"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!components || components.length === 0) {
    return null;
  }

  return (
    <div className="top-rated-section">
      <h2 className="top-rated-section-title">Top Rated Components</h2>
      <div className="top-rated-scroll-container">
        <div className="top-rated-scroll-track">
          {components.map((component) => (
            <TopRatedCard 
              key={component._id} 
              component={component} 
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TopRatedSection;
