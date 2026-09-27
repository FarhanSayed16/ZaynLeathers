const SkeletonOrder = () => (
  <div className="bg-white rounded-2xl p-5 shadow-sm border border-tz-pink-soft animate-pulse mb-6">
    <div className="h-4 w-1/3 bg-tz-pink-soft mb-4 rounded-full"></div>
    <div className="flex gap-4">
      <div className="w-20 h-20 bg-tz-pink-soft rounded-2xl"></div>
      <div className="flex-1 space-y-3">
        <div className="h-3 bg-tz-pink-soft w-2/3 rounded-full"></div>
        <div className="h-3 bg-tz-pink-soft w-1/2 rounded-full"></div>
      </div>
    </div>
  </div>
);

export default SkeletonOrder;