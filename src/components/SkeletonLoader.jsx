import React from 'react';

export const Skeleton = ({ className = '', style = {} }) => (
  <div className={`skeleton ${className}`} style={style} />
);

export const StatCardSkeleton = () => (
  <div className="card">
    <Skeleton className="h-4 w-24 mb-3" />
    <Skeleton className="h-8 w-32 mb-1" />
    <Skeleton className="h-3 w-20" />
  </div>
);

export const BookingRowSkeleton = () => (
  <div className="flex items-center gap-3 py-3 border-b border-gray-50">
    <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
    <Skeleton className="h-6 w-16 rounded-full" />
  </div>
);

export const PropertyCardSkeleton = () => (
  <div className="card space-y-3">
    <div className="flex items-start gap-3">
      <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
    <Skeleton className="h-9 w-full rounded-xl" />
  </div>
);

export const DashboardSkeleton = () => (
  <div className="space-y-6 animate-fade-in">
    <div className="grid grid-cols-2 gap-3">
      {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
    </div>
    <div className="card space-y-2">
      {[...Array(5)].map((_, i) => <BookingRowSkeleton key={i} />)}
    </div>
  </div>
);

export default Skeleton;
