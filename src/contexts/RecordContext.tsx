import { createContext, useContext, useState } from 'react';

interface RecordContextType {
  currentRecord: {
    artist: string;
    album: string;
    year: number | string;
  } | null;
  setCurrentRecord: (record: any) => void;
}

const RecordContext = createContext<RecordContextType>({
  currentRecord: null,
  setCurrentRecord: () => {}
});

export function RecordProvider({ children }: { children: React.ReactNode }) {
  const [currentRecord, setCurrentRecord] = useState<RecordContextType['currentRecord']>(null);

  return (
    <RecordContext.Provider value={{ currentRecord, setCurrentRecord }}>
      {children}
    </RecordContext.Provider>
  );
}

export const useRecord = () => useContext(RecordContext);