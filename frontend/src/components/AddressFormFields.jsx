import { INDIA_STATES } from "../utils/india";

const fieldClass = "input";

const COUNTRIES = [
  ["IN", "India"],
  ["US", "United States"],
  ["GB", "United Kingdom"],
  ["CA", "Canada"],
  ["AU", "Australia"],
  ["NZ", "New Zealand"],
  ["AE", "United Arab Emirates"],
  ["SA", "Saudi Arabia"],
  ["QA", "Qatar"],
  ["KW", "Kuwait"],
  ["OM", "Oman"],
  ["BH", "Bahrain"],
  ["SG", "Singapore"],
  ["MY", "Malaysia"],
  ["DE", "Germany"],
  ["FR", "France"],
  ["IT", "Italy"],
  ["ES", "Spain"],
  ["NL", "Netherlands"],
  ["BE", "Belgium"],
  ["SE", "Sweden"],
  ["IE", "Ireland"],
  ["CH", "Switzerland"],
  ["JP", "Japan"],
  ["KR", "South Korea"],
  ["HK", "Hong Kong"],
];

function countryCode(value) {
  const raw = String(value || "IN").trim();
  if (!raw || raw.toLowerCase() === "india") return "IN";
  const hit = COUNTRIES.find(
    ([code, name]) => code.toLowerCase() === raw.toLowerCase() || name.toLowerCase() === raw.toLowerCase()
  );
  return hit ? hit[0] : "IN";
}

const AddressFormFields = ({ value, onChange, showLabel = true }) => {
  const set = (name, val) => onChange({ ...value, [name]: val });
  const country = countryCode(value.country);
  const inIndia = country === "IN";

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
          onChange={(e) =>
            set("phone", e.target.value.replace(/\D/g, "").slice(0, inIndia ? 10 : 15))
          }
          placeholder={inIndia ? "10-digit mobile" : "Phone number"}
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
          <label className="text-xs font-semibold text-tz-navy/70">
            {inIndia ? "State" : "State / region"}
          </label>
          {inIndia ? (
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
          ) : (
            <input
              className={fieldClass}
              value={value.state || ""}
              onChange={(e) => set("state", e.target.value)}
              placeholder="State or region"
            />
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-tz-navy/70">
            {inIndia ? "Pincode" : "Postal code"}
          </label>
          <input
            required
            type="text"
            inputMode={inIndia ? "numeric" : "text"}
            maxLength={inIndia ? 6 : 12}
            className={fieldClass}
            value={value.zipcode || ""}
            onChange={(e) =>
              set(
                "zipcode",
                inIndia
                  ? e.target.value.replace(/\D/g, "").slice(0, 6)
                  : e.target.value.slice(0, 12)
              )
            }
            placeholder={inIndia ? "400001" : "Postal code"}
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-tz-navy/70">Country</label>
          <select
            className={fieldClass}
            value={country}
            onChange={(e) =>
              onChange({
                ...value,
                country: e.target.value,
                state: e.target.value === "IN" ? "" : value.state,
                zipcode: "",
              })
            }
          >
            {COUNTRIES.map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default AddressFormFields;
