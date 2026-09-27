import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from './Title';
import ProductItem from './ProductItem';
import { dedupeProductsByStyle } from '../utils/styleListing';

const BestSeller = ({ title = "TOP BEST SELLERS" }) => {
  const [bestSeller, setBestSeller] = useState([])
  const { products } = useContext(ShopContext);

  useEffect(() => {
    const bestProduct = dedupeProductsByStyle(products.filter((item) => item.bestseller))
    setBestSeller(bestProduct.slice(0, 10))
  }, [products])

  const titleParts = title.split(' ')
  const text1 = titleParts.slice(0, Math.ceil(titleParts.length / 2)).join(' ')
  const text2 = titleParts.slice(Math.ceil(titleParts.length / 2)).join(' ')

  return (
    <div className='py-10 sm:py-12'>
      <div className='text-center mb-7'>
        <Title text1={text1} text2={text2} eyebrow="Favourites" />
        <p className="text-tz-navy/50 text-sm" data-aos="fade-up" data-aos-delay="40">
          The pieces everyone keeps coming back to
        </p>
      </div>

      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4'>
        {bestSeller.map((item, index) => (
          <div
            key={item._id}
            data-aos="fade-up"
            data-aos-delay={(index % 5) * 60}
          >
            <ProductItem
              id={item._id}
              image={item.image}
              name={item.name}
              price={item.price}
              discount={item.discount}
              oldPrice={item.oldPrice}
              availableQuantity={item.availableQuantity}
            imageAlt={item.imageAlt}
            priceFrom={item.priceFrom}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default BestSeller
