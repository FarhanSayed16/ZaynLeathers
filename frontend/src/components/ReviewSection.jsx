import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaStar, FaRegStar } from "react-icons/fa";
import { toast } from "react-toastify";
import { ShopContext } from "../context/ShopContext";
import * as shopApi from "../api/shopApi";

const ReviewSection = ({ productId }) => {
  const { token, user } = useContext(ShopContext);
  const [reviews, setReviews] = useState([]);
  const [formData, setFormData] = useState({ comment: "", rating: 0 });
  const [averageRating, setAverageRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      const list = await shopApi.getProductReviews(productId);
      setReviews(Array.isArray(list) ? list : []);
      calculateAverage(Array.isArray(list) ? list : []);
    } catch {
      setReviews([]);
      setAverageRating(0);
    }
  };

  const calculateAverage = (reviewData) => {
    if (reviewData.length === 0) {
      setAverageRating(0);
      return;
    }
    const total = reviewData.reduce((sum, r) => sum + r.rating, 0);
    setAverageRating((total / reviewData.length).toFixed(1));
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.info("Please sign in to leave a review");
      return;
    }
    if (!formData.rating) {
      toast.warning("Please select a star rating");
      return;
    }

    setSubmitting(true);
    try {
      const res = await shopApi.submitProductReview(
        { productId, comment: formData.comment, rating: formData.rating },
        token,
        user
      );
      if (res?.success === false || res?.error) {
        toast.error(res.error || res.message || "Could not submit review");
        return;
      }
      toast.success("Thank you for your review");
      setFormData({ comment: "", rating: 0 });
      fetchReviews();
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || "Could not submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const displayName = user
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email
    : "";

  return (
    <div className="p-4 md:p-5 bg-gray-100 rounded">
      <h2 className="text-xl font-bold mb-2">Customer Reviews</h2>

      {reviews.length > 0 ? (
        <div className="flex items-center gap-2 mb-4">
          <div className="flex text-yellow-500 text-lg">
            {[1, 2, 3, 4, 5].map((s) =>
              averageRating >= s ? <FaStar key={s} /> : <FaRegStar key={s} />
            )}
          </div>
          <span className="text-gray-700 text-sm">
            {averageRating} out of 5 ({reviews.length} review{reviews.length > 1 ? "s" : ""})
          </span>
        </div>
      ) : (
        <p className="text-gray-500 mb-4">No reviews yet.</p>
      )}

      {!token ? (
        <div className="mb-6 bg-white p-4 rounded shadow text-sm text-gray-600">
          <Link to="/login" className="text-tz-navy font-semibold underline">
            Sign in
          </Link>{" "}
          to leave a review.
        </div>
      ) : (
        <form onSubmit={submitReview} className="mb-6 bg-white p-4 rounded shadow">
          <p className="text-sm text-gray-600 mb-3">
            Posting as <span className="font-semibold">{displayName}</span>
          </p>
          <textarea
            placeholder="Your comment"
            value={formData.comment}
            onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
            className="border p-2 w-full mb-3 rounded"
            required
          />
          <div className="flex gap-1 items-center text-yellow-500 text-xl mb-3">
            <span className="text-black text-sm">Rate:</span>
            {[1, 2, 3, 4, 5].map((s) => (
              <span
                key={s}
                onClick={() => setFormData({ ...formData, rating: s })}
                className="cursor-pointer"
              >
                {formData.rating >= s ? <FaStar /> : <FaRegStar />}
              </span>
            ))}
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="bg-tz-navy text-white hover:bg-tz-pink hover:text-white transition-colors duration-300 px-6 py-2 disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit"}
          </button>
        </form>
      )}

      <div className="space-y-4">
        {reviews.map((r) => (
          <div key={r._id} className="bg-white py-2 md:py-4 rounded shadow px-4">
            <div className="flex justify-between mb-1">
              <span className="font-semibold">{r.name}</span>
              <div className="flex text-yellow-500">
                {[1, 2, 3, 4, 5].map((s) =>
                  r.rating >= s ? <FaStar key={s} /> : <FaRegStar key={s} />
                )}
              </div>
            </div>
            <p className="text-gray-700">{r.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewSection;
