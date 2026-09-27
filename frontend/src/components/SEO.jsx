import { useEffect } from 'react';
import brand from '../brand';

const SEO = ({ title, description }) => {
  useEffect(() => {
    const template = brand.seo?.titleTemplate || `%s | ${brand.name}`;
    const pageTitle = title
      ? template.replace('%s', title)
      : (brand.seo?.defaultTitle || brand.name);
    document.title = pageTitle;

    const metaDesc =
      description ||
      brand.seo?.defaultDescription ||
      brand.footer?.blurb ||
      brand.tagline ||
      '';

    let descElement = document.querySelector('meta[name="description"]');
    if (descElement) {
      descElement.setAttribute('content', metaDesc);
    } else {
      descElement = document.createElement('meta');
      descElement.name = 'description';
      descElement.content = metaDesc;
      document.head.appendChild(descElement);
    }

    const updateOG = (property, content) => {
      if (!content) return;
      let ogElement = document.querySelector(`meta[property="${property}"]`);
      if (ogElement) {
        ogElement.setAttribute('content', content);
      } else {
        ogElement = document.createElement('meta');
        ogElement.setAttribute('property', property);
        ogElement.content = content;
        document.head.appendChild(ogElement);
      }
    };

    updateOG('og:title', pageTitle);
    updateOG('og:description', metaDesc);
    updateOG('og:site_name', brand.name);
    if (brand.contact?.websiteUrl) {
      updateOG('og:url', brand.contact.websiteUrl);
    }
  }, [title, description]);

  return null;
};

export default SEO;
