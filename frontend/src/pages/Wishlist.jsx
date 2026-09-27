import React, { useContext, useMemo } from 'react'
import Title from '../components/Title'
import { ShopContext } from '../context/ShopContext'
import { Link } from 'react-router-dom'
import WishListProductItem from '../components/WishListProductItem'

const Wishlist = () => {
  const { wishlistItems, products, token } = useContext(ShopContext)

  const filteredProducts = useMemo(
    () => products.filter((product) => wishlistItems.includes(product._id)),
    [products, wishlistItems]
  )

  return (
    <div className='sm:px-[5vw] md:px-[7vw] lg:px-[8vw] border-t pt-10'>
      <div className='text-2xl mb-3 px-2'>
        <Title text1={"YOUR"} text2={"WISH LIST"} />
      </div>

      {!token ? (
        <div className="flex flex-col items-center justify-center py-20 bg-tz-cream rounded-2xl shadow-sm border border-tz-pink/20 mx-2 mt-4">
          <p className="text-tz-navy/60 mb-4 text-sm">Please log in to view your wishlist.</p>
          <Link to="/login" className="bg-tz-navy text-white px-5 py-2 rounded-full text-sm font-semibold">
            Login
          </Link>
        </div>
      ) : filteredProducts.length > 0 ? (
         <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1'>
           {filteredProducts.map((product) => (
             <WishListProductItem
               key={product._id}
               id={product._id}
               image={product.image}
               name={product.name}
               price={product.price}
               discount={product.discount || 0}
               oldPrice={product.oldPrice || 0}
             />
           ))}
         </div>
         ) : (
           <div className="flex flex-col items-center justify-center py-20 bg-tz-cream rounded-2xl shadow-sm border border-tz-pink/20 mx-2 mt-4">
             <p className="text-tz-navy/60 mb-4 text-sm">Your wishlist is empty.</p>
             <Link to="/shop" className="bg-tz-navy text-white px-5 py-2 rounded-full text-sm font-semibold">
               Continue shopping
             </Link>
           </div>
         )}
    </div>
  )
}

export default Wishlist
