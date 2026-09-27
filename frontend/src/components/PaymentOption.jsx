const PaymentOption = ({ active, label, onClick }) => (
  <div
    onClick={onClick}
    className={`cursor-pointer border rounded-lg px-6 py-4 flex items-center gap-3 transition
      ${active ? "border-black bg-gray-100" : "border-gray-300 hover:border-black"}`}
  >
    <div className={`w-4 h-4 rounded-full border ${active && "bg-black"}`} />
    <p className="font-medium">{label}</p>
  </div>
)

export default PaymentOption