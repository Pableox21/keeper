import Label from '../atoms/Label';
import InputLogin from "../atoms/InputLogin";

const Field = ({ label, type, id, value, onChange, placeholder }) => {
    return (
        <div className="w-full">
            <Label htmlFor={id}>{label}</Label>
            <InputLogin
                type={type}
                id={id}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
            />
        </div>
    );
};
export default Field;
