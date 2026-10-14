import { useState, useEffect, useCallback } from 'react';
import { fetchMiPerfil } from '../../api/usuarios';

const ROLE_LABELS = {
    ADMIN: 'Administrador',
    ALMACEN: 'Almacén',
    SUPERVISOR: 'Supervisor',
    USUARIO: 'Usuario',
    SOLO_LECTURA: 'Solo lectura'
};

const ROLE_DESCRIPTIONS = {
    ADMIN: 'Control total del sistema, incluida la gestión de usuarios.',
    ALMACEN: 'Acceso al área de Inventarios.'
};

const ESTADO_LABELS = {
    ACTIVO: 'Activo',
    INACTIVO: 'Deshabilitado'
};

const getInitials = (perfil) => {
    const base = perfil.nombre_completo?.trim() || perfil.username || 'U';
    const parts = base.split(/\s+/);
    const initials = parts.length > 1 ? parts[0][0] + parts[1][0] : base.substring(0, 2);
    return initials.toUpperCase();
};

const formatDateTime = (value) => (value ? new Date(value).toLocaleString('es-BO') : null);

const formatDate = (value) =>
    value
        ? new Date(value).toLocaleDateString('es-BO', { day: 'numeric', month: 'long', year: 'numeric' })
        : null;

function InfoItem({ label, value }) {
    return (
        <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</dt>
            <dd className="mt-1 text-sm text-gray-900 break-words">{value || '—'}</dd>
        </div>
    );
}

function Section({ title, children }) {
    return (
        <section className="px-6 py-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</dl>
        </section>
    );
}

function Profile() {
    const [perfil, setPerfil] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadPerfil = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await fetchMiPerfil();
            setPerfil(data);
        } catch (err) {
            setError('No se pudo cargar tu perfil: ' + err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadPerfil();
    }, [loadPerfil]);

    if (loading) {
        return <div className="p-6 text-center text-gray-500">Cargando perfil...</div>;
    }

    if (error) {
        return (
            <div className="p-6 flex flex-col items-center gap-3">
                <div role="alert" className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                </div>
                <button
                    type="button"
                    onClick={loadPerfil}
                    className="px-3 py-1.5 text-sm rounded-md bg-blue-500 text-white hover:bg-blue-600 cursor-pointer"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    if (!perfil) return null;

    const activo = perfil.estado === 'ACTIVO';

    return (
        <div className="h-full overflow-y-auto p-4">
            <div className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-lg shadow-sm">
                {/* Cabecera */}
                <div className="flex items-center gap-4 px-6 py-5">
                    <div className="w-20 h-20 shrink-0 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-md select-none">
                        {getInitials(perfil)}
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-xl font-bold text-gray-900 truncate">
                            {perfil.nombre_completo || perfil.username}
                        </h2>
                        <p className="text-sm text-gray-500 truncate">@{perfil.username}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                {ROLE_LABELS[perfil.rol] || perfil.rol}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                                {ESTADO_LABELS[perfil.estado] || perfil.estado}
                            </span>
                        </div>
                        {ROLE_DESCRIPTIONS[perfil.rol] && (
                            <p className="mt-2 text-xs text-gray-500">{ROLE_DESCRIPTIONS[perfil.rol]}</p>
                        )}
                    </div>
                </div>

                <Section title="Información personal">
                    <InfoItem label="Nombre completo" value={perfil.nombre_completo} />
                    <InfoItem label="Email" value={perfil.email} />
                    <InfoItem label="Teléfono" value={perfil.telefono} />
                    <InfoItem label="CI" value={perfil.ci} />
                    <InfoItem label="Departamento" value={perfil.departamento} />
                </Section>

                <Section title="Cuenta">
                    <InfoItem label="Usuario" value={perfil.username} />
                    <InfoItem label="Rol" value={ROLE_LABELS[perfil.rol] || perfil.rol} />
                    <InfoItem label="Estado" value={ESTADO_LABELS[perfil.estado] || perfil.estado} />
                    <InfoItem label="Miembro desde" value={formatDate(perfil.created_at)} />
                    <InfoItem label="Última actividad" value={formatDateTime(perfil.ultimo_acceso)} />
                </Section>
            </div>
        </div>
    );
}

export default Profile;
