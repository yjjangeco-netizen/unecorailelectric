import React from 'react';
import { Star, Zap, Shield, X } from 'lucide-react';

interface StockStatusDisplayProps {
  status: string;
  showIcon?: boolean;
}

const StockStatusDisplay: React.FC<StockStatusDisplayProps> = ({ 
  status, 
  showIcon = true 
}) => {
  // 상태별 설정
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'new':
        return {
          text: '신품',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          icon: <Star className="h-3 w-3 text-yellow-500" />,
          borderColor: 'border-blue-200'
        };
      case 'used-new':
        return {
          text: '중고신품',
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          icon: <Zap className="h-3 w-3 text-red-500" />,
          borderColor: 'border-green-200'
        };
      case 'used-used':
        return {
          text: '중고사용품',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          icon: <Shield className="h-3 w-3 text-blue-500" />,
          borderColor: 'border-yellow-200'
        };
      case 'broken':
        return {
          text: '불량품',
          bgColor: 'bg-pink-100',
          textColor: 'text-pink-800',
          icon: <X className="h-3 w-3 text-red-500" />,
          borderColor: 'border-pink-200'
        };
      default:
        // 잘못된 값이나 빈값은 기본값으로 처리
        return {
          text: '신품',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          icon: <Star className="h-3 w-3 text-yellow-500" />,
          borderColor: 'border-blue-200'
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span className={`
      inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium
      ${config.bgColor} ${config.textColor} ${config.borderColor}
      border
    `}>
      {showIcon && config.icon}
      {config.text}
    </span>
  );
};

export default StockStatusDisplay;
