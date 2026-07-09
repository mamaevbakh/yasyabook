"use client";

import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Download, ImagePlus, X } from "lucide-react";
import CurvedLoop from "@/components/CurvedLoop";
import { Carousel_002 } from "@/components/ui/skiper-ui/skiper48";
import { Carousel_006 } from "@/components/ui/skiper-ui/skiper54";
import type { Memory } from "@/lib/database.types";
import { listMemories, uploadMemory } from "@/lib/memories";

export function MemoriesPage() {
  const [memories, setMemories] = useState<Memory[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{
    src: string;
    alt: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const passportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    listMemories()
      .then((data) => {
        if (!cancelled) setMemories(data);
      })
      .catch(() => {
        // Silently retry-able — the carousel section just stays empty.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDownloadCertificate() {
    if (!passportRef.current) return;

    setDownloading(true);
    try {
      const dataUrl = await toPng(passportRef.current, { pixelRatio: 2 });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = "certificate-of-coolness.png";
      link.click();
    } catch {
      // Nothing to reconcile — the button just stays clickable to retry.
    } finally {
      setDownloading(false);
    }
  }

  useEffect(() => {
    if (!lightboxImage) return;

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") setLightboxImage(null);
    }

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [lightboxImage]);

  function handleCarouselClick(event: React.MouseEvent<HTMLElement>) {
    const target = event.target as HTMLElement;
    if (target.tagName === "IMG") {
      const img = target as HTMLImageElement;
      setLightboxImage({ src: img.currentSrc || img.src, alt: img.alt });
    }
  }

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
        <h1 className="keepsake-headline">
          <CurvedLoop
            marqueeText="Thank ✦ You ✦ For ✦ Being ✦ So ✦ Cool ✦"
            curveAmount={80}
            speed={1}
            className="keepsake-headline-loop"
          />
        </h1>
      </section>

      <section className="keepsake-passport">
        <div className="passport-card" ref={passportRef}>
          <div className="passport-header">
            <span className="passport-kicker">Official Document</span>
            <h2>Certificate of Coolness</h2>
          </div>
          <div className="passport-body">
            <div className="passport-photo">
              <img src="/yasya/3.jpeg" alt="Яся Мамаева" />
            </div>
            <dl className="passport-fields">
              <div>
                <dt>Name</dt>
                <dd>Яся Мамаева</dd>
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

          <div className="passport-diagnosis">
            <span className="passport-kicker">Diagnosis</span>
            <ul>
              <li>ты non autist</li>
              <li>claude (fable) golovnogo mozga</li>
              <li>Smart, intelligent</li>
              <li>lyubit gotovit&apos;</li>
              <li>likes cats</li>
            </ul>
            <p className="passport-diagnosis-note">
              Observing is not finished. Documentation is not complete.
            </p>
          </div>

          <div className="passport-seal" aria-hidden="true">
            <span>Approved by</span>
            <span>Баха Рамадан</span>
          </div>
        </div>

        <button
          type="button"
          className="passport-download"
          onClick={handleDownloadCertificate}
          disabled={downloading}
        >
          <Download size={15} strokeWidth={1.8} />
          {downloading ? "Preparing…" : "Download certificate"}
        </button>
      </section>

      <div className="keepsake-carousel-heading">
        <p>Proper doomscrolling looks like this</p>
        <h2>4ota Na Beskone4nom</h2>
      </div>

      <section className="keepsake-carousel" onClick={handleCarouselClick}>
        {memories && memories.length === 0 && (
          <p className="keepsake-message">
            No memories yet — add the first one below.
          </p>
        )}

        {memories && memories.length > 0 && (
          <>
            <div className="keepsake-carousel-mobile">
              <Carousel_002
                images={memories.map((memory) => ({
                  src: memory.image_url,
                  alt: memory.caption || "A memory",
                }))}
                showPagination
                loop={false}
                rewind
                onImageClick={setLightboxImage}
                className="keepsake-carousel-inner"
              />
              <p className="keepsake-swipe-hint">Swipe</p>
            </div>

            <div className="keepsake-carousel-desktop">
              <Carousel_006
                images={memories.map((memory) => ({
                  src: memory.image_url,
                  alt: memory.caption || "A memory",
                  title: memory.caption,
                }))}
                showNavigation
                showPagination
                loop={false}
              />
            </div>
          </>
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

      {lightboxImage && (
        <div
          className="keepsake-lightbox"
          role="dialog"
          aria-modal="true"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="keepsake-lightbox-inner"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="keepsake-lightbox-close"
              onClick={() => setLightboxImage(null)}
              aria-label="Close"
            >
              <X size={22} />
            </button>
            <img src={lightboxImage.src} alt={lightboxImage.alt} />
          </div>
        </div>
      )}
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
