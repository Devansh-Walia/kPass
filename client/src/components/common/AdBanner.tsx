import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

export function AdBanner() {
  const adRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // AdSense not loaded (dev, ad blocker, etc.)
    }
  }, []);

  return (
    <div className="w-full flex justify-center my-4">
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={import.meta.env.VITE_ADSENSE_CLIENT || "ca-pub-XXXXXXXXXXXXXXXX"}
        data-ad-slot={import.meta.env.VITE_ADSENSE_SLOT || "0000000000"}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
