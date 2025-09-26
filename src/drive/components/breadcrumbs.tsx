'use client';

import { ChevronRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BreadcrumbItem } from '../types/google-drive';
import { cn } from '@/lib/utils';

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  onNavigate: (folderId: string | null) => void;
  loading?: boolean;
}

export function Breadcrumbs({ items, onNavigate, loading = false }: BreadcrumbsProps) {
  // Always render the container to prevent layout shift
  return (
    <nav aria-label="Breadcrumb" className="flex items-center space-x-1 text-sm min-h-[32px]">
      {loading ? (
        // Show skeleton while loading
        <div className="flex items-center space-x-2">
          <Skeleton className="h-6 w-6" />
          <Skeleton className="h-6 w-20" />
        </div>
      ) : items.length > 0 ? (
        // Show breadcrumbs when available
        items.map((item, index) => (
          <div key={item.id} className="flex items-center">
            {index > 0 && <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground" />}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (index === 0 && item.id === 'root') {
                  onNavigate(null);
                } else {
                  onNavigate(item.id);
                }
              }}
              className={cn(
                "px-2 py-1 h-auto",
                index === items.length - 1 && "font-semibold text-foreground"
              )}
            >
              {index === 0 && <Home className="h-3 w-3 mr-1" />}
              {item.name}
            </Button>
          </div>
        ))
      ) : (
        // Show root/home when no breadcrumbs
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate(null)}
          className="px-2 py-1 h-auto font-semibold text-foreground"
        >
          <Home className="h-3 w-3 mr-1" />
          My Drive
        </Button>
      )}
    </nav>
  );
}