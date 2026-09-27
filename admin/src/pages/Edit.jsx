import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { assets } from "../assets/assets.js";
import axios from "axios";
import { backendUrl } from "../App";
import { toast } from "react-toastify";
import { adminHeaders } from "../utils/adminApi";
import { adminPreview, imageSrc } from "../utils/media.js";
import SizeMatrixEditor from "../components/SizeMatrixEditor";
import RelatedProductsPicker from "../components/RelatedProductsPicker";
import { COLOR_OPTIONS, matrixFromSizes } from "../constants/catalog";

const slotPreview = (file, existingUrl) => {
  if (file instanceof File) return URL.createObjectURL(file);
  if (existingUrl) return adminPreview(imageSrc(existingUrl));
  return assets.upload_area;
};

const Edit = ({ token }) => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState(null);

  const [name, setName] = useState("");
  const [secondaryName, setSecondaryName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [material, setMaterial] = useState("");
  const [dimensions, setDimensions] = useState("");
  const [bestseller, setBestseller] = useState(false);
  const [featured, setFeatured] = useState(false);
  const [tags, setTags] = useState("");
  const [sizes, setSizes] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);
  const [color, setColor] = useState("");
  const [parentId, setParentId] = useState("");
  const [siblings, setSiblings] = useState([]);
  const [sizeMatrix, setSizeMatrix] = useState([]);
  const [discount, setDiscount] = useState("");
  const [imageFiles, setImageFiles] = useState(Array(8).fill(null));
  const [sku, setSku] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [hsnSac, setHsnSac] = useState("");
  const [gstRate, setGstRate] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [sizeFiles, setSizeFiles] = useState([null, null]);
  const [recommendedProductIds, setRecommendedProductIds] = useState([]);

  const leafCategories = dbCategories.filter((c) => c.type === "category");
  const selectedLeaf = leafCategories.find((c) => String(c._id) === String(categoryId));
  const existingImages = product?.image || [];
  const existingSizeImages = product?.viewsizeimage || [];

  const applyProduct = (p) => {
    setProduct(p);
    setName(p.name || "");
    setSecondaryName(p.secondaryName || "");
    setDescription(p.description || "");
    setParentId(p.parentId || "");
    setDiscount(p.discount ?? "");
    setColor(p.color || "");
    setCategoryId(String(p.categoryId?._id || p.categoryId || ""));
    setMaterial(p.material || "");
    setDimensions(p.dimensions || "");
    const productSizes = Array.isArray(p.sizes) && p.sizes.length ? p.sizes : ["One Size"];
    setSizes(productSizes);
    if (Array.isArray(p.sizeMatrix) && p.sizeMatrix.length) {
      setSizeMatrix(
        p.sizeMatrix.map((row) => ({
          size: row.size,
          price: row.price ?? "",
          oldPrice: row.oldPrice ?? "",
          qty: row.qty ?? "",
        }))
      );
    } else {
      setSizeMatrix(
        productSizes.map((size) => ({
          size,
          price: p.price ?? "",
          oldPrice: p.oldPrice ?? "",
          qty: p.availableQuantity ?? "",
        }))
      );
    }
    setBestseller(Boolean(p.bestseller));
    setFeatured(Boolean(p.featured));
    setTags(Array.isArray(p.tags) ? p.tags.join(", ") : p.tags || "");
    setSku(p.sku || "");
    setSeoTitle(p.seoTitle || "");
    setHsnSac(p.hsnSac || "");
    setGstRate(p.gstRate != null ? String(p.gstRate) : "");
    setImageAlt(p.imageAlt || "");
    setRecommendedProductIds((p.recommendedProductIds || []).map(String));
    setImageFiles(Array(8).fill(null));
    setSizeFiles([null, null]);
  };

  useEffect(() => {
    if (!parentId) {
      setSiblings([]);
      return;
    }
    axios
      .get(`${backendUrl}/api/product/variants/${encodeURIComponent(parentId)}`, {
        headers: adminHeaders(token),
      })
      .then((res) => {
        if (res.data.success) {
          setSiblings((res.data.products || []).filter((s) => String(s._id) !== String(id)));
        }
      })
      .catch(() => {});
  }, [parentId, id, token]);

  useEffect(() => {
    axios
      .get(`${backendUrl}/api/categories`)
      .then((res) => {
        if (res.data.success) setDbCategories(res.data.categories || []);
      })
      .catch(() => {});
  }, []);

  const syncSizes = (nextSizes) => {
    setSizes(nextSizes);
    setSizeMatrix((prev) => matrixFromSizes(nextSizes, prev));
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${backendUrl}/api/product/${id}`, {
          headers: adminHeaders(token),
        });
        if (res.data.success) applyProduct(res.data.product);
        else toast.error(res.data.message || "Product not found");
      } catch {
        toast.error("Could not load product");
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id, token]);

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("secondaryName", secondaryName);
      formData.append("parentId", parentId);
      formData.append("description", description);
      formData.append("discount", discount);
      formData.append("material", material);
      formData.append("dimensions", dimensions);
      if (categoryId) formData.append("categoryId", categoryId);
      if (selectedLeaf) {
        formData.append("category", selectedLeaf.name);
        formData.append("subCategory", selectedLeaf.name);
      }
      formData.append("availableQuantity", "0");
      formData.append("bestseller", bestseller);
      formData.append("featured", featured);
      formData.append("tags", tags);
      formData.append("color", color);
      formData.append("sku", sku);
      formData.append("seoTitle", seoTitle);
      formData.append("hsnSac", hsnSac);
      if (gstRate !== "") formData.append("gstRate", gstRate);
      formData.append("imageAlt", imageAlt);
      formData.append("recommendedProductIds", JSON.stringify(recommendedProductIds));
      formData.append("sizes", JSON.stringify(Array.isArray(sizes) && sizes.length ? sizes : ["One Size"]));
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
      );
      imageFiles.forEach((file, i) => {
        if (file instanceof File) formData.append(`image${i + 1}`, file);
      });
      sizeFiles.forEach((file, i) => {
        if (file instanceof File) formData.append(`sizeimage${i + 1}`, file);
      });

      const response = await axios.put(`${backendUrl}/api/product/edit/${id}`, formData, {
        headers: adminHeaders(token),
      });
      if (response.data.success) {
        toast.success("Product saved — images and details kept");
        const refreshed = await axios.get(`${backendUrl}/api/product/${id}`, {
          headers: adminHeaders(token),
        });
        if (refreshed.data.success) applyProduct(refreshed.data.product);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-2 border-tz-navy border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-4">Product not found.</p>
        <Link to="/list" className="text-sm font-semibold underline">
          Back to list
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <Link to="/list" className="text-sm text-tz-navy/60 hover:text-tz-navy">
        ← Product list
      </Link>
          <h1 className="text-2xl font-display font-semibold text-tz-navy mt-2 mb-1">Edit product</h1>
      <p className="text-sm text-gray-500 mb-6">
        Existing photos stay unless you pick a replacement for that slot. Up to 8 gallery images.
      </p>

      <form onSubmit={onSubmitHandler} className="bg-white rounded-2xl border border-tz-pink-soft p-5 sm:p-6 space-y-6">
        <div>
          <p className="font-semibold text-sm mb-2">Gallery</p>
          <div className="flex flex-wrap gap-3">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <label key={i} className="cursor-pointer block">
                <img
                  className="w-24 h-24 object-cover rounded-xl border bg-gray-50"
                  src={slotPreview(imageFiles[i], existingImages[i])}
                  alt={`Slot ${i + 1}`}
                />
                <p className="text-[10px] text-center text-gray-500 mt-1">
                  {imageFiles[i] ? "New file" : existingImages[i] ? "Current" : "Empty"}
                </p>
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const next = [...imageFiles];
                    next[i] = e.target.files[0] || null;
                    setImageFiles(next);
                  }}
                />
              </label>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">SKU / style code</label>
            <input className="w-full border rounded-lg px-3 py-2" value={sku} onChange={(e) => setSku(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">SEO title</label>
            <input className="w-full border rounded-lg px-3 py-2" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">HSN / SAC (invoicing)</label>
            <input className="w-full border rounded-lg px-3 py-2" value={hsnSac} onChange={(e) => setHsnSac(e.target.value)} placeholder="4203" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">GST % (optional override)</label>
            <input type="number" className="w-full border rounded-lg px-3 py-2" value={gstRate} onChange={(e) => setGstRate(e.target.value)} placeholder="Site default" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">Image alt text</label>
            <input className="w-full border rounded-lg px-3 py-2" value={imageAlt} onChange={(e) => setImageAlt(e.target.value)} placeholder="Describe the photo for search / accessibility" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Product name</label>
            <input
              className="w-full border rounded-lg px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Style name (shared across colours)</label>
            <input
              className="w-full border rounded-lg px-3 py-2"
              value={secondaryName}
              onChange={(e) => setSecondaryName(e.target.value)}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">Style ID (link colour variants)</label>
            <input
              className="w-full border rounded-lg px-3 py-2 font-mono text-sm"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              placeholder="style-abc123"
            />
            <p className="text-xs text-gray-500 mt-1">Paste the same Style ID on each colour variant to show swatches together on the shop.</p>
          </div>
        </div>

        {siblings.length > 0 && (
          <div className="rounded-xl border border-tz-pink-soft p-4">
            <p className="text-sm font-semibold mb-2">Other colours in this style</p>
            <div className="flex flex-wrap gap-3">
              {siblings.map((s) => (
                <Link
                  key={s._id}
                  to={`/edit/${s._id}`}
                  className="flex items-center gap-2 rounded-lg border px-2 py-1 text-sm hover:bg-gray-50"
                >
                  <img src={adminPreview(imageSrc(s.image?.[0]))} alt="" className="w-8 h-8 object-cover rounded" />
                  <span>{s.color}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            className="w-full border rounded-lg px-3 py-2 min-h-[100px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Colour</label>
            <select
              className="w-full border rounded-lg px-3 py-2 bg-white"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              required
            >
              <option value="">Select colour</option>
              {COLOR_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              className="w-full border rounded-lg px-3 py-2 bg-white"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Select category</option>
              {leafCategories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.path || c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Material</label>
            <input
              className="w-full border rounded-lg px-3 py-2"
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Dimensions</label>
            <input
              className="w-full border rounded-lg px-3 py-2"
              value={dimensions}
              onChange={(e) => setDimensions(e.target.value)}
            />
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold mb-3">Sizes, pricing & stock</p>
          <SizeMatrixEditor
            selectedSizes={sizes.length ? sizes : ["One Size"]}
            setSelectedSizes={syncSizes}
            sizeMatrix={sizeMatrix}
            setSizeMatrix={setSizeMatrix}
          />
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">Discount %</label>
            <input
              type="number"
              className="w-full max-w-xs border rounded-lg px-3 py-2"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
            />
          </div>
          <p className="text-sm font-medium mt-4 mb-2">Size chart (optional)</p>
          <div className="flex gap-3">
            {[0, 1].map((i) => (
              <label key={i} className="cursor-pointer">
                <img
                  className="w-24 h-24 object-cover rounded-xl border bg-gray-50"
                  src={slotPreview(sizeFiles[i], existingSizeImages[i])}
                  alt=""
                />
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const next = [...sizeFiles];
                    next[i] = e.target.files[0] || null;
                    setSizeFiles(next);
                  }}
                />
              </label>
            ))}
          </div>
        </div>

        <RelatedProductsPicker
          token={token}
          currentId={id}
          currentParentId={parentId}
          value={recommendedProductIds}
          onChange={setRecommendedProductIds}
        />

        <div className="flex flex-col gap-2">
          <label className="flex gap-2 text-sm">
            <input type="checkbox" checked={bestseller} onChange={() => setBestseller((v) => !v)} />
            Bestseller
          </label>
          <label className="flex gap-2 text-sm">
            <input type="checkbox" checked={featured} onChange={() => setFeatured((v) => !v)} />
            Feature on homepage
          </label>
          <input
            className="border rounded-lg px-3 py-2 max-w-md"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Tags: leather, biker, black"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 rounded-xl bg-tz-navy text-white font-semibold disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save product"}
        </button>
      </form>
    </div>
  );
};

export default Edit;
