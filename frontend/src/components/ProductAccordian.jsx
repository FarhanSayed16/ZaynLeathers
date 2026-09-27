// src/components/Accordion.jsx
import React, { useState } from 'react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';

const ProductAccordion = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b py-2">
      <div
        className="flex justify-between items-center cursor-pointer text-sm md:text-xs xl:text-sm font-medium text-gray-700"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{title}</span>
        {isOpen ? <FaChevronUp /> : <FaChevronDown />}
      </div>
      {isOpen && (
        <div className="mt-2 text-xs md:text-[10px] xl:text-sm text-gray-700 border-t border-gray-500">
          {children}
        </div>
      )}
    </div>
  );
};

export default ProductAccordion;
