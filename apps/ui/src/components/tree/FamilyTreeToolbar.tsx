import { 
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  ArrowsPointingOutIcon,
  MapIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

interface FamilyTreeToolbarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomToFit: () => void;
  onCenterView: () => void;
  onAddPerson: () => void;
  isLoading?: boolean;
}

export function FamilyTreeToolbar({
  onZoomIn,
  onZoomOut,
  onZoomToFit,
  onCenterView,
  onAddPerson,
  isLoading = false
}: FamilyTreeToolbarProps) {
  return (
    <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg border border-gray-200 p-2">
      <div className="flex flex-col space-y-2">
        <button
          onClick={onZoomIn}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          title="Zoom In"
          disabled={isLoading}
        >
          <MagnifyingGlassPlusIcon className="w-5 h-5" />
        </button>
        
        <button
          onClick={onZoomOut}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          title="Zoom Out"
          disabled={isLoading}
        >
          <MagnifyingGlassMinusIcon className="w-5 h-5" />
        </button>
        
        <button
          onClick={onZoomToFit}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          title="Fit to View"
          disabled={isLoading}
        >
          <ArrowsPointingOutIcon className="w-5 h-5" />
        </button>
        
        <button
          onClick={onCenterView}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          title="Center View"
          disabled={isLoading}
        >
          <MapIcon className="w-5 h-5" />
        </button>
        
        <div className="border-t border-gray-200 my-1"></div>
        
        <button
          onClick={onAddPerson}
          className="p-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-md transition-colors"
          title="Add Person"
          disabled={isLoading}
        >
          <PlusIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
} 