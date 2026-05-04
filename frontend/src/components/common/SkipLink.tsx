import React from 'react';

interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * SkipLink Component
 * Provides keyboard users a way to skip to main content
 * Requirement 3.3.2: Keyboard navigation support
 */
export const SkipLink: React.FC<SkipLinkProps> = ({ 
  href, 
  children, 
  className = '' 
}) => {
  return (
    <a
      href={href}
      className={`
        sr-only focus:not-sr-only
        focus:absolute focus:top-4 focus:left-4 focus:z-50
        focus:px-4 focus:py-2
        focus:bg-blue-600 focus:text-white
        focus:rounded focus:shadow-lg
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        transition-all duration-200
        ${className}
      `}
    >
      {children}
    </a>
  );
};

/**
 * SkipLinks Component
 * Container for multiple skip links
 */
interface SkipLinksProps {
  links: Array<{
    href: string;
    label: string;
  }>;
}

export const SkipLinks: React.FC<SkipLinksProps> = ({ links }) => {
  return (
    <nav aria-label="Skip navigation links" className="sr-only focus-within:not-sr-only">
      {links.map((link, index) => (
        <SkipLink key={index} href={link.href}>
          {link.label}
        </SkipLink>
      ))}
    </nav>
  );
};

export default SkipLink;