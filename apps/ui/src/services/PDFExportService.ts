import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Person } from '../types';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import * as d3 from 'd3';

export class PDFExportService {
  private async loadImage(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg'));
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = url;
    });
  }

  private async getSubtreeData(personId: string, treeId: string): Promise<Person[]> {
    const q = query(
      collection(db, 'persons'),
      where('treeId', '==', treeId)
    );
    
    const querySnapshot = await getDocs(q);
    const allPersons = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Person));

    // Find the root person
    const root = allPersons.find(p => p.id === personId);
    if (!root) return [];

    // Get all descendants
    const descendants = new Set<string>([personId]);
    let queue = [...root.children];
    
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (!descendants.has(currentId)) {
        descendants.add(currentId);
        const person = allPersons.find(p => p.id === currentId);
        if (person) {
          queue.push(...person.children);
        }
      }
    }

    return allPersons.filter(p => descendants.has(p.id));
  }

  private createTreeVisualization(persons: Person[], rootId: string): string {
    // Create a temporary SVG element
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '800');
    svg.setAttribute('height', '600');

    const width = 800;
    const height = 600;
    const nodeWidth = 120;
    const nodeHeight = 60;

    // Create D3 tree layout
    const root = d3.hierarchy(
      persons.find(p => p.id === rootId),
      person => persons.filter(p => person.children.includes(p.id))
    );

    const treeLayout = d3.tree<Person>()
      .nodeSize([nodeWidth, nodeHeight])
      .separation((a, b) => a.parent === b.parent ? 1.2 : 1.5);

    const tree = treeLayout(root);

    // Create container group with translation
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${width / 2},50)`);
    svg.appendChild(g);

    // Add links
    tree.links().forEach(link => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', '#ccc');
      path.setAttribute('d', d3.linkHorizontal<any, any>()
        .x(d => d.y)
        .y(d => d.x)(link));
      g.appendChild(path);
    });

    // Add nodes
    tree.descendants().forEach(d => {
      const node = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      node.setAttribute('transform', `translate(${d.y},${d.x})`);

      // Add rectangle
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', '-50');
      rect.setAttribute('y', '-20');
      rect.setAttribute('width', '100');
      rect.setAttribute('height', '40');
      rect.setAttribute('rx', '5');
      rect.setAttribute('ry', '5');
      rect.setAttribute('fill', 'white');
      rect.setAttribute('stroke', '#2563eb');
      rect.setAttribute('stroke-width', '2');
      node.appendChild(rect);

      // Add name text
      const nameText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      nameText.setAttribute('dy', '-5');
      nameText.setAttribute('text-anchor', 'middle');
      nameText.textContent = d.data.name;
      node.appendChild(nameText);

      // Add years text
      const yearsText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      yearsText.setAttribute('dy', '15');
      yearsText.setAttribute('text-anchor', 'middle');
      yearsText.setAttribute('class', 'text-sm');
      const birth = d.data.dob ? new Date(d.data.dob).getFullYear() : '';
      const death = d.data.dod ? new Date(d.data.dod).getFullYear() : '';
      yearsText.textContent = birth || death ? `${birth || '?'} - ${death || ''}` : '';
      node.appendChild(yearsText);

      g.appendChild(node);
    });

    return 'data:image/svg+xml;base64,' + btoa(new XMLSerializer().serializeToString(svg));
  }

  async exportToPDF(person: Person): Promise<void> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Add title
    doc.setFontSize(24);
    doc.text(`Family Tree: ${person.name}`, 20, 20);

    // Add person's photo if available
    if (person.photoUrl) {
      try {
        const photoData = await this.loadImage(person.photoUrl);
        doc.addImage(photoData, 'JPEG', 20, 30, 50, 50);
      } catch (error) {
        console.error('Failed to load person photo:', error);
      }
    }

    // Add person details
    doc.setFontSize(12);
    const details = [
      ['Name', person.name + (person.lastName ? ' ' + person.lastName : '')],
      ['Birth', person.dob ? new Date(person.dob).toLocaleDateString() : 'Unknown'],
      ['Death', person.dod ? new Date(person.dod).toLocaleDateString() : '-'],
      ['Gender', person.gender || 'Not specified'],
      ['Birth Place', person.birthPlace || 'Unknown'],
      ['Death Place', person.deathPlace || '-'],
      ['Occupation', person.occupation || 'Unknown'],
      ['Notes', person.notes || '-']
    ];

    // Add details table
    (doc as any).autoTable({
      startY: person.photoUrl ? 90 : 30,
      head: [['Field', 'Value']],
      body: details,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] },
      margin: { left: 20 }
    });

    // Get and add subtree visualization
    const subtreeData = await this.getSubtreeData(person.id, person.treeId);
    if (subtreeData.length > 0) {
      const treeImage = this.createTreeVisualization(subtreeData, person.id);
      
      // Add new page for tree visualization
      doc.addPage();
      doc.setFontSize(16);
      doc.text('Family Tree Visualization', 20, 20);
      
      try {
        doc.addImage(treeImage, 'PNG', 10, 30, 190, 150);
      } catch (error) {
        console.error('Failed to add tree visualization:', error);
        doc.text('Failed to generate tree visualization', 20, 30);
      }
    }

    // Save the PDF
    doc.save(`family-tree-${person.name.toLowerCase().replace(/\s+/g, '-')}.pdf`);
  }
} 