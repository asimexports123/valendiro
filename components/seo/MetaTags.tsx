/**
 * SEO Meta Tags Component
 * 
 * Automatically generates meta tags for topics
 */

interface MetaTagsProps {
  title: string;
  description: string;
  slug: string;
  publishedAt?: string;
  category?: string;
}

export default function MetaTags({ title, description, slug, publishedAt, category }: MetaTagsProps) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://valendiro.com";
  const url = `${baseUrl}/topics/${slug}`;
  const siteName = "Valendiro";
  const fullTitle = `${title} | ${siteName}`;

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={`${title}, ${category || "knowledge"}, learning, education`} />
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="article" />
      <meta property="og:site_name" content={siteName} />
      {publishedAt && <meta property="article:published_time" content={publishedAt} />}
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={url} />
      
      {/* Robots */}
      <meta name="robots" content="index, follow" />
    </>
  );
}
