import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.tsx';
import { Skeleton } from '../ui/Skeleton.tsx';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#F7F8FC] dark:bg-[#0B0E17]">
        <div className="w-full max-w-md space-y-4">
          <div className="flex items-center gap-3 justify-center mb-6">
            <Skeleton variant="rounded" className="w-10 h-10" />
            <Skeleton variant="rounded" className="w-32 h-6" />
          </div>
          <Skeleton variant="rounded" className="w-full h-24" />
          <Skeleton variant="rounded" className="w-full h-12" />
          <Skeleton variant="rounded" className="w-full h-12" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
