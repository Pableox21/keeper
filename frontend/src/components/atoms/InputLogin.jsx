const InputLogin = ({ type = 'text', placeholder, value, onChange}) => {
    return(
        <input 
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full p-2 bg-transparent border border-blue-400 rounded-md text-xs placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
    );
};
export default InputLogin;
