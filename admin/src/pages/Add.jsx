import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { assets } from '../assets/assets.js'
import axios from 'axios'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'
import { adminHeaders } from '../utils/adminApi'
import SizeMatrixEditor from '../components/SizeMatrixEditor'
import { COLOR_OPTIONS, matrixFromSizes } from '../constants/catalog'

const Add = ({token}) => {
  const [searchParams] = useSearchParams()
  const styleIdParam = searchParams.get('styleId') || ''

  const [imageFiles, setImageFiles] = useState(Array(8).fill(null))

  const [sizeFiles, setSizeFiles] = useState([null, null])

  const [name,setName]=useState("")
  const [secondaryName,setSecondaryName]=useState("")
  const [description,setDescription]=useState("")
  const [categoryId, setCategoryId] = useState("")
  const [bestseller, setBestseller] = useState(false);
  const [featured, setFeatured] = useState(false);
  const [tags, setTags] = useState("");
  const [sizes, setSizes] = useState(['One Size']);
  const [sizeMatrix, setSizeMatrix] = useState(matrixFromSizes(['One Size']));
  const [dbCategories, setDbCategories] = useState([]);
  const [material, setMaterial] = useState("");
  const [dimensions, setDimensions] = useState("");
  const [discount, setDiscount] = useState("");
  const [color, setColor] = useState("");
  const [sku, setSku] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [hsnSac, setHsnSac] = useState("");
  const [gstRate, setGstRate] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [showConfirmationPopup, setShowConfirmationPopup] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [linkParentId, setLinkParentId] = useState("");
  const [usedColors, setUsedColors] = useState([]);
  const [styleLocked, setStyleLocked] = useState(false);
  const [loadingStyle, setLoadingStyle] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (!styleIdParam || !token) return;
    const loadStyle = async () => {
      setLoadingStyle(true);
      try {
        const res = await axios.get(
          `${backendUrl}/api/product/style/${encodeURIComponent(styleIdParam)}`,
          { headers: adminHeaders(token) }
        );
        if (!res.data.success) {
          toast.error(res.data.message || "Could not load style");
          return;
        }
        const t = res.data.template;
        setLinkParentId(t.parentId);
        setSecondaryName(t.secondaryName || "");
        setDescription(t.description || "");
        setCategoryId(String(t.categoryId || ""));
        setMaterial(t.material || "");
        setDimensions(t.dimensions || "");
        setDiscount(t.discount ?? "");
        setTags(Array.isArray(t.tags) ? t.tags.join(", ") : t.tags || "");
        const productSizes = Array.isArray(t.sizes) && t.sizes.length ? t.sizes : ["One Size"];
        setSizes(productSizes);
        setSizeMatrix(
          (t.sizeMatrix || []).map((row) => ({
            size: row.size,
            price: row.price ?? "",
            oldPrice: row.oldPrice ?? "",
            qty: "",
          }))
        );
        setUsedColors(t.usedColors || []);
        setStyleLocked(true);
      } catch {
        toast.error("Could not load style template");
      } finally {
        setLoadingStyle(false);
      }
    };
    loadStyle();
  }, [styleIdParam, token]);

  useEffect(() => {
    if (styleLocked && secondaryName && color) {
      setName(`${secondaryName} — ${color}`);
    }
  }, [styleLocked, secondaryName, color]);

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/categories`);
      if (res.data.success) {
        setDbCategories(res.data.categories);
      }
    } catch {
      toast.error("Could not load categories");
    }
  };

  const leafCategories = dbCategories.filter((c) => c.type === "category");
  const selectedLeaf = leafCategories.find((c) => c._id === categoryId);

  const syncSizes = (nextSizes) => {
    setSizes(nextSizes)
    setSizeMatrix((prev) => matrixFromSizes(nextSizes, prev))
  }

  // Handle form submission with confirmation
  const handleSubmitWithConfirmation = (e) => {
    e.preventDefault()
    setShowConfirmationPopup(true)
  }

  // Handle actual form submission
  const onSubmitHandler = async() => {
    try {
        setShowConfirmationPopup(false)
        
        const formData = new FormData()
        formData.append("name",name)
        formData.append("secondaryName",secondaryName)
        if (linkParentId) formData.append("parentId", linkParentId)
        formData.append("description",description)
        formData.append("discount",discount)
        formData.append("material",material)
        formData.append("dimensions",dimensions)
        formData.append("categoryId", categoryId)
        if (selectedLeaf) {
          formData.append("category", selectedLeaf.name)
          formData.append("subCategory", selectedLeaf.name)
        }
        formData.append("availableQuantity", "0")
        formData.append("bestseller",bestseller)
        formData.append("featured",featured)
        formData.append("tags",tags)
        formData.append("color",color)
        formData.append("sku",sku)
        formData.append("seoTitle",seoTitle)
        formData.append("hsnSac", hsnSac)
        if (gstRate !== "") formData.append("gstRate", gstRate)
        formData.append("imageAlt",imageAlt)
        formData.append("sizes",JSON.stringify(sizes.length ? sizes : ["One Size"]))
        formData.append(
          "sizeMatrix",
          JSON.stringify(
            sizeMatrix.map((row) => ({
              size: row.size,
              price: Number(row.price) || 0,
              oldPrice: row.oldPrice !== "" && row.oldPrice != null ? Number(row.oldPrice) : undefined,
              qty: Number(row.qty) || 0,
            }))
          )
        )

        imageFiles.forEach((file, i) => {
          if (file) formData.append(`image${i + 1}`, file)
        })

        sizeFiles.forEach((file, i) => {
          if (file) formData.append(`sizeimage${i + 1}`, file)
        })

        const response = await axios.post(backendUrl+'/api/product/add',formData,{headers:adminHeaders(token)})
        
        if(response.data.success){
          setSuccessMessage(response.data.message)
          setShowSuccessPopup(true)
          
          setName('')
          setSecondaryName('')
          setDescription('')
          syncSizes(['One Size'])
          setBestseller(false)
          setFeatured(false)
          setColor('')
          setMaterial('')
          setDimensions('')
          setDiscount('')
          setCategoryId('')
          setSku('')
          setSeoTitle('')
          setImageAlt('')
          setLinkParentId(styleIdParam || '')
          setUsedColors(styleLocked ? usedColors : [])
          setImageFiles(Array(8).fill(null))
          setSizeFiles([null, null])
        }else{
          toast.error(response.data.message, {
            position: "top-center",
            theme: "colored"
          });
        }
      } catch (error) {
          toast.error(error.response?.data?.message || error.message, {
            position: "top-center",
            theme: "colored"
          });
      }
  }

  return (
    <div className="py-2 relative">
      {/* Confirmation Popup */}
      {showConfirmationPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-fade-in">
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-tz-pink-soft rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-tz-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Confirm Product Addition</h3>
              <p className="text-gray-600 text-center mb-6">Are you sure you want to add this product to your inventory?</p>
              
              {/* Product Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-700 mb-2">Product Summary:</h4>
                <p className="text-sm text-gray-600"><span className="font-medium">Name:</span> {name || 'Not specified'}</p>
                <p className="text-sm text-gray-600"><span className="font-medium">Sizes:</span> {sizes.join(', ') || 'One Size'}</p>
                <p className="text-sm text-gray-600"><span className="font-medium">Category:</span> {selectedLeaf ? `${selectedLeaf.path || selectedLeaf.name}` : 'Not specified'}</p>
                <p className="text-sm text-gray-600"><span className="font-medium">Color:</span> {color || 'Not specified'}</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmationPopup(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={onSubmitHandler}
                  className="flex-1 px-4 py-2 bg-tz-navy hover:bg-tz-pink text-white font-medium rounded-lg transition-colors"
                >
                  Confirm & Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-fade-in">
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Success!</h3>
              <p className="text-gray-600 text-center mb-6">{successMessage || 'Product added successfully!'}</p>
              
              <button
                onClick={() => setShowSuccessPopup(false)}
                className="w-full px-4 py-2 bg-tz-navy hover:bg-tz-pink text-white font-medium rounded-lg transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-display font-semibold text-tz-navy">
            {styleLocked ? "Add colour variant" : "Add product"}
          </h1>
          <p className="mt-1 text-sm text-tz-navy/50">
            {styleLocked
              ? `New colour for “${secondaryName || "this style"}”. Size prices are copied — set stock and upload photos.`
              : "Style name groups colour variants; size grid sets price and stock per size."}
          </p>
          {loadingStyle && (
            <p className="text-xs text-tz-navy/60 mt-2">Loading style template…</p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmitWithConfirmation} className="space-y-6 sm:space-y-8">
          {/* Image Upload Section - Medium size */}
          <div className="bg-white rounded-2xl shadow-sm border border-tz-pink-soft p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-tz-navy mb-2 sm:mb-4">Product Images</h2>
            <p className="text-xs sm:text-sm text-tz-navy/60 mb-3 sm:mb-4">Upload up to 8 product images</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {imageFiles.map((imageState, idx) => {
                const num = idx + 1;
                return (
                  <label key={num} htmlFor={`image${num}`} className="cursor-pointer group">
                    <div className="relative aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors overflow-hidden bg-gray-50">
                      <img 
                        className="w-full h-full object-cover" 
                        src={!imageState ? assets.upload_area : URL.createObjectURL(imageState)}
                        alt={`Upload ${num}`}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all flex items-center justify-center">
                        <span className="text-white opacity-0 group-hover:opacity-100 text-xs font-medium bg-black bg-opacity-50 px-2 py-1 rounded">
                          {imageState ? 'Change' : 'Upload'}
                        </span>
                      </div>
                    </div>
                    <input type='file' id={`image${num}`} hidden onChange={(e)=>{
                      const next = [...imageFiles]
                      next[idx] = e.target.files[0] || null
                      setImageFiles(next)
                    }}/>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Basic Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-tz-pink-soft p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-tz-navy mb-3 sm:mb-4">Basic Information</h2>
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    onChange={(e)=>setName(e.target.value)} 
                    value={name} 
                    type='text' 
                    placeholder='e.g., Men Black Leather Biker Jacket' 
                    required 
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Style name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    onChange={(e)=>setSecondaryName(e.target.value)} 
                    value={secondaryName} 
                    type='text' 
                    placeholder='e.g. Classic Biker Jacket' 
                    required 
                    readOnly={styleLocked}
                    className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${styleLocked ? "bg-gray-50" : ""}`}
                  />
                  <p className="mt-1 text-[10px] sm:text-xs text-gray-500">
                    {styleLocked
                      ? "Style name is shared across colours in this style."
                      : "Same style name across colour variants. Style ID is assigned automatically; link colours via Add colour on the product list."}
                  </p>
                </div>
              </div>

              {!styleLocked && (
              <div className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 text-xs text-blue-900">
                One product = one colour. To add another colour later, use <strong>Add colour</strong> on the product list.
              </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">SKU / style code</label>
                  <input value={sku} onChange={(e)=>setSku(e.target.value)} className="w-full px-3 py-2 text-sm border rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">SEO title</label>
                  <input value={seoTitle} onChange={(e)=>setSeoTitle(e.target.value)} className="w-full px-3 py-2 text-sm border rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">HSN / SAC</label>
                  <input value={hsnSac} onChange={(e)=>setHsnSac(e.target.value)} placeholder="4203" className="w-full px-3 py-2 text-sm border rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">GST % override</label>
                  <input type="number" value={gstRate} onChange={(e)=>setGstRate(e.target.value)} placeholder="Site default" className="w-full px-3 py-2 text-sm border rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Image alt</label>
                  <input value={imageAlt} onChange={(e)=>setImageAlt(e.target.value)} className="w-full px-3 py-2 text-sm border rounded-lg" />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Product Description <span className="text-red-500">*</span>
                </label>
                <textarea 
                  onChange={(e)=>setDescription(e.target.value)} 
                  value={description} 
                  placeholder='Write a detailed description of your product...' 
                  required 
                  readOnly={styleLocked}
                  rows="3"
                  className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${styleLocked ? "bg-gray-50" : ""}`}
                />
              </div>
            </div>
          </div>

          {/* Inventory & Categorization */}
          <div className="bg-white rounded-2xl shadow-sm border border-tz-pink-soft p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-tz-navy mb-3 sm:mb-4">Inventory & Categorization</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6">
              
              <div className="xl:col-span-1">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Colour <span className="text-red-500">*</span></label>
                <select 
                  onChange={(e)=>setColor(e.target.value)} 
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  value={color}
                  required
                >
                  <option value="">Select colour</option>
                  {COLOR_OPTIONS.filter((c) => !usedColors.includes(c)).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="xl:col-span-2">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Category</label>
                <select 
                  onChange={(e)=>setCategoryId(e.target.value)} 
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-tz-pink focus:border-tz-pink bg-white disabled:bg-gray-50"
                  value={categoryId}
                  required
                  disabled={styleLocked}
                >
                  <option value="">Select leaf category</option>
                  {leafCategories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.path || c.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-gray-500 mt-1">
                  {leafCategories.length
                    ? "Pick from the Zayn category tree (seed if empty)."
                    : "No categories — run npm run seed:categories in backend."}
                </p>
              </div>

              <div className="xl:col-span-1">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Material</label>
                <input 
                  onChange={(e)=>setMaterial(e.target.value)} 
                  value={material}
                  type="text"
                  placeholder="e.g. Genuine leather"
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="xl:col-span-1">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Dimensions</label>
                <input 
                  onChange={(e)=>setDimensions(e.target.value)} 
                  value={dimensions}
                  type="text"
                  placeholder="e.g. Chest 42 in / Length 26 in"
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

            </div>
          </div>

          {/* Size matrix: price + stock per size */}
          <div className="bg-white rounded-2xl shadow-sm border border-tz-pink-soft p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-tz-navy mb-3 sm:mb-4">Sizes, pricing & stock</h2>
            <SizeMatrixEditor
              selectedSizes={sizes}
              setSelectedSizes={syncSizes}
              sizeMatrix={sizeMatrix}
              setSizeMatrix={setSizeMatrix}
            />

            <div className="mt-6">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Discount (%)</label>
              <input 
                onChange={(e)=>setDiscount(e.target.value)} 
                value={discount} 
                type='number' 
                placeholder='25' 
                className="w-full max-w-xs px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="mt-6">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">Size Chart Images</label>
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                {[0, 1].map((idx) => {
                  const num = idx + 1;
                  const imageState = sizeFiles[idx];
                  return (
                    <label key={num} htmlFor={`sizeimage${num}`} className="cursor-pointer group">
                      <div className="relative aspect-video rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors overflow-hidden bg-gray-50">
                        <img 
                          className="w-full h-full object-cover" 
                          src={!imageState ? assets.upload_area : URL.createObjectURL(imageState)}
                          alt={`Size Chart ${num}`}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all flex items-center justify-center">
                          <span className="text-white opacity-0 group-hover:opacity-100 text-xs font-medium bg-black bg-opacity-50 px-2 py-1 rounded">
                            {imageState ? 'Change' : 'Upload'}
                          </span>
                        </div>
                      </div>
                      <input
                        type="file"
                        id={`sizeimage${num}`}
                        hidden
                        onChange={(e) => {
                          const next = [...sizeFiles];
                          next[idx] = e.target.files[0] || null;
                          setSizeFiles(next);
                        }}
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Merchandising flags */}
          <div className="bg-white rounded-2xl shadow-sm border border-tz-pink-soft p-4 sm:p-6 space-y-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input 
                onChange={() => setBestseller(prev => !prev)} 
                checked={bestseller} 
                type='checkbox' 
                id='bestseller'
                className="w-4 h-4 sm:w-5 sm:h-5 text-tz-pink rounded border-gray-300 focus:ring-tz-pink"
              />
              <span className="text-xs sm:text-sm font-medium text-gray-700">Mark as bestseller</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input 
                onChange={() => setFeatured(prev => !prev)} 
                checked={featured} 
                type='checkbox' 
                className="w-4 h-4 sm:w-5 sm:h-5 text-tz-pink rounded border-gray-300 focus:ring-tz-pink"
              />
              <span className="text-xs sm:text-sm font-medium text-gray-700">Feature on homepage</span>
            </label>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Tags / vibes (comma-separated)</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="leather, biker, black, jacket"
                className="w-full px-3 py-2 text-sm border rounded-lg"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button 
              type='submit' 
              className="px-6 sm:px-8 py-2 sm:py-3 bg-tz-navy hover:bg-tz-pink text-white text-sm sm:text-base font-medium rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-tz-pink focus:ring-offset-2"
            >
              Add Product
            </button>
          </div>
        </form>
      </div>

      {/* Add custom animation */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}

export default Add