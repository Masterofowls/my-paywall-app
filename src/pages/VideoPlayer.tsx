// src/pages/VideoPlayer.tsx
import { PaywallGuard } from "@/components/Payment/PaywallGuard";

const PREMIUM_VIDEO_SRC =
  "https://www.youtube.com/embed/wBD95wHYgNo?si=bNiCR1mXCc4v7Jv1";

export function VideoPlayer() {
  return (
    <PaywallGuard>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Premium Video</h1>
        <div className="bg-black rounded aspect-video overflow-hidden">
          <iframe
            className="w-full h-full"
            src={PREMIUM_VIDEO_SRC}
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      </div>
    </PaywallGuard>
  );
}
