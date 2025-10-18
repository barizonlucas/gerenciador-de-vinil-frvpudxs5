-- Create the vinyl_records table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.vinyl_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    "albumTitle" TEXT NOT NULL,
    artist TEXT NOT NULL,
    "releaseYear" INTEGER,
    genre TEXT,
    "coverArtUrl" TEXT,
    condition TEXT CHECK (condition IN ('Novo', 'Excelente', 'Bom', 'Regular', 'Ruim')),
    "purchaseDate" DATE,
    price NUMERIC,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Function to update the updated_at column
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists, then create it
DROP TRIGGER IF EXISTS on_vinyl_records_updated ON public.vinyl_records;
CREATE TRIGGER on_vinyl_records_updated
BEFORE UPDATE ON public.vinyl_records
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();
