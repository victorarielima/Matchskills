import React from 'react';
import './animated-logo.css';

interface AnimatedLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  layout?: 'horizontal' | 'vertical';
}

const AnimatedLogo: React.FC<AnimatedLogoProps> = ({ 
  size = 'md', 
  showText = true, 
  className = '',
  layout = 'vertical'
}) => {
  const sizeClasses = {
    sm: 'w-16 h-16', // 64px
    md: 'w-20 h-20', // 80px  
    lg: 'w-32 h-32'  // 128px
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl', 
    lg: 'text-4xl'
  };

  const containerClasses = layout === 'horizontal' 
    ? 'flex items-center space-x-3' 
    : 'flex flex-col items-center space-y-2';

  return (
    <div className={`${containerClasses} ${className}`}>
      <div className={`matchskills-logo ${sizeClasses[size]}`}>
        <div className="icon-section">
          <div className="brain-core"></div>
          
          <div className="skill-node node-1"></div>
          <div className="skill-node node-2"></div>
          <div className="skill-node node-3"></div>
          <div className="skill-node node-4"></div>
          
          <div className="connection connect-1"></div>
          <div className="connection connect-2"></div>
          <div className="connection connect-3"></div>
          <div className="connection connect-4"></div>
        </div>
      </div>
      
      {showText && (
        <div className="text-section text-center">
          <h1 className={`brand-name ${textSizeClasses[size]}`}>MatchSkills</h1>
        </div>
      )}
    </div>
  );
};

export default AnimatedLogo;
