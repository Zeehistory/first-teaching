import { useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";
import HomePage from "@/components/HomePage";
import SearchOverlay from "@/components/SearchOverlay";
import { Button } from "@/components/ui/button";
import { volumes } from "@/lib/volumes";

export default function Volume() {
  const [, params] = useRoute("/v/:volumeNumber");
  const [, setLocation] = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const volumeNumber = params?.volumeNumber ? parseInt(params.volumeNumber, 10) : NaN;
  const volume = volumes.find((entry) => entry.number === volumeNumber);
  const availableBooks = useMemo(
    () => volumes.filter((entry) => entry.data).map((entry) => entry.data!),
    []
  );

  if (!volume) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-xl">
          <h1 className="text-3xl font-heading mb-4">Volume Not Found</h1>
          <p className="text-muted-foreground mb-6">
            We couldn&apos;t locate the requested volume. Please return to the main library to
            explore the available titles.
          </p>
          <Button onClick={() => setLocation("/")}>Back to Volume Library</Button>
        </div>
      </div>
    );
  }

  if (!volume.data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-xl space-y-4">
          <h1 className="text-3xl font-heading">{volume.title}</h1>
          {volume.subtitle && (
            <p className="text-xl text-muted-foreground font-heading italic">
              {volume.subtitle}
            </p>
          )}
          <p className="text-muted-foreground leading-relaxed">{volume.description}</p>
          <Button onClick={() => setLocation("/")}>Back to Volume Library</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <HomePage
        bookData={volume.data}
        onChapterClick={(chapterId) =>
          setLocation(`/v/${volume.data?.volumeNumber}/${chapterId}`)
        }
        onSearchClick={() => setIsSearchOpen(true)}
        onBackToLibrary={() => setLocation("/")}
      />
      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        bookData={volume.data}
        availableVolumes={availableBooks}
        onResultClick={(volumeNo, chapterId, sectionId, term) => {
          const params = new URLSearchParams();
          params.set("s", sectionId);
          if (term) params.set("h", term);
          const query = params.toString();
          setLocation(`/v/${volumeNo}/${chapterId}?${query}`);
          setIsSearchOpen(false);
        }}
      />
    </>
  );
}
