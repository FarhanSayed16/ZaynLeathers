import React, { useContext, useState, useRef, useEffect } from 'react';
import { ShopContext } from '../context/ShopContext';
import { CURRENCIES } from '../utils/currency';

const flags = {
  INR: "🇮🇳",
  USD: "🇺🇸",
  GBP: "🇬🇧",
  CAD: "🇨🇦"
};

const CurrencySelector = () => {
  const { selectedCurrency, setSelectedCurrency } = useContext(ShopContext);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (code) => {
    setSelectedCurrency(code);
    localStorage.setItem("currency", code);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left mr-1 sm:mr-3" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-black transition px-2 py-1 rounded-md hover:bg-gray-100"
      >
        <span className="text-[16px] leading-none">{flags[selectedCurrency]}</span>
        <span className="hidden sm:inline">{selectedCurrency}</span>
        <span className="text-[10px] ml-0.5">▼</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50 overflow-hidden">
          <div className="py-1">
            {Object.keys(CURRENCIES).map((code) => (
              <button
                key={code}
                onClick={() => handleSelect(code)}
                className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-gray-100 transition ${selectedCurrency === code ? 'bg-gray-50 font-bold' : 'text-gray-700'}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[16px] leading-none">{flags[code]}</span>
                  <span>{code}</span>
                </div>
                <span className="text-gray-400">{CURRENCIES[code].symbol}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrencySelector;
