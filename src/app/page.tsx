import Image from "next/image";

export default function Home() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-row gap-[32px] row-start-2 items-start sm:items-start">
        <div className="d-flex">
        <div>
        </div>
         <div>
          <button
          className=" btn-toogle flex items-center gap-2">
            <Image
          className="dark:invert"
          src="/bar.svg"
          alt="menu logo"
          width={45}
          height={38}
          priority/>
            Keeper
          </button>
          <ul className="flex-col gap-5 flex">
            <li><button>Productos</button></li>
            <li><button>Precios de venta</button></li>
            <li><button>Almacenes</button></li>
            <li><button>Ordenes de trabajo</button></li>
            <li><button>Inventario inicial</button></li>
            <li><button>Salida a uso de material</button></li>
            <li><button>Ingresos de prod.</button></li>
            <li><button>Bodega</button></li>
            <li><button>Traspaso</button></li>
            <li><button>Ajuste de inventario</button></li>
          </ul>
         </div>
         
        </div>
        <div>
          <button
           className="flex items-center">
            <Image
              className="dark:invert"
              src="/re.svg"
              alt="nuevo icono"
              width={20}
              height={20}
            />
            Nuevo
          </button>
         </div>
         <div>
          <button
            className="flex items-center">
            <Image
              className="dark:invert"
              src="/edit.svg"
              alt="modificar icono"
              width={20}
              height={20}
            />
            Modificar
          </button>
         </div>
         <div>
          <button
            className="flex items-center">
            <Image
              className="dark:invert"
              src="/trash.svg"
              alt="eliminar icono"
              width={20}
              height={20}
            />
            Eliminar
          </button>
         </div>
         <div>
          <button
            className="flex items-center">
            <Image
              className="dark:invert"
              src="/delete.svg"
              alt="eliminar icono"
              width={20}
              height={20}
            />
            Salir
          </button>
         </div>
         <div>
          <button
            className="flex items-center">
            <Image
              className="dark:invert"
              src="/reload.svg"
              alt="eliminar icono"
              width={20}
              height={20}
            />
            Recargar
          </button>
         </div>
         <div>
          <button
          className="flex items-center">
            <Image
              className="dark:invert"
              src="/delete.svg"
              alt="print icono"
              width={20}
              height={20}
            />
            Imprimir
          </button>
         </div>
         <div>
          <button
            className="flex items-center">
            <Image
              className="dark:invert"
              src="/search.svg"
              alt="eliminar icono"
              width={20}
              height={20}
            />
            Buscar
          </button>
         </div>
         <div>
          <button
            className="flex items-center">
            <Image
              className="dark:invert"
              src="/export.svg"
              alt="importar icono"
              width={20}
              height={20}
            />
            Importar a excel
          </button>
         </div>
         <div>
          <button
            className="flex items-center">
            <Image
              className="dark:invert"
              src="/import.svg"
              alt="exportar icono"
              width={20}
              height={20}
            />
            Exportar a excel
          </button>
         </div>
      </main>
    </div>
  );
}
