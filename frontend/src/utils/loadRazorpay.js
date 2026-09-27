let loadingPromise = null;

/** Load Razorpay checkout script only when needed (cart/checkout). */
export function loadRazorpay() {
  if (typeof window === 'undefined') return Promise.reject(new Error('No window'));
  if (window.Razorpay) return Promise.resolve(window.Razorpay);

  if (!loadingPromise) {
    loadingPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(window.Razorpay);
      script.onerror = () => {
        loadingPromise = null;
        reject(new Error('Failed to load Razorpay'));
      };
      document.body.appendChild(script);
    });
  }

  return loadingPromise;
}
