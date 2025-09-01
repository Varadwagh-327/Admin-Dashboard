"use client";

import React from "react";

interface ButtonProps {
  label: string;
  onClick?: () => void;
}

export default function CustomButton({ label, onClick }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-xl shadow-md hover:bg-indigo-700 transition-all"
    >
      {label}
    </button>
  );
}
