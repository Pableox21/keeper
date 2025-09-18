import React,{useState} from "react";

function Micomponente() {
    const [mensaje,setMensaje]=useState('');

    const handleClick=()=>{
        setMensaje('¡Boton clickeado!');
    };

    return(
        <div>
            <button onClick={handleClick}>
                Haz click
            </button>
            
        </div>
    )
}