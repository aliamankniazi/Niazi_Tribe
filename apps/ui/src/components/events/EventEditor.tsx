import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Box,
  Typography,
  Grid,
  Chip
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { EventType, LifeEvent, Person } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { personService } from '@/services/firestore';

interface EventEditorProps {
  open: boolean;
  onClose: () => void;
  event?: LifeEvent;
  person: Person;
  onSave: (event: LifeEvent) => Promise<void>;
  onDelete?: (eventId: string) => Promise<void>;
}

const eventTypes: EventType[] = [
  'birth',
  'death',
  'marriage',
  'divorce',
  'education',
  'career',
  'residence',
  'immigration',
  'military',
  'achievement',
  'medical',
  'other'
];

const defaultEvent: Omit<LifeEvent, 'id' | 'metadata'> = {
  type: 'other',
  date: '',
  description: '',
  relatedPersons: [],
  media: []
};

export const EventEditor: React.FC<EventEditorProps> = ({
  open,
  onClose,
  event,
  person,
  onSave,
  onDelete
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<Partial<LifeEvent>>(defaultEvent);
  const [relatedPersonSearch, setRelatedPersonSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (event) {
      setFormData(event);
    } else {
      setFormData(defaultEvent);
    }
  }, [event]);

  const handleInputChange = (field: keyof LifeEvent, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSearchPerson = async (query: string) => {
    setRelatedPersonSearch(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const results = await personService.search(query);
      setSearchResults(results.filter(p => p.id !== person.id));
    } catch (error) {
      console.error('Error searching persons:', error);
    }
  };

  const handleAddRelatedPerson = (personId: string) => {
    const currentRelated = formData.relatedPersons || [];
    if (!currentRelated.includes(personId)) {
      handleInputChange('relatedPersons', [...currentRelated, personId]);
    }
    setRelatedPersonSearch('');
    setSearchResults([]);
  };

  const handleRemoveRelatedPerson = (personId: string) => {
    const currentRelated = formData.relatedPersons || [];
    handleInputChange(
      'relatedPersons',
      currentRelated.filter(id => id !== personId)
    );
  };

  const handleAddMedia = async (file: File) => {
    // TODO: Implement media upload
    console.log('Media upload not implemented yet');
  };

  const handleSubmit = async () => {
    if (!user || !formData.type || !formData.date || !formData.description) {
      return;
    }

    setLoading(true);
    try {
      const eventData: LifeEvent = {
        id: event?.id || Math.random().toString(36).substr(2, 9),
        ...formData as Omit<LifeEvent, 'id' | 'metadata'>,
        metadata: {
          createdAt: event?.metadata.createdAt || new Date(),
          updatedAt: new Date(),
          createdBy: event?.metadata.createdBy || user.uid
        }
      };

      await onSave(eventData);
      onClose();
    } catch (error) {
      console.error('Error saving event:', error);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!event?.id || !onDelete) return;

    setLoading(true);
    try {
      await onDelete(event.id);
      onClose();
    } catch (error) {
      console.error('Error deleting event:', error);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {event ? 'Edit Life Event' : 'Add Life Event'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Event Type</InputLabel>
              <Select
                value={formData.type || ''}
                onChange={(e) => handleInputChange('type', e.target.value)}
                label="Event Type"
              >
                {eventTypes.map(type => (
                  <MenuItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Title (Optional)"
              value={formData.title || ''}
              onChange={(e) => handleInputChange('title', e.target.value)}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="date"
              label="Date"
              value={formData.date || ''}
              onChange={(e) => handleInputChange('date', e.target.value)}
              margin="normal"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="date"
              label="End Date (Optional)"
              value={formData.endDate || ''}
              onChange={(e) => handleInputChange('endDate', e.target.value)}
              margin="normal"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Location"
              value={formData.location || ''}
              onChange={(e) => handleInputChange('location', e.target.value)}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Description"
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Related Persons
            </Typography>
            <Box mb={2}>
              <TextField
                fullWidth
                label="Search Person"
                value={relatedPersonSearch}
                onChange={(e) => handleSearchPerson(e.target.value)}
                margin="normal"
              />
              {searchResults.length > 0 && (
                <Box mt={1} maxHeight={200} overflow="auto">
                  {searchResults.map(person => (
                    <Button
                      key={person.id}
                      onClick={() => handleAddRelatedPerson(person.id)}
                      fullWidth
                      sx={{ justifyContent: 'flex-start', textAlign: 'left', mb: 1 }}
                    >
                      {person.name} {person.lastName}
                    </Button>
                  ))}
                </Box>
              )}
            </Box>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {formData.relatedPersons?.map(personId => (
                <Chip
                  key={personId}
                  label={personId} // TODO: Get person name
                  onDelete={() => handleRemoveRelatedPerson(personId)}
                />
              ))}
            </Box>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Media
            </Typography>
            <input
              accept="image/*,application/pdf"
              style={{ display: 'none' }}
              id="media-file-input"
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleAddMedia(file);
              }}
            />
            <label htmlFor="media-file-input">
              <Button
                variant="outlined"
                component="span"
                startIcon={<AddIcon />}
              >
                Add Media
              </Button>
            </label>
            {formData.media && formData.media.length > 0 && (
              <Box mt={2} display="flex" flexWrap="wrap" gap={2}>
                {formData.media.map((item, index) => (
                  <Box
                    key={index}
                    position="relative"
                    sx={{ width: 100, height: 100 }}
                  >
                    {item.type === 'image' ? (
                      <img
                        src={item.url}
                        alt={item.caption || ''}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid #ccc'
                        }}
                      >
                        Document
                      </Box>
                    )}
                    <IconButton
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        bgcolor: 'background.paper'
                      }}
                      onClick={() => {
                        const newMedia = [...(formData.media || [])];
                        newMedia.splice(index, 1);
                        handleInputChange('media', newMedia);
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        {event && onDelete && (
          <Button
            onClick={handleDelete}
            color="error"
            disabled={loading}
          >
            Delete
          </Button>
        )}
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={loading || !formData.type || !formData.date || !formData.description}
        >
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 