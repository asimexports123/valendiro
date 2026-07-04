/**
 * Affiliate Link Component
 * 
 * Automatically inserts affiliate links based on topic content
 */

interface AffiliateLinkProps {
  children: React.ReactNode;
  href: string;
  rel?: string;
  className?: string;
}

export default function AffiliateLink({ children, href, rel = "nofollow sponsored", className }: AffiliateLinkProps) {
  return (
    <a
      href={href}
      rel={rel}
      className={className}
      target="_blank"
    >
      {children}
    </a>
  );
}

/**
 * Convert regular URLs to affiliate URLs
 */
export function toAffiliateUrl(url: string, category: string): string {
  // Add affiliate tracking parameters
  const affiliateId = process.env.NEXT_PUBLIC_AFFILIATE_ID || "";
  
  if (!affiliateId) {
    return url;
  }

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}ref=${affiliateId}&category=${category}`;
}
