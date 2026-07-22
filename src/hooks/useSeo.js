import { useEffect } from 'react';

/**
 * Custom hook to update SEO meta tags dynamically for public pages
 * @param {Object} options
 * @param {string} options.title - Document title
 * @param {string} options.description - Meta description
 * @param {string} options.ogImage - OpenGraph Image URL
 * @param {string} options.ogType - OpenGraph Type (e.g. 'website', 'video.other')
 */
export function useSeo({ title, description, ogImage, ogType = 'website' }) {
  useEffect(() => {
    if (title) {
      document.title = `${title} | Webinar Platform`;
    }

    const updateMetaTag = (selector, attribute, value) => {
      if (!value) return;
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        const [attrName, attrVal] = selector.replace('meta[', '').replace(']', '').split('=');
        element.setAttribute(attrName, attrVal.replace(/"/g, ''));
        document.head.appendChild(element);
      }
      element.setAttribute(attribute, value);
    };

    updateMetaTag('meta[name="description"]', 'content', description);
    updateMetaTag('meta[property="og:title"]', 'content', title);
    updateMetaTag('meta[property="og:description"]', 'content', description);
    updateMetaTag('meta[property="og:image"]', 'content', ogImage);
    updateMetaTag('meta[property="og:type"]', 'content', ogType);
    updateMetaTag('meta[name="twitter:card"]', 'content', 'summary_large_image');
    updateMetaTag('meta[name="twitter:title"]', 'content', title);
    updateMetaTag('meta[name="twitter:description"]', 'content', description);

    return () => {
      // Revert default title on unmount if needed
    };
  }, [title, description, ogImage, ogType]);
}
