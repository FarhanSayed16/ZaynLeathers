const CheckoutInput = ({ name, placeholder, onChange }) => (
  <input
    name={name}
    onChange={onChange}
    required
    placeholder={placeholder}
    className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black"
  />
)

export default CheckoutInput