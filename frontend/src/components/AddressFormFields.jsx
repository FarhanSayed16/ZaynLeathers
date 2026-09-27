import { INDIA_STATES } from "../utils/india";

const fieldClass = "input";

const AddressFormFields = ({ value, onChange, showLabel = true }) => {
  const set = (name, val) => onChange({ ...value, [name]: val });

  return (
    <div className="space-y-3">
      {showLabel && (
        <div>
          <label className="text-xs font-semibold text-tz-navy/70">Address label</label>
          <input
            className={fieldClass}
            value={value.label || ""}
            onChange={(e) => set("label", e.target.value)}
            placeholder="Home, Office…"
          />
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-tz-navy/70">First name</label>
          <input
            required
            className={fieldClass}
            value={value.firstName || ""}
            onChange={(e) => set("firstName", e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-tz-navy/70">Last name</label>
          <input
            required
            className={fieldClass}
            value={value.lastName || ""}
            onChange={(e) => set("lastName", e.target.value)}
          />
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-tz-navy/70">Email</label>
        <input
          required
          type="email"
          className={fieldClass}
          value={value.email || ""}
          onChange={(e) => set("email", e.target.value)}
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-tz-navy/70">Phone</label>
        <input
          required
          type="tel"
          inputMode="numeric"
          className={fieldClass}
          value={value.phone || ""}
          onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
          placeholder="10-digit mobile"
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-tz-navy/70">Street address</label>
        <input
          required
          className={fieldClass}
          value={value.street || ""}
          onChange={(e) => set("street", e.target.value)}
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-tz-navy/70">Apartment / landmark (optional)</label>
        <input
          className={fieldClass}
          value={value.apartment || ""}
          onChange={(e) => set("apartment", e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-tz-navy/70">City</label>
          <input
            required
            className={fieldClass}
            value={value.city || ""}
            onChange={(e) => set("city", e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-tz-navy/70">State</label>
          <select
            required
            className={fieldClass}
            value={value.state || ""}
            onChange={(e) => set("state", e.target.value)}
          >
            <option value="">Select state</option>
            {INDIA_STATES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-tz-navy/70">Pincode</label>
          <input
            required
            type="text"
            inputMode="numeric"
            maxLength={6}
            className={fieldClass}
            value={value.zipcode || ""}
            onChange={(e) => set("zipcode", e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="400001"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-tz-navy/70">Country</label>
          <input className={fieldClass} value={value.country || "India"} readOnly />
        </div>
      </div>
    </div>
  );
};

export default AddressFormFields;
