'use client';

import { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  Position,
  MarkerType,
  useReactFlow,
  BackgroundVariant
} from 'reactflow';
import 'reactflow/dist/style.css';

import { PersonNode } from './PersonNode';
import { FamilyTreeToolbar } from './FamilyTreeToolbar';
import { PersonDetailsModal } from './PersonDetailsModal';
import { AppPerson, ApiPerson, transformPerson } from '@/lib/transformers';
import { Relationship } from '@/types/relationship';
import toast from 'react-hot-toast';
import dagre from 'dagre';
import api from '@/lib/api';

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 180;
const nodeHeight = 80;

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  dagreGraph.setGraph({ rankdir: 'TB', nodesep: 100, ranksep: 100 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = Position.Top;
    node.sourcePosition = Position.Bottom;
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };
    return node;
  });

  return { nodes, edges };
};

const nodeTypes = {
  person: PersonNode,
};

interface FamilyTreeViewerProps {
  people: AppPerson[];
  relationships: Relationship[];
  className?: string;
}

export function FamilyTreeViewer({ people, relationships, className = '' }: FamilyTreeViewerProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const { fitView } = useReactFlow();

  useEffect(() => {
    if (people && relationships) {
      const { nodes: newNodes, edges: newEdges } = convertToReactFlowFormat(people, relationships);
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(newNodes, newEdges);
      
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);

      setTimeout(() => {
        fitView({ duration: 800 });
      }, 100);
    }
  }, [people, relationships, setNodes, setEdges, fitView]);

  const convertToReactFlowFormat = (people: AppPerson[], relationships: Relationship[]) => {
    const personNodes: Node[] = people.map((person) => ({
      id: person.id,
      type: 'person',
      position: { x: 0, y: 0 }, // Position will be set by dagre
      data: {
        person,
        onEdit: () => setSelectedPersonId(person.id),
      },
    }));

    const relationshipEdges: Edge[] = relationships.map((rel) => ({
      id: `e${rel.person1Id}-${rel.person2Id}`,
      source: rel.person1Id,
      target: rel.person2Id,
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#6b7280', strokeWidth: 1.5 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
        color: '#6b7280',
      },
    }));

    return { nodes: personNodes, edges: relationshipEdges };
  };
  
  const onConnect = useCallback(
    (params: Connection) => {
      // Handle new relationship creation
      const edge = {
        ...params,
        type: 'smoothstep',
        animated: false,
        style: { stroke: '#6b7280', strokeWidth: 2 },
      };
      setEdges((eds) => addEdge(edge, eds));
    },
    [setEdges]
  );

  return (
    <div className={`relative w-full h-full bg-gray-50 ${className}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        className="bg-gray-50"
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        minZoom={0.1}
        maxZoom={2}
        snapToGrid
        snapGrid={[15, 15]}
      >
        <Controls />
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>

      {selectedPersonId && (
        <PersonDetailsModal
          personId={selectedPersonId}
          isOpen={!!selectedPersonId}
          onClose={() => setSelectedPersonId(null)}
          onSave={() => {
            // Refetch the tree data when a person is saved
            const fetchData = async () => {
              try {
                const [personsResponse, relationshipsResponse] = await Promise.all([
                  api.get('/persons'),
                  api.get('/relationships')
                ]);
                
                const transformedData = (personsResponse.data.data as unknown as ApiPerson[]).map(transformPerson);
                setNodes(convertToReactFlowFormat(transformedData, relationshipsResponse.data.data).nodes);
                setEdges(convertToReactFlowFormat(transformedData, relationshipsResponse.data.data).edges);
              } catch (error) {
                console.error('Failed to refresh tree data:', error);
                toast.error('Failed to refresh the family tree');
              }
            };
            fetchData();
          }}
        />
      )}
    </div>
  );
} 