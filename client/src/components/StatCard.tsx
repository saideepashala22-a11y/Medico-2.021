import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  iconColor: string;
  isLoading: boolean;
}

// Enhanced stat card with modern glass morphism design
export const StatCard = memo(({ title, value, icon: Icon, iconColor, isLoading }: StatCardProps) => {
  return (
    <Card className="stat-card-enhanced group">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-3xl font-bold gradient-text">
              {isLoading ? (
                <div className="skeleton-modern h-8 w-16 rounded"></div>
              ) : (
                <span className="animate-fade-in">{value || 0}</span>
              )}
            </p>
          </div>
          <div className="ml-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 group-hover:from-blue-100 group-hover:to-indigo-100 transition-all duration-300">
              <Icon className={`h-7 w-7 ${iconColor} float-icon`} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

StatCard.displayName = 'StatCard';