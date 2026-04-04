import React from 'react';

const Shimmer = ({ width = '100%', height = '20px', borderRadius = '8px', className = '', style = {} }) => {
  return (
    <div 
      className={`shimmer-effect ${className}`} 
      style={{ 
        width, 
        height, 
        borderRadius, 
        ...style 
      }} 
    />
  );
};

export default Shimmer;
