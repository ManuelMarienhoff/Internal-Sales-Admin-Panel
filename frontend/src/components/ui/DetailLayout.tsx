import { useNavigate, useLocation } from 'react-router-dom';

interface DetailLayoutProps {
  title: string;
  backRoute: string;
  isLoading: boolean;
  error?: Error | null;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

const DetailLayout = ({
  title,
  backRoute,
  isLoading,
  error,
  actions,
  children,
}: DetailLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    // Si existe historial previo en la sesión, volver a la página anterior
    // location.key === 'default' significa que es la primera página de la sesión
    if (location.key !== 'default') {
      navigate(-1);
    } else {
      // Fallback: si es la primera página, usar la ruta por defecto
      navigate(backRoute);
    }
  };

  if (isLoading) {
    return (
      <div className="px-12 py-12">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-gray-100 rounded-none transition"
            title="Go back"
          >
            ←
          </button>
          <h1 className="text-4xl font-serif font-bold text-pwc-black">Loading...</h1>
        </div>

        {/* Skeleton Card */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded-none w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded-none w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded-none w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-12 py-12">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-gray-100 rounded-none transition"
            title="Go back"
          >
            ←
          </button>
          <h1 className="text-4xl font-serif font-bold text-pwc-black">{title}</h1>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-700 font-semibold">Error loading details</p>
          <p className="text-red-600 text-sm mt-2">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-12 py-12">
      {/* Header with Back Button and Title */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-gray-100 rounded-none transition text-2xl"
            title="Go back"
          >
            ←
          </button>
          <h1 className="text-4xl font-serif font-bold text-pwc-black">{title}</h1>
        </div>

        {/* Actions (Edit, Delete, etc) */}
        {actions && <div className="flex gap-3">{actions}</div>}
      </div>

      {/* Content Card */}
      <div className="bg-white rounded-lg shadow-md p-8">
        {children}
      </div>
    </div>
  );
};

export default DetailLayout;
