import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Box,
  Typography,
  Divider,
  IconButton,
  Chip
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { Person, PersonFormData, LifeEvent } from '@/types';
import { personService } from '@/services/firestore';
import { useAuth } from '@/hooks/useAuth';
import { EventEditor } from './events/EventEditor';
import { EventList } from './events/EventList';
import ConflictResolutionDialog from './ConflictResolutionDialog';
import type { Person } from '@/types';

interface PersonFormProps {
  personId?: string;
}

export default function PersonForm({ personId }: PersonFormProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<PersonFormData>({
    name: '',
    parents: [],
    children: [],
    spouses: [],
    relations: {}
  });
  const [person, setPerson] = useState<Person | null>(null);
  const [showEventEditor, setShowEventEditor] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<LifeEvent | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [showConflict, setShowConflict] = useState(false);
  const [conflictData, setConflictData] = useState<{
    local: Person;
    remote: Person;
  } | null>(null);

  useEffect(() => {
    if (personId) {
      loadPerson();
    }
  }, [personId]);

  const loadPerson = async () => {
    if (!personId) return;
    
    const personData = await personService.get(personId);
    if (personData) {
      setPerson(personData);
      setFormData({
        name: personData.name,
        lastName: personData.lastName,
        dob: personData.dob,
        dod: personData.dod,
        gender: personData.gender,
        parents: personData.parents,
        children: personData.children,
        spouses: personData.spouses,
        relations: personData.relations,
        photoUrl: personData.photoUrl,
        notes: personData.notes,
        tags: personData.tags,
        birthPlace: personData.birthPlace,
        deathPlace: personData.deathPlace,
        occupation: personData.occupation
      });
    }
  };

  const handleInputChange = (field: keyof PersonFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);
    try {
      if (personId && person) {
        await personService.update(personId, {
          ...person,
          ...formData,
          metadata: {
            ...person.metadata,
            updatedAt: new Date()
          }
        });
      } else {
        const newPerson: Omit<Person, 'id'> = {
          ...formData,
          treeId: 'default', // TODO: Get from context
          uid: user.uid,
          metadata: {
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: user.uid
          },
          lifeEvents: []
        };
        await personService.create(newPerson);
      }
      navigate(-1);
    } catch (err) {
      if (err.message === 'VERSION_CONFLICT' && personId) {
        // Fetch latest version for comparison
        const remotePerson = await personService.get(personId);
        if (remotePerson) {
          setConflictData({
            local: { ...person, ...formData } as Person,
            remote: remotePerson,
          });
          setShowConflict(true);
        }
      } else {
        setError('Failed to save person. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConflictResolution = async (resolution: 'local' | 'remote' | 'merge') => {
    if (!personId || !conflictData) return;

    setLoading(true);
    setError(null);
    
    try {
      const resolvedPerson = await personService.resolveConflict(
        personId,
        resolution
      );
      
      setFormData(resolvedPerson);
      setShowConflict(false);
      setConflictData(null);
      navigate(-1);
    } catch (err) {
      setError('Failed to resolve conflict. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = () => {
    setSelectedEvent(undefined);
    setShowEventEditor(true);
  };

  const handleEditEvent = (event: LifeEvent) => {
    setSelectedEvent(event);
    setShowEventEditor(true);
  };

  const handleSaveEvent = async (event: LifeEvent) => {
    if (!person || !personId) return;

    const currentEvents = person.lifeEvents || [];
    const eventIndex = currentEvents.findIndex(e => e.id === event.id);

    let updatedEvents: LifeEvent[];
    if (eventIndex >= 0) {
      updatedEvents = [
        ...currentEvents.slice(0, eventIndex),
        event,
        ...currentEvents.slice(eventIndex + 1)
      ];
    } else {
      updatedEvents = [...currentEvents, event];
    }

    await personService.update(personId, {
      ...person,
      lifeEvents: updatedEvents
    });

    // Reload person data
    await loadPerson();
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!person || !personId) return;

    const updatedEvents = person.lifeEvents.filter(e => e.id !== eventId);
    await personService.update(personId, {
      ...person,
      lifeEvents: updatedEvents
    });

    // Reload person data
    await loadPerson();
  };

  return (
    <form onSubmit={handleSubmit}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            required
            margin="normal"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Last Name"
            value={formData.lastName || ''}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            margin="normal"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="date"
            label="Date of Birth"
            value={formData.dob || ''}
            onChange={(e) => handleInputChange('dob', e.target.value)}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="date"
            label="Date of Death"
            value={formData.dod || ''}
            onChange={(e) => handleInputChange('dod', e.target.value)}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Gender</InputLabel>
            <Select
              value={formData.gender || ''}
              onChange={(e) => handleInputChange('gender', e.target.value)}
              label="Gender"
            >
              <MenuItem value="male">Male</MenuItem>
              <MenuItem value="female">Female</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Birth Place"
            value={formData.birthPlace || ''}
            onChange={(e) => handleInputChange('birthPlace', e.target.value)}
            margin="normal"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Death Place"
            value={formData.deathPlace || ''}
            onChange={(e) => handleInputChange('deathPlace', e.target.value)}
            margin="normal"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Occupation"
            value={formData.occupation || ''}
            onChange={(e) => handleInputChange('occupation', e.target.value)}
            margin="normal"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Notes"
            value={formData.notes || ''}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            margin="normal"
          />
        </Grid>

        {person && (
          <Grid item xs={12}>
            <Divider sx={{ my: 3 }} />
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Life Events</Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddEvent}
              >
                Add Event
              </Button>
            </Box>
            <EventList
              events={person.lifeEvents || []}
              onEditEvent={handleEditEvent}
              showEditButton
            />
          </Grid>
        )}

        <Grid item xs={12}>
          <Box display="flex" gap={2} mt={3}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate(-1)}
              disabled={loading}
            >
              Cancel
            </Button>
          </Box>
        </Grid>
      </Grid>

      {person && (
        <EventEditor
          open={showEventEditor}
          onClose={() => setShowEventEditor(false)}
          event={selectedEvent}
          person={person}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
        />
      )}

      {showConflict && conflictData && (
        <ConflictResolutionDialog
          open={showConflict}
          localPerson={conflictData.local}
          remotePerson={conflictData.remote}
          onResolve={handleConflictResolution}
          onClose={() => {
            setShowConflict(false);
            setConflictData(null);
          }}
        />
      )}
    </form>
  );
} 