export const Footer = () => {
  return (
    <footer className="w-full border-t border-border/50 bg-secondary/50 mt-auto">
      <div className="container mx-auto flex h-16 items-center justify-center px-4 md:px-6">
        <p className="text-sm text-secondary-foreground">
          © {new Date().getFullYear()} Teko.
        </p>
      </div>
    </footer>
  )
}
