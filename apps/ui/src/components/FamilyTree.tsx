import { useRef } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useTree } from '@/hooks/useTree';
import { useTreePersons } from '@/hooks/usePerson';
import { useTreeRelationships } from '@/hooks/useRelationship';
import { useFamilyTree } from '@/hooks/useFamilyTree';

interface FamilyTreeProps {
  treeId: string;
  width?: number;
  height?: number;
  onPersonSelect?: (personId: string) => void;
}

export function FamilyTree({
  treeId,
  width = 800,
  height = 600,
  onPersonSelect
}: FamilyTreeProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch tree data
  const { tree, isLoading: treeLoading, error: treeError } = useTree(treeId);
  const { persons, isLoading: personsLoading, error: personsError } = useTreePersons(treeId);
  const { relationships, isLoading: relationshipsLoading, error: relationshipsError } = useTreeRelationships(treeId);

  // Set up D3 visualization
  const {
    selectedPerson,
    hoveredPerson,
    setSelectedPerson,
    setHoveredPerson
  } = useFamilyTree(
    containerRef,
    persons || [],
    relationships || [],
    {
      width,
      height,
      onNodeClick: (person) => {
        setSelectedPerson(person);
        onPersonSelect?.(person.id);
      },
      onNodeHover: setHoveredPerson
    }
  );

  // Loading state
  if (treeLoading || personsLoading || relationshipsLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height={height}
        width={width}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (treeError || personsError || relationshipsError) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height={height}
        width={width}
      >
        <Typography color="error">
          Error loading family tree data
        </Typography>
      </Box>
    );
  }

  // Empty state
  if (!tree || !persons?.length) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height={height}
        width={width}
      >
        <Typography>
          No family members found. Add someone to get started!
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      position="relative"
      width={width}
      height={height}
      sx={{
        '& svg': {
          cursor: 'grab',
          '&:active': {
            cursor: 'grabbing'
          }
        }
      }}
    >
      {/* Tree container */}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Hover tooltip */}
      {hoveredPerson && (
        <Box
          position="absolute"
          top={16}
          right={16}
          bgcolor="background.paper"
          boxShadow={2}
          borderRadius={1}
          p={2}
          zIndex={1}
        >
          <Typography variant="subtitle1" gutterBottom>
            {hoveredPerson.firstName} {hoveredPerson.lastName}
          </Typography>
          {hoveredPerson.birthDate && (
            <Typography variant="body2" color="text.secondary">
              Born: {new Date(hoveredPerson.birthDate).toLocaleDateString()}
            </Typography>
          )}
          {hoveredPerson.birthPlace && (
            <Typography variant="body2" color="text.secondary">
              Place: {hoveredPerson.birthPlace}
            </Typography>
          )}
          {hoveredPerson.occupation && (
            <Typography variant="body2" color="text.secondary">
              Occupation: {hoveredPerson.occupation}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
} 