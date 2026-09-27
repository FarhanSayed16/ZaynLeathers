import React, { useEffect, useState } from 'react';
import Title from './Title';
import { FaInstagram } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import brand from '../brand';
import { igImage } from '../utils/cloudinary';
import * as shopApi from '../api/shopApi';

const InstagramSection = () => {
  const [promos, setPromos] = useState([]);
  const handle = brand.social.instagram
    ? brand.social.instagram.split('/').filter(Boolean).pop()
    : 'zaynleathers';

  useEffect(() => {
    fetchPromos();
  }, []);

  const fetchPromos = async () => {
    try {
      const res = await shopApi.getInstagramPromos();
      if (res.success) {
        setPromos(res.promos || []);
      }
    } catch (error) {
      console.log('Error fetching instagram promos', error);
    }
  };

  const fallbackGallery = (brand.media?.instagramFallback || []).map((image, i) => ({
    _id: `fallback-${i}`,
    image,
    caption: brand.shortName || brand.name,
    instagramLink: brand.social.instagram || '#',
    productLink: '/shop',
  }));

  const displayPromos = promos.length > 0 ? promos : fallbackGallery;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-14 bg-white border-y border-tz-pink/10">
      <div className="text-center mb-7 flex flex-col items-center">
        <div className="w-10 h-10 bg-tz-cream text-tz-navy/50 rounded-full flex items-center justify-center mb-3 border border-tz-pink/15">
          <FaInstagram className="text-lg" />
        </div>
        <Title text1={"Follow us on"} text2={"Instagram"} eyebrow="Social" />
        <p className="text-tz-navy/45 text-sm">@{handle}</p>
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3">
          {displayPromos.map((promo) => (
            <div
              key={promo._id}
              className="group relative aspect-square bg-tz-cream rounded-xl overflow-hidden"
            >
              <img
                src={igImage(promo.image || brand.media.placeholder)}
                alt={promo.caption || 'Instagram'}
                width={400}
                height={400}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.src = brand.media.placeholder;
                }}
              />
              <div className="absolute inset-0 bg-tz-navy/0 group-hover:bg-tz-navy/35 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="flex gap-2">
                  <a
                    href={promo.instagramLink || brand.social.instagram || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-white text-tz-navy p-2 rounded-full"
                  >
                    <FaInstagram className="text-base" />
                  </a>
                  {promo.productLink && (
                    <Link
                      to={promo.productLink}
                      className="bg-tz-navy text-white p-2 rounded-full"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {promos.length === 0 && (
          <div className="text-center mt-7">
            <a
              href={brand.social.instagram || '#'}
              target="_blank"
              rel="noreferrer"
              className="inline-flex text-sm font-medium text-tz-navy/70 hover:text-tz-pink transition-colors"
            >
              Follow @{handle} →
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstagramSection;
