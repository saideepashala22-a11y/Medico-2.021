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

// Memoized stat card component to prevent unnecessary re-renders
export const StatCard = memo(({ title, value, icon: Icon, iconColor, isLoading }: StatCardProps) => {
  return (
    <Card className="hover-scale animate-fade-in">
      <CardContent className="pt-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Icon className={`h-8 w-8 ${iconColor} animate-bounce-gentle`} />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-medical-text-muted">{title}</p>
            <p className="text-2xl font-bold text-medical-text">
              {isLoading ? (
                <span className="animate-pulse-subtle">...</span>
              ) : (
                <span className="animate-fade-in">{value || 0}</span>
              )}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

StatCard.displayName = 'StatCard';