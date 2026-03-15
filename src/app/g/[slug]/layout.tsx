import type { Metadata } from 'next';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { slug } = await params;

  return {
    other: {
      'mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-status-bar-style': 'default',
      'apple-mobile-web-app-title': '그 날',
    },
    icons: {
      apple: '/favicon.png',
    },
    manifest: `/g/${slug}/manifest.webmanifest`,
  };
}

export default function GeunnalLayout({ children }: LayoutProps) {
  return children;
}
