-- Create the vinyl_records table
CREATE TABLE public.vinyl_records (
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

-- Enable Row Level Security
ALTER TABLE public.vinyl_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow users to see their own records"
ON public.vinyl_records
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert their own records"
ON public.vinyl_records
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own records"
ON public.vinyl_records
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own records"
ON public.vinyl_records
FOR DELETE
USING (auth.uid() = user_id);

-- Function to update the updated_at column
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update the updated_at timestamp
CREATE TRIGGER on_vinyl_records_updated
BEFORE UPDATE ON public.vinyl_records
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();
