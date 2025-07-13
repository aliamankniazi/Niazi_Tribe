import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Person } from '@/types';
import { personService } from '@/services/firestore';
import { PDFExportService } from '@/services/PDFExportService';
import { Button } from '@mui/material';
import { PictureAsPdf as PdfIcon } from '@mui/icons-material';

const pdfService = new PDFExportService();

export default function PersonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [person, setPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [relations, setRelations] = useState<{
    parents: Person[];
    children: Person[];
    spouses: Person[];
  }>({
    parents: [],
    children: [],
    spouses: [],
  });

  useEffect(() => {
    if (!id) return;

    const unsubscribe = onSnapshot(
      doc(db, 'persons', id),
      async (docSnapshot) => {
        if (!docSnapshot.exists()) {
          setError('Person not found');
          setLoading(false);
          return;
        }

        const personData = { id, ...docSnapshot.data() } as Person;
        setPerson(personData);

        try {
          // Fetch all related persons in parallel
          const [parents, children, spouses] = await Promise.all([
            Promise.all(personData.parents.map(pid => personService.get(pid))),
            Promise.all(personData.children.map(pid => personService.get(pid))),
            Promise.all(personData.spouses.map(pid => personService.get(pid)))
          ]);

          setRelations({
            parents: parents.filter((p): p is Person => p !== null),
            children: children.filter((p): p is Person => p !== null),
            spouses: spouses.filter((p): p is Person => p !== null),
          });
        } catch (err) {
          console.error('Error fetching relations:', err);
        }

        setLoading(false);
      },
      (error) => {
        console.error('Error fetching person:', error);
        setError('Error loading person data');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [id]);

  const handleExport = async () => {
    if (!person) return;
    
    setExporting(true);
    try {
      await pdfService.exportToPDF(person);
    } catch (error) {
      console.error('Error exporting PDF:', error);
    }
    setExporting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (error || !person) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-600 mb-4">{error}</div>
        <Link to="/tree" className="text-indigo-600 hover:text-indigo-800">
          Return to Tree
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="relative h-48 bg-indigo-600">
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/50 to-transparent">
            <h1 className="text-3xl font-bold text-white">
              {person.name} {person.lastName}
            </h1>
            {person.dob && (
              <p className="text-white/90">
                {person.dob} - {person.dod || 'Present'}
              </p>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left column */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
              <dl className="space-y-2">
                <div>
                  <dt className="text-gray-500">Gender</dt>
                  <dd className="font-medium">{person.gender || 'Not specified'}</dd>
                </div>
                {person.birthPlace && (
                  <div>
                    <dt className="text-gray-500">Birth Place</dt>
                    <dd className="font-medium">{person.birthPlace}</dd>
                  </div>
                )}
                {person.occupation && (
                  <div>
                    <dt className="text-gray-500">Occupation</dt>
                    <dd className="font-medium">{person.occupation}</dd>
                  </div>
                )}
                {person.notes && (
                  <div>
                    <dt className="text-gray-500">Notes</dt>
                    <dd className="font-medium whitespace-pre-wrap">{person.notes}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Right column */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Family Relationships</h2>
              
              {/* Parents */}
              <div className="mb-4">
                <h3 className="text-gray-500 mb-2">Parents</h3>
                {relations.parents.length > 0 ? (
                  <ul className="space-y-2">
                    {relations.parents.map(parent => (
                      <li key={parent.id}>
                        <Link
                          to={`/person/${parent.id}`}
                          className="text-indigo-600 hover:text-indigo-800"
                        >
                          {parent.name} {parent.lastName}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-400">No parents listed</p>
                )}
              </div>

              {/* Spouses */}
              <div className="mb-4">
                <h3 className="text-gray-500 mb-2">Spouses</h3>
                {relations.spouses.length > 0 ? (
                  <ul className="space-y-2">
                    {relations.spouses.map(spouse => (
                      <li key={spouse.id}>
                        <Link
                          to={`/person/${spouse.id}`}
                          className="text-indigo-600 hover:text-indigo-800"
                        >
                          {spouse.name} {spouse.lastName}
                        </Link>
                        <span className="text-gray-400 ml-2">
                          ({person.relations[spouse.id] || 'spouse'})
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-400">No spouses listed</p>
                )}
              </div>

              {/* Children */}
              <div>
                <h3 className="text-gray-500 mb-2">Children</h3>
                {relations.children.length > 0 ? (
                  <ul className="space-y-2">
                    {relations.children.map(child => (
                      <li key={child.id}>
                        <Link
                          to={`/person/${child.id}`}
                          className="text-indigo-600 hover:text-indigo-800"
                        >
                          {child.name} {child.lastName}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-400">No children listed</p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex space-x-4">
            <Link
              to={`/tree?focus=${person.id}`}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              View in Tree
            </Link>
            <Link
              to={`/edit/${person.id}`}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Edit Details
            </Link>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<PdfIcon />}
              onClick={handleExport}
              disabled={exporting}
            >
              {exporting ? 'Exporting...' : 'Export PDF'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 