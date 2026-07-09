"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { Carousel_002 } from "@/components/ui/skiper-ui/skiper48";
import type { Memory } from "@/lib/database.types";
import { listMemories, uploadMemory } from "@/lib/memories";

export function MemoriesPage() {
  const [memories, setMemories] = useState<Memory[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;

    listMemories()
      .then((data) => {
        if (!cancelled) setMemories(data);
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError("The memory book would not open. Try refreshing.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError("");

    try {
      const memory = await uploadMemory(file, "");
      setMemories((prev) => [memory, ...(prev ?? [])]);
    } catch {
      setUploadError("That photo would not upload. Try again?");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  return (
    <main className="keepsake-shell">
      <section className="keepsake-letter">
        <div className="keepsake-ornament" aria-hidden="true">
          ❦
        </div>
        <p className="eyebrow">For Yasya</p>
        <h1 className="keepsake-headline">Thank You For Being So Cool</h1>
      </section>

      <section className="keepsake-passport">
        <div className="passport-card">
          <div className="passport-header">
            <span className="passport-kicker">Official Document</span>
            <h2>Certificate of Coolness</h2>
          </div>
          <div className="passport-body">
            <div className="passport-photo">
              <img src="/yasya/1.jpeg" alt="Yasya" />
            </div>
            <dl className="passport-fields">
              <div>
                <dt>Name</dt>
                <dd>Yasya</dd>
              </div>
              <div>
                <dt>Title</dt>
                <dd>Certified Cool Person</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>Amazing, confirmed</dd>
              </div>
              <div>
                <dt>Issued</dt>
                <dd>{formatMemoryDate(new Date().toISOString())}</dd>
              </div>
              <div>
                <dt>Valid</dt>
                <dd>Forever</dd>
              </div>
            </dl>
          </div>
          <div className="passport-seal" aria-hidden="true">
            <span>Approved</span>
          </div>
        </div>
      </section>

      <section className="keepsake-carousel">
        {memories === null && !loadError && (
          <p className="keepsake-message">Opening the memory book…</p>
        )}

        {loadError && <p className="keepsake-message">{loadError}</p>}

        {memories && memories.length === 0 && (
          <p className="keepsake-message">
            No memories yet — add the first one below.
          </p>
        )}

        {memories && memories.length > 0 && (
          <Carousel_002
            images={memories.map((memory) => ({
              src: memory.image_url,
              alt: memory.caption || "A memory",
            }))}
            showNavigation
            showPagination
            loop={false}
            className="keepsake-carousel-inner"
          />
        )}
      </section>

      <div className="keepsake-upload-mini">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          hidden
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <ImagePlus size={15} strokeWidth={1.8} />
          {uploading ? "Keeping…" : "Add more"}
        </button>
        {uploadError && <p className="keepsake-error">{uploadError}</p>}
      </div>
    </main>
  );
}

function formatMemoryDate(value: string) {
  const date = new Date(value);
  const today = new Date();
  const sameYear = date.getFullYear() === today.getFullYear();

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  }).format(date);
}
