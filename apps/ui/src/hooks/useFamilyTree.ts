import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { Person, Relationship } from '@/types';

interface TreeNode extends d3.HierarchyNode<Person> {
  x: number;
  y: number;
  data: Person;
}

interface TreeLink extends d3.HierarchyLink<Person> {
  source: TreeNode;
  target: TreeNode;
}

interface FamilyTreeOptions {
  width: number;
  height: number;
  nodeRadius: number;
  nodePadding: number;
  linkColor: string;
  nodeColor: string;
  textColor: string;
  orientation: 'vertical' | 'horizontal';
  onNodeClick?: (person: Person) => void;
  onNodeHover?: (person: Person | null) => void;
}

const defaultOptions: FamilyTreeOptions = {
  width: 800,
  height: 600,
  nodeRadius: 30,
  nodePadding: 20,
  linkColor: '#999',
  nodeColor: '#fff',
  textColor: '#333',
  orientation: 'vertical',
};

export function useFamilyTree(
  containerRef: React.RefObject<HTMLDivElement>,
  persons: Person[],
  relationships: Relationship[],
  options: Partial<FamilyTreeOptions> = {}
) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [hoveredPerson, setHoveredPerson] = useState<Person | null>(null);

  const mergedOptions = { ...defaultOptions, ...options };

  useEffect(() => {
    if (!containerRef.current || !persons.length) return;

    // Clear previous SVG
    d3.select(containerRef.current).selectAll('svg').remove();

    // Create SVG
    const svg = d3.select(containerRef.current)
      .append('svg')
      .attr('width', mergedOptions.width)
      .attr('height', mergedOptions.height)
      .attr('viewBox', [0, 0, mergedOptions.width, mergedOptions.height])
      .attr('style', 'max-width: 100%; height: auto;');

    svgRef.current = svg.node();

    // Create hierarchy
    const hierarchy = buildHierarchy(persons, relationships);
    if (!hierarchy) return;

    // Create tree layout
    const treeLayout = d3.tree<Person>()
      .size(
        mergedOptions.orientation === 'vertical'
          ? [mergedOptions.width, mergedOptions.height - 100]
          : [mergedOptions.height - 100, mergedOptions.width]
      )
      .nodeSize([mergedOptions.nodeRadius * 2 + mergedOptions.nodePadding, mergedOptions.nodeRadius * 2 + mergedOptions.nodePadding]);

    const root = treeLayout(hierarchy);

    // Create container group
    const g = svg.append('g')
      .attr('transform', `translate(${mergedOptions.nodeRadius + mergedOptions.nodePadding}, ${mergedOptions.nodeRadius + mergedOptions.nodePadding})`);

    // Draw links
    g.selectAll('path')
      .data(root.links())
      .join('path')
      .attr('fill', 'none')
      .attr('stroke', mergedOptions.linkColor)
      .attr('stroke-width', 1.5)
      .attr('d', d3.linkHorizontal()
        .x(d => mergedOptions.orientation === 'vertical' ? d.x : d.y)
        .y(d => mergedOptions.orientation === 'vertical' ? d.y : d.x)
      );

    // Draw nodes
    const nodes = g.selectAll('g')
      .data(root.descendants())
      .join('g')
      .attr('transform', d => 
        mergedOptions.orientation === 'vertical'
          ? `translate(${d.x},${d.y})`
          : `translate(${d.y},${d.x})`
      );

    // Add circles
    nodes.append('circle')
      .attr('r', mergedOptions.nodeRadius)
      .attr('fill', mergedOptions.nodeColor)
      .attr('stroke', mergedOptions.linkColor)
      .attr('stroke-width', 1.5)
      .on('click', (event, d: TreeNode) => {
        setSelectedPerson(d.data);
        mergedOptions.onNodeClick?.(d.data);
      })
      .on('mouseover', (event, d: TreeNode) => {
        setHoveredPerson(d.data);
        mergedOptions.onNodeHover?.(d.data);
      })
      .on('mouseout', () => {
        setHoveredPerson(null);
        mergedOptions.onNodeHover?.(null);
      });

    // Add images
    nodes.filter(d => d.data.photoUrl)
      .append('clipPath')
      .attr('id', d => `clip-${d.data.id}`)
      .append('circle')
      .attr('r', mergedOptions.nodeRadius);

    nodes.filter(d => d.data.photoUrl)
      .append('image')
      .attr('xlink:href', d => d.data.photoUrl)
      .attr('x', -mergedOptions.nodeRadius)
      .attr('y', -mergedOptions.nodeRadius)
      .attr('width', mergedOptions.nodeRadius * 2)
      .attr('height', mergedOptions.nodeRadius * 2)
      .attr('clip-path', d => `url(#clip-${d.data.id})`);

    // Add labels
    nodes.append('text')
      .attr('dy', mergedOptions.nodeRadius + 20)
      .attr('text-anchor', 'middle')
      .attr('fill', mergedOptions.textColor)
      .text(d => `${d.data.firstName} ${d.data.lastName}`);

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 2])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Center the tree
    const bounds = g.node()?.getBBox();
    if (bounds) {
      const scale = Math.min(
        mergedOptions.width / bounds.width,
        mergedOptions.height / bounds.height
      );
      const x = -bounds.x * scale + (mergedOptions.width - bounds.width * scale) / 2;
      const y = -bounds.y * scale + (mergedOptions.height - bounds.height * scale) / 2;
      svg.call(zoom.transform, d3.zoomIdentity.translate(x, y).scale(scale * 0.9));
    }

  }, [containerRef, persons, relationships, mergedOptions]);

  return {
    selectedPerson,
    hoveredPerson,
    setSelectedPerson,
    setHoveredPerson,
  };
}

function buildHierarchy(persons: Person[], relationships: Relationship[]) {
  if (!persons.length) return null;

  // Create a map of person IDs to their relationships
  const relationshipMap = new Map<string, Set<string>>();
  relationships.forEach(rel => {
    if (rel.type === 'parent-child') {
      if (!relationshipMap.has(rel.from)) {
        relationshipMap.set(rel.from, new Set());
      }
      relationshipMap.get(rel.from)!.add(rel.to);
    }
  });

  // Find root person (person with no parents)
  const childrenIds = new Set(relationships.filter(r => r.type === 'parent-child').map(r => r.to));
  const rootPerson = persons.find(p => !childrenIds.has(p.id));
  if (!rootPerson) return null;

  // Recursive function to build the tree
  function buildNode(personId: string): d3.HierarchyNode<Person> {
    const person = persons.find(p => p.id === personId)!;
    const children = Array.from(relationshipMap.get(personId) || [])
      .map(childId => buildNode(childId));

    return d3.hierarchy(person).children(children);
  }

  return buildNode(rootPerson.id);
} 