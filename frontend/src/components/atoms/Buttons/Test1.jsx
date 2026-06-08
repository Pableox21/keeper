import React from 'react';
/*import React, {useState} from 'react';*/
import Icon from '../Icon';
import { 
   PencilIcon,
   PlusIcon,
   TrashIcon,
   ArrowPathIcon,
   ArrowUturnLeftIcon
  } from '@heroicons/react/24/outline';

const Boton = ({iconoSeleccionaeddo, texto, onClick, color }) => {
  return (
    
    <button
      onClick={onClick}
      className={`btn btn-${color}-300 bg-slate-700 `}
    >
      <Icon 
                icon={iconoSeleccionaeddo} 
                size="md" 
                color="#60a5fa" // text-blue-400 
            />
 
      {texto}
    </button>
  );
};

const Test = () => {
  const manejarClick = () => {
    alert('¡Hiciste clic en el botón!');
  };
  return (
    <div className="flex flex-row gap-4 items-center justify-center ">
      <Boton iconoSeleccionaeddo={PlusIcon} texto="Añadir" onClick={manejarClick} background="#314153"/>
      <Boton iconoSeleccionaeddo={PencilIcon} texto="Modificar" onClick={manejarClick} />
      <Boton iconoSeleccionaeddo={TrashIcon} texto="Eliminar" onClick={manejarClick} />
      <Boton iconoSeleccionaeddo={ArrowPathIcon} texto="Actualizar" onClick={manejarClick} />
      <Boton iconoSeleccionaeddo={ArrowUturnLeftIcon} texto="Atras" onClick={manejarClick} />
    </div>
    
  )
}

export default Test

/*/function Añadir() {
  const [message, setMessage] = useState('');

  const handleInsert = async () => {
    try{
      const response = await fetch('http://localhost:3000',{
        method: 'POST',
        hasders:{
          'Content-Type': 'app/json'
        },
        body: JSON.stringify({
          id:''
        })
      })
  }
}*/