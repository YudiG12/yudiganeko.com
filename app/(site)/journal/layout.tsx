import SearchPalette from "@/components/journal/search-palette";

// Chrome do Journal: o logo vem do layout do site; aqui só entra a busca no canto direito.
export default function JournalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="gj-motion">
      <div className="absolute right-4 top-4 z-50 sm:fixed sm:top-5">
        <SearchPalette />
      </div>
      {children}
    </div>
  );
}
