/**
 * AdSense Component
 * 
 * Displays Google AdSense ads
 */

export default function AdSense({ slot }: { slot: string }) {
  return (
    <div className="my-6 flex justify-center">
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}

/**
 * Initialize AdSense
 */
export function initializeAdSense() {
  if (typeof window !== "undefined" && !document.querySelector('script[src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]')) {
    const script = document.createElement("script");
    script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";
    script.async = true;
    script.setAttribute("data-ad-client", process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || "");
    document.head.appendChild(script);
  }
}
