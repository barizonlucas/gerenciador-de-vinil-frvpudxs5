export const Footer = () => {
  return (
    <footer className="mt-auto w-full border-t border-border bg-azulPetroleo text-areia shadow-brand">
      <div className="container mx-auto flex h-16 items-center justify-center px-4 md:px-6">
        <p className="text-sm text-areia/80">
          © {new Date().getFullYear()} Teko.
        </p>
      </div>
    </footer>
  )
}
