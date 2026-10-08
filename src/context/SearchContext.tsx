import React, { createContext, useContext, useState } from 'react';

interface SearchContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  openNewAppModal: (stage?: string) => void;
  isNewAppModalOpen: boolean;
  setIsNewAppModalOpen: (open: boolean) => void;
  defaultNewAppStage: string;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewAppModalOpen, setIsNewAppModalOpen] = useState(false);
  const [defaultNewAppStage, setDefaultNewAppStage] = useState('saved');

  const openNewAppModal = (stage: string = 'saved') => {
    setDefaultNewAppStage(stage);
    setIsNewAppModalOpen(true);
  };

  return (
    <SearchContext.Provider
      value={{
        searchQuery,
        setSearchQuery,
        openNewAppModal,
        isNewAppModalOpen,
        setIsNewAppModalOpen,
        defaultNewAppStage,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};
