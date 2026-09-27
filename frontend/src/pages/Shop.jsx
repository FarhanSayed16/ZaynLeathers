import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ShopContext } from '../context/ShopContext'
import ProductItem from '../components/ProductItem'
import { dedupeProductsByStyle } from '../utils/styleListing'
import PageHeader from '../components/PageHeader'
import SEO from '../components/SEO'
import Breadcrumbs from '../components/Breadcrumbs'

const CATEGORY_CHIPS = [
  { label: 'All', value: '' },
  { label: 'Men', value: 'men' },
  { label: 'Women', value: 'women' },
  { label: 'Bags', value: 'bags' },
  { label: 'Accessories', value: 'accessories' },
]

const Shop = () => {
  const [filterProducts, setFilterProducts] = useState([])
  const { products, search, setSearch, categories } = useContext(ShopContext)
  const [searchParams, setSearchParams] = useSearchParams()
  const [showFilter, setShowFilter] = useState(false)
  const [category, setCategory] = useState([])
  const [subCategory, setSubCategory] = useState([])
  const [sortType, setSortType] = useState('relavant')
  const [material, setMaterial] = useState([])
  const [color, setColor] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

  const urlDepartment = searchParams.get('department') || ''
  const urlCategorySlug = searchParams.get('category') || ''
  const urlQuery = searchParams.get('q') || ''

  // Sync URL → department filter state
  useEffect(() => {
    if (urlDepartment) {
      setCategory([urlDepartment])
    } else if (!urlDepartment && !urlCategorySlug) {
      setCategory([])
    }
    if (urlCategorySlug) {
      setSubCategory([urlCategorySlug])
    } else {
      setSubCategory([])
    }
  }, [urlDepartment, urlCategorySlug])

  useEffect(() => {
    setSearch(urlQuery)
  }, [urlQuery, setSearch])

  const setUrlDepartment = useCallback(
    (value) => {
      const next = new URLSearchParams(searchParams)
      if (value) next.set('department', value)
      else next.delete('department')
      next.delete('category')
      setSearchParams(next, { replace: true })
      if (value) setCategory([value])
      else setCategory([])
      setSubCategory([])
    },
    [searchParams, setSearchParams]
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [category, subCategory, material, color, search, sortType])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showFilter && window.innerWidth < 768) {
        const sidebar = document.getElementById('mobile-filter-sidebar')
        const triggerBtn = document.getElementById('filter-trigger-btn')
        if (sidebar && !sidebar.contains(e.target) && triggerBtn && !triggerBtn.contains(e.target)) {
          setShowFilter(false)
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showFilter])

  // Only lock body scroll for mobile filter drawer
  useEffect(() => {
    if (!showFilter) return undefined
    if (window.innerWidth >= 768) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [showFilter])

  const syncCategoryToUrl = (nextCategories) => {
    const primary = nextCategories[0]
    const next = new URLSearchParams(searchParams)
    if (primary && nextCategories.length === 1) next.set('department', primary)
    else next.delete('department')
    next.delete('category')
    setSearchParams(next, { replace: true })
  }

  const toggleCategory = (e) => {
    const value = e.target.value
    setCategory((prev) => {
      const next = prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
      syncCategoryToUrl(next)
      return next
    })
  }

  const toggleSubCategory = (e) => {
    const value = e.target.value
    setSubCategory((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    )
  }

  const togglesetMaterial = (e) => {
    const value = e.target.value
    setMaterial((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    )
  }

  const togglesetColor = (e) => {
    const value = e.target.value
    setColor((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    )
  }

  const clearAllFilters = () => {
    setCategory([])
    setSubCategory([])
    setMaterial([])
    setColor([])
    setSortType('relavant')
    const next = new URLSearchParams(searchParams)
    next.delete('category')
    next.delete('department')
    next.delete('q')
    setSearch('')
    setSearchParams(next, { replace: true })
  }

  useEffect(() => {
    let productsCopy = [...products]

    if (search && search.trim() !== '') {
      const normalize = (str) =>
        str.toLowerCase().replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim()
      const searchInput = normalize(search)
      const searchWords = searchInput.split(' ')

      productsCopy = productsCopy.filter((item) => {
        const searchableText = normalize(
          [
            item.name,
            item.secondaryName,
            item.color,
            item.description,
            item.material,
            item.subCategory,
            item.category,
            item.department,
            item.categorySlug,
          ]
            .filter(Boolean)
            .join(' ')
        )
        return searchWords.every((word) => searchableText.includes(word))
      })
    }

    if (category.length > 0) {
      productsCopy = productsCopy.filter((item) =>
        category.includes(item.department) || category.includes(item.category)
      )
    }
    if (subCategory.length > 0) {
      productsCopy = productsCopy.filter(
        (item) =>
          subCategory.includes(item.categorySlug) ||
          subCategory.includes(item.subCategory) ||
          subCategory.includes(item.category)
      )
    }
    if (material.length > 0) {
      productsCopy = productsCopy.filter((item) => material.includes(item.material))
    }
    if (color.length > 0) {
      productsCopy = productsCopy.filter((item) => color.includes(item.color))
    }

    if (sortType === 'low-high') {
      productsCopy = [...productsCopy].sort((a, b) => a.price - b.price)
    } else if (sortType === 'high-low') {
      productsCopy = [...productsCopy].sort((a, b) => b.price - a.price)
    }

    productsCopy = dedupeProductsByStyle(productsCopy, { preferredColors: color })

    if (sortType === 'low-high') {
      productsCopy = [...productsCopy].sort((a, b) => a.price - b.price)
    } else if (sortType === 'high-low') {
      productsCopy = [...productsCopy].sort((a, b) => b.price - a.price)
    }

    setFilterProducts(productsCopy)
  }, [category, subCategory, material, color, search, products, sortType])

  const activeFiltersCount = category.length + subCategory.length + material.length + color.length

  const headerCopy = useMemo(() => {
    const dept = category[0]
    const labels = {
      men: { title1: 'MEN', title2: 'LEATHER', subtitle: 'Jackets, blazers, pants, and more.', seo: "Men's Leather" },
      women: { title1: 'WOMEN', title2: 'LEATHER', subtitle: 'Jackets, dresses, skirts, and more.', seo: "Women's Leather" },
      bags: { title1: 'LEATHER', title2: 'BAGS', subtitle: 'Handbags, laptop bags, backpacks, and slings.', seo: 'Leather Bags' },
      accessories: { title1: 'LEATHER', title2: 'ACCESSORIES', subtitle: 'Wallets, belts, and finishing essentials.', seo: 'Accessories' },
    }
    if (dept && labels[dept]) return labels[dept]
    return {
      title1: 'ALL',
      title2: 'PRODUCTS',
      subtitle: 'Jackets, bags, and leather essentials — filter by color, material, and style.',
      seo: 'Shop Collection',
    }
  }, [category])

  const categoryOptions = useMemo(() => {
    const fromApi = categories.filter((c) => c.type === 'department')
    if (fromApi.length > 0) return fromApi
    return CATEGORY_CHIPS.filter((c) => c.value).map((c) => ({ _id: c.value, name: c.label, slug: c.value }))
  }, [categories])

  const FiltersBody = () => (
    <>
      <FilterSection title="Department">
        <div className="flex flex-col gap-2">
          {categoryOptions.map((c) => (
            <Checkbox
              key={c._id}
              value={c.slug || c.name}
              checked={category.includes(c.slug || c.name)}
              onChange={toggleCategory}
              label={c.name}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Category">
        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
          {categories
            .filter((c) => c.type === 'category')
            .slice(0, 40)
            .map((s) => (
              <Checkbox
                key={s._id}
                value={s.slug}
                checked={subCategory.includes(s.slug) || subCategory.includes(s.name)}
                onChange={toggleSubCategory}
                label={s.name}
              />
            ))}
        </div>
      </FilterSection>

      <FilterSection title="Material">
        <div className="flex flex-col gap-2">
          {['Genuine Leather', 'Lambskin', 'Suede', 'PU Leather', 'Croco'].map((m) => (
            <Checkbox key={m} value={m} checked={material.includes(m)} onChange={togglesetMaterial} label={m} />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Choose Color">
        <div className="grid grid-cols-2 gap-2">
          {['Red', 'Green', 'Pink', 'Yellow', 'Black', 'Silver', 'White', 'Golden', 'Blue'].map((c) => (
            <Checkbox key={c} value={c} checked={color.includes(c)} onChange={togglesetColor} label={c} />
          ))}
        </div>
      </FilterSection>
    </>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-tz-cream to-tz-cream">
      <SEO
        title={headerCopy.seo}
        description="Browse Zayn Leathers jackets, bags, and leather essentials — filter by color, material, and style."
      />
      <PageHeader title1={headerCopy.title1} title2={headerCopy.title2} subtitle={headerCopy.subtitle}>
        <Breadcrumbs
          items={[
            { label: 'Home', to: '/' },
            { label: urlQuery ? `Search “${urlQuery}”` : headerCopy.seo || 'Shop' },
          ]}
        />
        <div className="mt-5 flex flex-wrap gap-2">
          {CATEGORY_CHIPS.map((chip) => {
            const chipActive =
              chip.value === '' ? !urlDepartment && !urlCategorySlug : urlDepartment === chip.value

            return (
              <button
                key={chip.label}
                type="button"
                onClick={() => setUrlDepartment(chip.value)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors border ${
                  chipActive
                    ? 'bg-tz-navy text-white border-tz-navy'
                    : 'bg-white text-tz-navy border-tz-pink/25 hover:border-tz-pink hover:bg-tz-pink/10'
                }`}
              >
                {chip.label}
              </button>
            )
          })}
        </div>
      </PageHeader>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 pb-24">
        <div className="flex items-center justify-between gap-3 mb-5 md:hidden">
          <button
            id="filter-trigger-btn"
            type="button"
            onClick={() => setShowFilter(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-tz-navy text-white hover:bg-tz-pink transition-colors duration-300 rounded-full text-sm font-medium shadow-md"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            Filters
            {activeFiltersCount > 0 && (
              <span className="ml-1 bg-tz-pink text-white text-xs rounded-full px-1.5 py-0.5">
                {activeFiltersCount}
              </span>
            )}
          </button>

          <select
            onChange={(e) => setSortType(e.target.value)}
            value={sortType}
            className="border border-tz-pink/25 text-sm rounded-full px-3 py-2 bg-white focus:outline-none focus:border-tz-pink text-tz-navy"
          >
            <option value="relavant">Sort: Relevant</option>
            <option value="low-high">Sort: Low → High</option>
            <option value="high-low">Sort: High → Low</option>
          </select>
        </div>

        <div className="hidden md:flex gap-8 items-start">
          <aside className="w-72 flex-shrink-0 sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto overscroll-contain bg-white rounded-none border border-gray-200 p-5 custom-scrollbar">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-display font-semibold text-lg text-tz-navy">Filters</h3>
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-xs text-tz-navy/50 hover:text-tz-pink underline"
                >
                  Clear ({activeFiltersCount})
                </button>
              )}
            </div>
            <FiltersBody />
          </aside>

          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-5 gap-4">
              <p className="text-sm text-tz-navy/55 font-medium">
                {filterProducts.length} {filterProducts.length === 1 ? 'product' : 'products'}
              </p>
              <select
                onChange={(e) => setSortType(e.target.value)}
                value={sortType}
                className="border border-tz-pink/25 text-sm rounded-full px-3 py-2 bg-white focus:outline-none focus:border-tz-pink text-tz-navy"
              >
                <option value="relavant">Sort: Relevant</option>
                <option value="low-high">Sort: Low → High</option>
                <option value="high-low">Sort: High → Low</option>
              </select>
            </div>
            <ProductGrid
              products={filterProducts}
              clearFilters={clearAllFilters}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              itemsPerPage={itemsPerPage}
              searchQuery={search}
            />
          </div>
        </div>

        {showFilter && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="absolute inset-0 bg-tz-navy/50 backdrop-blur-sm"
              onClick={() => setShowFilter(false)}
            />
            <div
              id="mobile-filter-sidebar"
              className="absolute right-0 top-0 h-full w-[85%] max-w-sm bg-white shadow-2xl overflow-y-auto animate-slide-in"
            >
              <div className="sticky top-0 z-10 bg-white border-b border-tz-pink/15 p-4 flex justify-between items-center">
                <h3 className="font-display font-semibold text-lg text-tz-navy">Filters</h3>
                <div className="flex gap-3 items-center">
                  {activeFiltersCount > 0 && (
                    <button type="button" onClick={clearAllFilters} className="text-xs text-tz-navy/50">
                      Clear all
                    </button>
                  )}
                  <button type="button" onClick={() => setShowFilter(false)} className="text-2xl leading-5">
                    &times;
                  </button>
                </div>
              </div>
              <div className="p-4 pb-28">
                <FiltersBody />
              </div>
              <div className="sticky bottom-0 bg-white border-t border-tz-pink/15 p-4">
                <button
                  type="button"
                  onClick={() => setShowFilter(false)}
                  className="w-full bg-tz-navy text-white hover:bg-tz-pink transition-colors duration-300 py-3 rounded-full font-medium"
                >
                  Show {filterProducts.length} results
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="md:hidden mt-4">
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {[...category, ...subCategory, ...material, ...color].map((filter) => (
                <span
                  key={filter}
                  className="bg-tz-pink/15 text-tz-navy text-xs px-2.5 py-1 rounded-full font-medium"
                >
                  {filter}
                </span>
              ))}
            </div>
          )}
          <ProductGrid
            products={filterProducts}
            clearFilters={clearAllFilters}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            itemsPerPage={itemsPerPage}
            searchQuery={search}
          />
        </div>
      </div>
    </div>
  )
}

const FilterSection = ({ title, children }) => (
  <div className="border-b border-gray-200 py-4 first:pt-0 last:border-0">
    <p className="font-semibold text-tz-navy mb-3 text-sm">{title}</p>
    <div className="space-y-2">{children}</div>
  </div>
)

const Checkbox = ({ value, checked, onChange, label }) => (
  <label className="flex items-center gap-2 text-sm text-tz-navy/80 cursor-pointer hover:text-tz-navy">
    <input
      type="checkbox"
      className="w-4 h-4 rounded-none border-gray-300 text-tz-navy focus:ring-tz-navy"
      value={value}
      onChange={onChange}
      checked={checked}
    />
    <span>{label}</span>
  </label>
)

const ProductGrid = ({ products, clearFilters, currentPage, setCurrentPage, itemsPerPage, searchQuery }) => {
  const totalPages = Math.ceil(products.length / itemsPerPage) || 1
  const paginatedProducts = products.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
        {paginatedProducts.map((item) => (
          <ProductItem
            key={item._id}
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
        ))}
        {products.length === 0 && (
          <div className="col-span-full text-center py-16 bg-white rounded-2xl border border-tz-pink/15">
            <p className="font-display text-xl text-tz-navy mb-2">
              {searchQuery?.trim()
                ? `No results for “${searchQuery.trim()}”`
                : 'No pieces match these filters'}
            </p>
            <p className="text-tz-navy/55 text-sm">Try another colour, material, department, or search term.</p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 text-sm text-white bg-tz-navy hover:bg-tz-pink px-5 py-2 rounded-full transition-colors"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-10 pt-6 border-t border-tz-pink/10">
          <button
            type="button"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={`px-4 py-2 border rounded-full text-sm font-medium transition ${
              currentPage === 1
                ? 'bg-gray-100 text-gray-400 border-transparent cursor-not-allowed'
                : 'bg-white text-tz-navy border-tz-pink/25 hover:bg-tz-pink/10'
            }`}
          >
            Previous
          </button>
          <div className="flex items-center gap-2 text-sm text-tz-navy">
            <span className="font-semibold">{currentPage}</span>
            <span className="text-tz-navy/45">of {totalPages}</span>
          </div>
          <button
            type="button"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 border rounded-full text-sm font-medium transition ${
              currentPage === totalPages
                ? 'bg-gray-100 text-gray-400 border-transparent cursor-not-allowed'
                : 'bg-white text-tz-navy border-tz-pink/25 hover:bg-tz-pink/10'
            }`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default Shop
