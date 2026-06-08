import React from "react";


const Label= ({Children , htmlFor}) => {
  return(
    <label htmlFor={htmlFor}
    className="block font-semibold text-gray-300"
    >
        {Children}
    </label>
  ); 
};

export default Label;