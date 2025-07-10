import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { UserIcon, PlusIcon, PencilIcon } from '@heroicons/react/24/outline';
import { AppPerson } from '@/lib/transformers';
import { useSpring, animated } from 'react-spring';

interface PersonNodeProps {
  data: {
    person: AppPerson;
    onEdit: () => void;
  };
  selected: boolean;
}

export const PersonNode = memo(({ data, selected }: PersonNodeProps) => {
  const { person, onEdit } = data;
  const styles = useSpring({
    from: { opacity: 0, transform: 'translateY(-20px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
    config: { duration: 300 }
  });

  const getLifespan = () => {
    const birthYear = person.birthDate ? new Date(person.birthDate).getFullYear() : '?';
    const deathYear = person.deathDate ? new Date(person.deathDate).getFullYear() : '';
    
    if (deathYear) {
      return `(${birthYear} - ${deathYear})`;
    }
    return `(b. ${birthYear})`;
  };

  const genderColor = person.gender === 'male' 
    ? 'border-blue-500 bg-blue-50' 
    : person.gender === 'female' 
    ? 'border-pink-500 bg-pink-50' 
    : 'border-gray-500 bg-gray-50';

  return (
    <animated.div style={styles} className="relative group">
      {/* Connection handles */}
      <Handle type="target" position={Position.Top} className="!bg-gray-400 opacity-50" />
      <Handle type="source" position={Position.Bottom} className="!bg-gray-400 opacity-50" />
      
      {/* Person card */}
      <div
        className={`
          w-[180px] p-3 rounded-lg border-2 bg-white shadow-md
          transition-all duration-200 hover:shadow-xl hover:scale-105 cursor-pointer
          ${genderColor}
          ${selected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}
        `}
        onClick={onEdit}
      >
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center border-2 border-white shadow-sm flex-shrink-0">
            {person.photoUrl ? (
               <img
                src={person.photoUrl}
                alt={person.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <UserIcon className="w-6 h-6 text-gray-500" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              {person.name}
            </h3>
            <p className="text-xs text-gray-600">
              {getLifespan()}
            </p>
          </div>
        </div>
      </div>

      {/* Action buttons (show on hover) */}
      <div className="absolute -top-3 -right-3 p-1 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-indigo-700 hover:scale-110 transition-all"
          title="Edit person"
        >
          <PencilIcon className="w-4 h-4" />
        </button>
      </div>
    </animated.div>
  );
});

PersonNode.displayName = 'PersonNode'; 