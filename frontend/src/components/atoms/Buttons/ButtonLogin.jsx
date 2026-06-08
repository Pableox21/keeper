const ButtonLogin= ({ Children, onClick, type='button', texto}) => {
    return(
        <button 
        type={type}
        color="#ffffff"
        onClick={onClick}
    className="w-full bg-blue-400 text-white p-2 rounded-md text-xs font-semibold shadow-md cursor-pointer transition-all duration-300 hover:bg-blue-500 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-300">
            {Children}
            {texto}
        </button>
        
    );
};

export default ButtonLogin;
